import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BetaManagedAgentsUserToolConfirmationEventParams } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { lab37GateOutputSchema, lab37SnapshotSchema } from '../../shared/lab37-permission-prompt-tool.js';
import type { Lab37Decide, Lab37Run } from '../../shared/lab37-permission-prompt-tool.js';

export class Lab37Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Status = 'pending' | 'preallowed' | 'allowed' | 'denied' | 'timed-out' | 'malformed' | 'canceled';
type Entry = { owner: string; runId: string; scenario: Lab37Run['scenario']; gate: Lab37Run['gate']; status: Status;
  eventId: string | null; action: { tool: 'Write'; path: string } | null; gateDecision: 'allow' | 'deny' | null;
  hostDecision: 'allow' | 'deny' | null; confirmation: BetaManagedAgentsUserToolConfirmationEventParams | null;
  confirmationCount: number; fileEffects: number; evidence: string[]; expiresAt: number; deciding: boolean; directory: string };
const workerPath = fileURLToPath(new URL('../../mcp-servers/lab37-policy.mjs', import.meta.url));
async function workerDecision(entry: Entry): Promise<unknown> {
  const child = spawn(process.execPath, [workerPath], { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
    env: { SystemRoot: process.env.SystemRoot ?? '', PATH: process.env.PATH ?? '', TEMP: process.env.TEMP ?? '' } });
  let output = '';
  child.stderr.on('data', () => {});
  child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString('utf8'); if (output.length > 2048) child.kill(); });
  child.stdin.end(`${JSON.stringify({ scenario: entry.scenario, ...entry.action })}\n`);
  const code = await new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(new Lab37Error(504, 'Policy worker timed out.')); }, 800);
    child.once('exit', exit => { clearTimeout(timer); resolve(exit); });
    child.once('error', error => { clearTimeout(timer); reject(error); });
  });
  if (code !== 0 || output.length > 2048 || !output.endsWith('\n')) throw new Lab37Error(502, 'Policy worker returned no bounded decision.');
  try { return JSON.parse(output.trim()); } catch { throw new Lab37Error(502, 'Malformed policy worker response.'); }
}
export class Lab37PolicyGate {
  private entries = new Map<string, Entry>(); private closed = false;
  constructor(private now = () => Date.now()) {}
  private get(owner: string, runId: string) { const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab37Error(404, 'Unknown or unowned policy run.');
    if (entry.status === 'pending' && this.now() >= entry.expiresAt) entry.status = 'timed-out'; return entry; }
  private view(entry: Entry) { return lab37SnapshotSchema.parse({ source: 'authored-fixture', runId: entry.runId, scenario: entry.scenario,
    gate: entry.gate, status: entry.status, eventId: entry.eventId, action: entry.action, gateDecision: entry.gateDecision,
    hostDecision: entry.hostDecision, confirmation: entry.confirmation, confirmationCount: entry.confirmationCount,
    fileEffects: entry.fileEffects, fixtureText: readFileSync(join(entry.directory, 'notes.txt'), 'utf8'), providerCalls: 0, evidence: entry.evidence,
    note: 'Application precedence: fixed host path limits override a valid external gate allow; a local reviewer is an alternate gate. No Managed canUseTool precedence is assumed.' }); }
  run(owner: string, input: Lab37Run) {
    if (input.mode === 'live') throw new Lab37Error(422, 'Live policy confirmation needs a dedicated Managed always_ask session.');
    if (this.closed || this.entries.size >= 16 || [...this.entries.values()].filter(item => item.owner === owner && item.status === 'pending').length >= 2)
      throw new Lab37Error(429, 'Policy gate capacity reached.');
    const preallowed = input.scenario === 'preallowed'; const directory = mkdtempSync(join(tmpdir(), 'managed-lab37-'));
    writeFileSync(join(directory, 'notes.txt'), 'Fictional notes.\n');
    const entry: Entry = { owner, runId: randomUUID(), scenario: input.scenario, gate: input.gate,
      status: preallowed ? 'preallowed' : 'pending', eventId: preallowed ? null : `sevt_${randomUUID().replaceAll('-', '')}`,
      action: preallowed ? null : { tool: 'Write', path: input.scenario === 'host-refusal' ? '/outside/notes.txt' : '/workspace/notes.txt' },
      gateDecision: null, hostDecision: null, confirmation: null, confirmationCount: 0, fileEffects: 0,
      evidence: [preallowed ? 'Preallowed observation did not pause for a policy decision.' : 'Built-in always_ask request paused on exact sevt_ ID.'],
      expiresAt: this.now() + 30_000, deciding: false, directory }; this.entries.set(entry.runId, entry); return this.view(entry);
  }
  inspect(owner: string, runId: string) { return this.view(this.get(owner, runId)); }
  async decide(owner: string, input: Lab37Decide) {
    const entry = this.get(owner, input.runId);
    if (entry.eventId !== input.eventId) throw new Lab37Error(404, 'Pending action event ID differs.');
    if (entry.status !== 'pending' || entry.deciding) throw new Lab37Error(409, `Decision already consumed or unavailable: ${entry.status}.`);
    if (entry.gate === 'local-reviewer' && !input.reviewerDecision) throw new Lab37Error(400, 'Local reviewer decision is required.');
    if (entry.gate === 'worker' && input.reviewerDecision) throw new Lab37Error(400, 'Worker gate does not accept a reviewer override.');
    entry.deciding = true; let output: unknown;
    try { output = entry.gate === 'worker' ? await workerDecision(entry) :
      { decision: input.reviewerDecision, reason: 'Local reviewer made an explicit decision.' }; }
    catch (error) { entry.deciding = false; entry.status = error instanceof Lab37Error && error.statusCode === 504 ? 'timed-out' : 'malformed';
      entry.evidence.push('Policy gate unavailable; no confirmation or file effect.'); return this.view(entry); }
    entry.deciding = false; const parsed = lab37GateOutputSchema.safeParse(output);
    if (!parsed.success) { entry.status = 'malformed'; entry.evidence.push('Invalid gate schema; no confirmation or file effect.'); return this.view(entry); }
    entry.gateDecision = parsed.data.decision;
    const allowedPath = entry.action?.path === '/workspace/notes.txt';
    entry.hostDecision = allowedPath && parsed.data.decision === 'allow' ? 'allow' : 'deny';
    const reason = !allowedPath ? 'Host path limit refused the action.' : parsed.data.reason;
    entry.confirmation = { type: 'user.tool_confirmation', tool_use_id: entry.eventId,
      result: entry.hostDecision, ...(entry.hostDecision === 'deny' ? { deny_message: reason } : {}) };
    entry.confirmationCount = 1; entry.status = entry.hostDecision === 'allow' ? 'allowed' : 'denied';
    if (entry.hostDecision === 'allow') { writeFileSync(join(entry.directory, 'notes.txt'), 'Fictional notes.\nApproved checked write.\n'); entry.fileEffects = 1; }
    entry.evidence.push(`Valid gate ${entry.gateDecision}; independent host check ${entry.hostDecision}; one correlated confirmation.`);
    return this.view(entry);
  }
  cancel(owner: string, runId: string) { const entry = this.get(owner, runId);
    if (entry.status !== 'pending') throw new Lab37Error(409, `Action is ${entry.status}.`);
    entry.status = 'canceled'; entry.evidence.push('Pending decision canceled without an effect.'); return this.view(entry); }
  close() { this.closed = true; for (const entry of this.entries.values()) rmSync(entry.directory, { recursive: true, force: true }); this.entries.clear(); }
}
