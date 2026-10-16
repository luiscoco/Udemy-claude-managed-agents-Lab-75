import { randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { Router, json, type Request } from 'express';
import { z } from 'zod';
import { lab67AuthSchema, lab67RunSchema, lab67SourceToolSchema } from '../../shared/lab67-multi-tenant-saas.js';
import { apiError } from '../lib/errors.js';

type Principal = { id: 'alice' | 'bob'; tenant: 'acme' | 'birch'; project: string };
type Run = { id: string; sessionId: string; principal: Principal; state: 'running' | 'completed' | 'failed' | 'cancelled';
  scenario: 'normal' | 'failure' | 'hold'; reservation: number; controller: AbortController;
  transcript: string[]; work?: Promise<void> };
type Ledger = { tenant: string; runId: string; event: 'reserved' | 'released' | 'charged'; units: number };
class WorkshopError extends Error { constructor(message: string, readonly status = 404) { super(message); } }
const principals: Record<'alice' | 'bob', Principal> = {
  alice: { id: 'alice', tenant: 'acme', project: 'project-acme' }, bob: { id: 'bob', tenant: 'birch', project: 'project-birch' } };
const sources = { 'policy-acme': { tenant: 'acme', content: 'Acme fictional return window: 30 days.' },
  'policy-birch': { tenant: 'birch', content: 'Birch fictional return window: 14 days.' } } as const;
const inputSchema = (() => { const { $schema: _dialect, ...schema } = z.toJSONSchema(lab67SourceToolSchema,
  { target: 'draft-2020-12', io: 'input' }); return schema; })();
export const lab67ToolDefinition = { type: 'custom' as const, name: 'read_project_policy',
  description: 'Read one source from the host-authenticated tenant project.', input_schema: inputSchema };

export class Lab67Workshop {
  private readonly tokens = new Map<string, Principal>(); private readonly runs = new Map<string, Run>();
  private readonly requests = new Map<string, string>(); private readonly ledger: Ledger[] = [];
  private readonly rate = new Map<string, { at: number; count: number }>(); private closing = false;
  constructor(private readonly stepMs = 400, private readonly now = () => Date.now()) {}
  authenticate(id: 'alice' | 'bob') { if (this.tokens.size >= 100) throw new WorkshopError('Authentication capacity reached.', 429);
    const token = randomBytes(24).toString('base64url'); const principal = principals[id]; this.tokens.set(token, principal);
    return { token, principal, source: 'synthetic-local-authentication' }; }
  private identity(token: string | undefined) { const principal = token && this.tokens.get(token);
    if (!principal) throw new WorkshopError('Authenticated principal required.', 401); return principal; }
  private owned(token: string | undefined, id: string) { const principal = this.identity(token); const run = this.runs.get(id);
    if (!run || run.principal.tenant !== principal.tenant || run.principal.project !== principal.project)
      throw new WorkshopError('Run not found.'); return run; }
  usage(token: string | undefined) { const principal = this.identity(token); const entries = this.ledger.filter(row => row.tenant === principal.tenant);
    const spent = entries.filter(row => row.event === 'charged').reduce((total, row) => total + row.units, 0);
    const reserved = [...this.runs.values()].filter(run => run.principal.tenant === principal.tenant).reduce((total, run) => total + run.reservation, 0);
    return { tenant: principal.tenant, project: principal.project, limit: 6, spent, reserved,
      active: [...this.runs.values()].filter(run => run.principal.tenant === principal.tenant && run.state === 'running').length,
      ledger: entries, providerCalls: 0 };
  }
  source(token: string | undefined, id: string) { const principal = this.identity(token);
    const source = sources[id as keyof typeof sources];
    if (!source || source.tenant !== principal.tenant) throw new WorkshopError('Source not found.');
    return { id, project: principal.project, content: source.content };
  }
  handleTool(token: string | undefined, event: { id: string; name: string; input: unknown }) {
    this.identity(token);
    if (!/^sevt_[A-Za-z0-9_-]{1,80}$/.test(event.id) || event.name !== lab67ToolDefinition.name)
      throw new WorkshopError('Invalid custom-tool event.', 400);
    const input = lab67SourceToolSchema.parse(event.input); const source = this.source(token, input.sourceId);
    return { type: 'user.custom_tool_result' as const, custom_tool_use_id: event.id,
      content: [{ type: 'text' as const, text: source.content }], is_error: false };
  }
  start(token: string | undefined, input: z.infer<typeof lab67RunSchema>) {
    const principal = this.identity(token); const parsed = lab67RunSchema.parse(input);
    const requestKey = `${principal.id}:${parsed.requestId}`; const existing = this.requests.get(requestKey);
    if (existing) return { ...this.get(token, existing), duplicate: true };
    if (this.closing || this.runs.size >= 50) throw new WorkshopError('Workshop capacity reached.', 429);
    const window = this.rate.get(principal.id); const rate = !window || this.now() - window.at >= 60000 ? { at: this.now(), count: 0 } : window;
    this.rate.set(principal.id, rate); if (++rate.count > 6) throw new WorkshopError('Principal rate limit reached.', 429);
    const usage = this.usage(token);
    if (usage.active >= 1) throw new WorkshopError('Tenant concurrency reservation reached.', 429);
    if (usage.spent + usage.reserved + 2 > usage.limit) throw new WorkshopError('Tenant quota exhausted.', 429);
    const run: Run = { id: randomUUID(), sessionId: `sesn_fixture_${randomUUID().replaceAll('-', '')}`,
      principal, state: 'running', scenario: parsed.scenario, reservation: 2, controller: new AbortController(),
      transcript: ['Host reserved 2 illustrative units for the authenticated tenant.'] };
    this.runs.set(run.id, run); this.requests.set(requestKey, run.id);
    this.ledger.push({ tenant: principal.tenant, runId: run.id, event: 'reserved', units: 2 });
    run.work = (async () => {
      try { await delay(parsed.scenario === 'hold' ? 10000 : this.stepMs, undefined, { signal: run.controller.signal });
        if (parsed.scenario === 'failure') throw new Error('Authored runner failure.');
        const eventId = `sevt_${randomUUID().replaceAll('-', '')}`;
        const result = this.handleTool(token, { id: eventId, name: lab67ToolDefinition.name,
          input: { sourceId: `policy-${principal.tenant}` } });
        run.transcript.push(`Custom-tool result ${result.custom_tool_use_id}: ${result.content[0]!.text}`);
        run.state = 'completed'; this.ledger.push({ tenant: principal.tenant, runId: run.id, event: 'charged', units: 2 });
      } catch { run.state = run.controller.signal.aborted ? 'cancelled' : 'failed'; run.transcript.push(`Run ${run.state}; no usage charge.`); }
      finally { this.ledger.push({ tenant: principal.tenant, runId: run.id, event: 'released', units: run.reservation });
        run.reservation = 0; run.transcript.push('Reservation released exactly once.'); }
    })();
    return { ...this.get(token, run.id), duplicate: false };
  }
  get(token: string | undefined, id: string) { const run = this.owned(token, id);
    return { id: run.id, sessionId: run.sessionId, tenant: run.principal.tenant, project: run.principal.project,
      state: run.state, reservation: run.reservation, source: 'authored-fixture' }; }
  session(token: string | undefined, id: string) { this.identity(token); const run = [...this.runs.values()].find(item => item.sessionId === id);
    if (!run) throw new WorkshopError('Session not found.'); return this.get(token, run.id); }
  transcript(token: string | undefined, id: string) { return { ...this.get(token, id), messages: [...this.owned(token, id).transcript] }; }
  cancel(token: string | undefined, id: string) { const run = this.owned(token, id); if (run.state === 'running') run.controller.abort('user'); return this.get(token, id); }
  async settle(token: string | undefined, id: string) { const run = this.owned(token, id); await run.work; return this.get(token, id); }
  async close() { this.closing = true; for (const run of this.runs.values()) run.controller.abort('shutdown');
    await Promise.allSettled([...this.runs.values()].map(run => run.work)); this.tokens.clear(); }
}

export function createLab67Router(store = new Lab67Workshop()) {
  const router = Router(); router.use(json({ strict: true, limit: '2kb' }));
  router.use((request, response, next) => { const host = request.headers.host ?? '';
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}`) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Local workshop origin required.')); return; }
    response.set('Cache-Control', 'no-store'); next(); });
  const token = (request: Request) => /^Bearer ([A-Za-z0-9_-]+)$/.exec(request.headers.authorization ?? '')?.[1];
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { response.status(error instanceof WorkshopError ? error.status : 400).json(apiError('INVALID_REQUEST',
      error instanceof WorkshopError ? error.message : 'Closed workshop input rejected.')); } };
  router.post('/auth', (request, response) => { const parsed = lab67AuthSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Select a synthetic principal.')); return; }
    reply(response, () => store.authenticate(parsed.data.principal)); });
  router.get('/facts', (_request, response) => response.json({ source: 'synthetic-local-authentication', providerCalls: 0,
    toolDefinition: lab67ToolDefinition, builtInTools: false, mcp: false, skills: false,
    note: 'Principal selectors simulate login; host token mapping chooses tenant and project.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab67-multi-tenant-saas.ts',
    'server/concepts/67-multi-tenant-saas.ts'], note: 'Every session, source, transcript and cancellation uses host identity.' }));
  router.get('/usage', (request, response) => reply(response, () => store.usage(token(request))));
  router.post('/runs', (request, response) => reply(response, () => store.start(token(request), request.body)));
  router.get('/runs/:id', (request, response) => reply(response, () => store.get(token(request), request.params.id as string)));
  router.get('/runs/:id/transcript', (request, response) => reply(response, () => store.transcript(token(request), request.params.id as string)));
  router.post('/runs/:id/cancel', (request, response) => {
    if (!z.strictObject({}).safeParse(request.body).success) { response.status(400).json(apiError('INVALID_REQUEST', 'Cancellation accepts no tenant input.')); return; }
    reply(response, () => store.cancel(token(request), request.params.id as string)); });
  router.get('/sessions/:id', (request, response) => reply(response, () => store.session(token(request), request.params.id as string)));
  router.get('/sources/:id', (request, response) => reply(response, () => store.source(token(request), request.params.id as string)));
  return { router, close: () => store.close() };
}
