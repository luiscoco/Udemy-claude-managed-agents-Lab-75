import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Router, json, type Request, type Response } from 'express';
import { z } from 'zod';
import { lab65RunSchema, lab65ToolInputSchema } from '../../shared/lab65-human-approval.js';
import { apiError } from '../lib/errors.js';

type Channel = 'local' | 'slack' | 'teams' | 'email';
type Proposal = { id: string; owner: string; reviewer: string; action: 'archive_fictional_case';
  args: Readonly<{ caseId: 'CASE-2042'; reason: string }>; eventId: string; businessKey: string;
  createdAt: number; expiresAt: number; state: 'pending' | 'approved' | 'rejected' | 'expired';
  notified: Channel | null; notifying: boolean; audit: string[] };
const toolSchema = (() => { const { $schema: _dialect, ...schema } = z.toJSONSchema(lab65ToolInputSchema,
  { target: 'draft-2020-12', io: 'input' }); return schema; })();
export const lab65ToolDefinition = { type: 'custom' as const, name: 'propose_case_archive',
  description: 'Propose one fictional case archive; never execute it.', input_schema: toolSchema };
const reviewerFor = (owner: string) => `local-reviewer:${owner}`;
const safeOwner = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);

async function deliver(channel: Exclude<Channel, 'local'>, proposal: Proposal, env: NodeJS.ProcessEnv,
  fetcher: typeof fetch) {
  if (env.LAB65_EXTERNAL_NOTIFICATIONS !== '1') throw new Error('External notifications are disabled.');
  const message = `Review fictional ${proposal.action} for ${proposal.args.caseId}. Proposal ${proposal.id}. Open the local learning platform; this notification is not approval.`;
  let url: string; let headers: Record<string, string> = { 'Content-Type': 'application/json' }; let body: unknown;
  if (channel === 'slack') {
    url = env.LAB65_SLACK_WEBHOOK_URL ?? '';
    if (new URL(url).protocol !== 'https:' || new URL(url).hostname !== 'hooks.slack.com') throw new Error('Invalid Slack webhook host.');
    body = { text: message };
  } else if (channel === 'teams') {
    url = env.LAB65_TEAMS_WORKFLOW_URL ?? '';
    const host = new URL(url).hostname;
    if (new URL(url).protocol !== 'https:' || !/(^|\.)logic\.azure\.com$|(^|\.)powerautomate\.com$/.test(host))
      throw new Error('Invalid Teams Workflow host.');
    body = { text: message };
  } else {
    const sender = env.LAB65_GRAPH_SENDER, recipient = env.LAB65_GRAPH_RECIPIENT, token = env.LAB65_GRAPH_TOKEN;
    if (!sender || !recipient || !token || !/^[^@\s]+@[^@\s]+$/.test(sender) || !/^[^@\s]+@[^@\s]+$/.test(recipient))
      throw new Error('Graph sender, recipient and token are required.');
    url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;
    headers = { ...headers, Authorization: `Bearer ${token}` };
    body = { message: { subject: `Review ${proposal.args.caseId}`,
      body: { contentType: 'Text', content: message }, toRecipients: [{ emailAddress: { address: recipient } }] }, saveToSentItems: false };
  }
  const response = await fetcher(url, { method: 'POST', headers, body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!response.ok) throw new Error(`Notification provider returned HTTP ${response.status}.`);
}

export class Lab65ApprovalStore {
  private readonly db: DatabaseSync;
  private readonly proposals = new Map<string, Proposal>();
  private readonly reviewers = new Map<string, { owner: string; reviewer: string; expiresAt: number }>();
  constructor(dbPath = 'artifacts/lab65/approval.sqlite', private readonly now = () => Date.now(),
    private readonly env: NodeJS.ProcessEnv = process.env, private readonly fetcher: typeof fetch = fetch) {
    mkdirSync(dirname(dbPath), { recursive: true }); this.db = new DatabaseSync(dbPath);
    this.db.exec('CREATE TABLE IF NOT EXISTS effects (business_key TEXT PRIMARY KEY, case_id TEXT NOT NULL, proposal_id TEXT NOT NULL, executed_at INTEGER NOT NULL)');
  }
  close() { this.db.close(); }
  reviewerSession(owner: string) { const token = randomBytes(24).toString('base64url');
    if (this.reviewers.size >= 100) this.reviewers.delete(this.reviewers.keys().next().value!);
    this.reviewers.set(token, { owner, reviewer: reviewerFor(owner), expiresAt: this.now() + 900000 }); return token; }
  private reviewer(token: string | undefined, owner: string) { const session = token && this.reviewers.get(token);
    if (!session || session.owner !== owner || session.expiresAt <= this.now()) throw new Error('Trusted local reviewer session required.');
    return session.reviewer; }
  private get(id: string, owner: string) { const proposal = this.proposals.get(id);
    if (!proposal || proposal.owner !== owner) throw new Error('Proposal not found for owner.'); return proposal; }
  private refresh(proposal: Proposal) { if (proposal.state === 'pending' && proposal.expiresAt <= this.now()) {
    proposal.state = 'expired'; proposal.audit.push('Expired before decision.'); } }
  snapshot(owner: string) { const proposals = [...this.proposals.values()].filter(item => item.owner === owner).map(item => {
    this.refresh(item); return { id: item.id, action: item.action, args: item.args, eventId: item.eventId,
      businessKey: item.businessKey, reviewer: item.reviewer, expiresAt: item.expiresAt,
      state: item.state, notified: item.notified, audit: [...item.audit] }; });
    const effects = this.db.prepare('SELECT business_key, case_id, proposal_id FROM effects ORDER BY executed_at').all()
      .filter(row => proposals.some(item => item.id === row.proposal_id));
    return { proposals, effects, reviewerMode: 'local same-origin fixture session', providerCalls: 0 };
  }
  handleTool(owner: string, event: { type: string; id: string; name: string; input: unknown }) {
    if (event.type !== 'agent.custom_tool_use' || !/^sevt_[A-Za-z0-9_-]{1,80}$/.test(event.id) ||
      event.name !== lab65ToolDefinition.name) throw new Error('Invalid Managed custom-tool event.');
    const args = lab65ToolInputSchema.parse(event.input);
    if (this.proposals.size >= 50) throw new Error('Approval proposal capacity reached.');
    const proposal: Proposal = { id: randomUUID(), owner, reviewer: reviewerFor(owner), action: 'archive_fictional_case',
      args: Object.freeze({ ...args }), eventId: event.id, businessKey: `archive:${owner}:${args.caseId}`, createdAt: this.now(),
      expiresAt: this.now() + 300000, state: 'pending', notified: null, notifying: false,
      audit: ['Host validated closed custom-tool input.', 'Immutable proposal created; no effect executed.'] };
    this.proposals.set(proposal.id, proposal);
    return { type: 'user.custom_tool_result' as const, custom_tool_use_id: event.id,
      content: [{ type: 'text' as const, text: JSON.stringify({ proposalId: proposal.id, state: 'pending' }) }],
      is_error: false, proposalId: proposal.id };
  }
  propose(owner: string) { const eventId = `sevt_${randomUUID().replaceAll('-', '')}`;
    const result = this.handleTool(owner, { type: 'agent.custom_tool_use', id: eventId,
      name: lab65ToolDefinition.name, input: { caseId: 'CASE-2042', reason: 'Fictional case closure requested.' } });
    return { toolResult: result, snapshot: this.snapshot(owner) }; }
  async notify(owner: string, id: string, channel: Channel) { const proposal = this.get(id, owner); this.refresh(proposal);
    if (proposal.state !== 'pending' || proposal.notified || proposal.notifying)
      throw new Error('Proposal is not pending or was already notified.');
    proposal.notifying = true;
    try { if (channel !== 'local') await deliver(channel, proposal, this.env, this.fetcher);
      proposal.notified = channel; proposal.audit.push(channel === 'local' ? 'Local preview displayed; no message sent.' : `${channel} notification accepted.`);
    } finally { proposal.notifying = false; }
    return this.snapshot(owner); }
  decide(owner: string, token: string | undefined, id: string, decision: 'approve' | 'reject') {
    const reviewer = this.reviewer(token, owner); const proposal = this.get(id, owner); this.refresh(proposal);
    if (proposal.reviewer !== reviewer || proposal.state !== 'pending') throw new Error('Wrong reviewer, expired or already decided.');
    if (!proposal.notified) throw new Error('Notify and inspect the proposal first.');
    if (decision === 'reject') { proposal.state = 'rejected'; proposal.audit.push(`Rejected by ${reviewer}; no effect.`); return this.snapshot(owner); }
    const row = this.db.prepare('INSERT OR IGNORE INTO effects (business_key, case_id, proposal_id, executed_at) VALUES (?, ?, ?, ?)')
      .run(proposal.businessKey, proposal.args.caseId, proposal.id, this.now());
    proposal.state = 'approved'; proposal.audit.push(`Approved by ${reviewer}; executed effects ${row.changes}.`);
    return this.snapshot(owner);
  }
  tamper(owner: string, id: string, caseId: string) { const proposal = this.get(id, owner);
    if (caseId !== proposal.args.caseId) { proposal.audit.push('Changed action arguments rejected.');
      return { blocked: true, snapshot: this.snapshot(owner) }; }
    throw new Error('Tamper experiment requires a different case ID.'); }
  expire(owner: string, id: string) { const proposal = this.get(id, owner); proposal.expiresAt = this.now() - 1;
    this.refresh(proposal); return this.snapshot(owner); }
}

export function createLab65Router(store = new Lab65ApprovalStore()) {
  const router = Router(); router.use(json({ strict: true, limit: '2kb' }));
  router.use((request, response, next) => { const host = request.headers.host ?? ''; const owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` || !safeOwner(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Local origin and experiment owner required.')); return; }
    response.set('Cache-Control', 'no-store'); next(); });
  const owner = (request: Request) => request.headers['x-lab-owner'] as string;
  const token = (request: Request) => /(?:^|; )lab65_reviewer=([A-Za-z0-9_-]+)/.exec(request.headers.cookie ?? '')?.[1];
  const reply = async (response: Response, action: () => unknown | Promise<unknown>) => {
    try { response.json(await action()); } catch (error) { response.status(409).json(apiError('CONFLICT',
      error instanceof Error && /Proposal|reviewer|pending|expired|notified|notification|HTTPS|Graph|Slack|Teams|HTTP|disabled|Tamper/.test(error.message)
        ? error.message : 'Approval operation rejected.')); } };
  router.get('/facts', (_request, response) => response.json({ source: 'offline-host-fixture', providerCalls: 0,
    toolDefinition: lab65ToolDefinition, builtInTools: false, mcp: false, skills: false,
    notificationDefault: 'local; no message sent', decisionMode: 'same-origin local reviewer session' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab65-human-approval.ts',
    'server/concepts/65-human-approval.ts'], note: 'Tool result proposes; reviewer decision alone may execute.' }));
  router.get('/review', (request, response) => { const existing = token(request);
    if (!existing) response.cookie('lab65_reviewer', store.reviewerSession(owner(request)),
      { httpOnly: true, sameSite: 'strict', secure: false, path: '/api/c65', maxAge: 900000 });
    response.json(store.snapshot(owner(request))); });
  router.post('/run', (request, response) => { const parsed = lab65RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a closed approval action.')); return; }
    const body = parsed.data; void reply(response, () => {
      if (body.action === 'propose') return store.propose(owner(request));
      if (body.action === 'notify') return store.notify(owner(request), body.proposalId, body.channel);
      if (body.action === 'decide') return store.decide(owner(request), token(request), body.proposalId, body.decision);
      if (body.action === 'tamper') return store.tamper(owner(request), body.proposalId, body.caseId);
      return store.expire(owner(request), body.proposalId);
    }); });
  return { router, close: async () => store.close() };
}
