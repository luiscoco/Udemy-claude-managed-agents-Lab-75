import { randomUUID } from 'node:crypto';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { BetaManagedAgentsUserCustomToolResultEventParams } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { lab33FieldSchema, lab33SnapshotSchema } from '../../shared/lab33-mcp-elicitation.js';
import type { Lab33Respond, Lab33Run } from '../../shared/lab33-mcp-elicitation.js';

export class Lab33Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Status = 'starting' | 'pending' | 'accepted' | 'declined' | 'timed-out' | 'aborted' | 'error';
type Entry = { owner: string; runId: string; scenario: Lab33Run['scenario']; status: Status; child: ChildProcessWithoutNullStreams;
  buffer: string; mcpRequestId: number; customCallId: string; consentId: string; question: string; form: { date: string; quantity: number } | null;
  result: string | null; bridgeResult: BetaManagedAgentsUserCustomToolResultEventParams | null;
  mcpCallCount: number; answerCount: number; evidence: string[]; timer?: ReturnType<typeof setTimeout> | undefined;
  ready?: (() => void) | undefined; failReady?: ((error: Error) => void) | undefined; finished?: (() => void) | undefined };
const workerPath = fileURLToPath(new URL('../../mcp-servers/lab33-form.mjs', import.meta.url));
const send = (entry: Entry, value: unknown) => entry.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...value as object })}\n`);
export class Lab33Elicitation {
  private entries = new Map<string, Entry>(); private closed = false;
  private get(owner: string, runId: string) { const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab33Error(404, 'Unknown or unowned elicitation run.'); return entry; }
  private view(entry: Entry) { return lab33SnapshotSchema.parse({ source: 'local-mcp-fixture', runId: entry.runId, scenario: entry.scenario,
    status: entry.status, question: entry.question, mcpRequestId: entry.mcpRequestId, customCallId: entry.customCallId,
    consentId: entry.consentId, form: entry.form, result: entry.result, mcpCallCount: entry.mcpCallCount,
    answerCount: entry.answerCount, bridgeResult: entry.bridgeResult, providerCalls: 0, transport: entry.scenario === 'url-consent' ? 'fixed-local-consent' : 'stdio-local',
    consentPath: entry.scenario === 'url-consent' ? `/api/c33/consent/${entry.consentId}` : null,
    evidence: entry.evidence, note: 'The local MCP server requested elicitation; the host validated the form before replying. Managed cloud support was not assumed.' }); }
  private finish(entry: Entry, status: Status, result: string | null = null) {
    if (entry.status !== 'starting' && entry.status !== 'pending') return;
    entry.status = status; entry.result = result; if (entry.timer) clearTimeout(entry.timer); entry.timer = undefined;
    entry.child.stdin.end(); if (entry.child.exitCode === null && entry.child.signalCode === null) entry.child.kill();
    entry.finished?.(); entry.finished = undefined;
    if (status === 'error') entry.failReady?.(new Lab33Error(502, 'Local MCP protocol failed.'));
  }
  private packet(entry: Entry, value: unknown) {
    if (!value || typeof value !== 'object') return this.finish(entry, 'error');
    const packet = value as Record<string, unknown>;
    if (packet.id === 1 && packet.result && entry.status === 'starting') {
      entry.evidence.push('MCP initialize response correlated.'); send(entry, { method: 'notifications/initialized' });
      send(entry, { id: 2, method: 'tools/list', params: {} }); return;
    }
    if (packet.id === 2 && entry.status === 'starting') {
      const tools = (packet.result as { tools?: Array<{ name?: string }> } | undefined)?.tools;
      if (!tools?.some(tool => tool.name === 'collect_field_note')) return this.finish(entry, 'error');
      entry.evidence.push('MCP tools/list confirmed collect_field_note.');
      send(entry, { id: 3, method: 'tools/call', params: { name: 'collect_field_note', arguments: {} } }); entry.mcpCallCount = 1; return;
    }
    if (packet.id === 33 && packet.method === 'elicitation/create' && entry.status === 'starting') {
      const params = packet.params as { message?: unknown; requestedSchema?: { additionalProperties?: unknown } } | undefined;
      if (typeof params?.message !== 'string' || params.message.length > 240 || params.requestedSchema?.additionalProperties !== false)
        return this.finish(entry, 'error');
      entry.question = params.message; entry.status = 'pending'; entry.evidence.push('MCP elicitation/create request 33 received; host form pending.');
      entry.timer = setTimeout(() => this.finish(entry, 'timed-out'), entry.scenario === 'timeout' ? 1200 : 30_000); entry.timer.unref?.();
      entry.ready?.(); entry.ready = undefined; return;
    }
    if (packet.id === 3 && entry.status === 'pending') {
      const result = packet.result as { content?: Array<{ text?: string }>; isError?: boolean } | undefined;
      const text = result?.content?.[0]?.text;
      if (typeof text !== 'string' || text.length > 500) return this.finish(entry, 'error');
      entry.evidence.push(`MCP tools/call response correlated; isError=${Boolean(result?.isError)}.`);
      entry.bridgeResult = { type: 'user.custom_tool_result', custom_tool_use_id: entry.customCallId,
        is_error: Boolean(result?.isError), content: [{ type: 'text', text }] };
      this.finish(entry, entry.answerCount && entry.form ? 'accepted' : 'declined', text); return;
    }
    this.finish(entry, 'error');
  }
  async run(owner: string, input: Lab33Run) {
    if (input.mode === 'live') throw new Lab33Error(422, 'Direct Managed MCP elicitation callback support is not configured or assumed.');
    if (this.closed || this.entries.size >= 12 || [...this.entries.values()].filter(entry => entry.owner === owner && ['starting', 'pending'].includes(entry.status)).length >= 2)
      throw new Lab33Error(429, 'Elicitation capacity reached.');
    const child = spawn(process.execPath, [workerPath], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
      env: { SystemRoot: process.env.SystemRoot ?? '', PATH: process.env.PATH ?? '', TEMP: process.env.TEMP ?? '' } });
    const entry: Entry = { owner, runId: randomUUID(), scenario: input.scenario, status: 'starting', child, buffer: '', mcpRequestId: 33,
      customCallId: `sevt_${randomUUID().replaceAll('-', '')}`, consentId: randomUUID(), question: '', form: null, result: null,
      mcpCallCount: 0, answerCount: 0, bridgeResult: null, evidence: [] }; this.entries.set(entry.runId, entry);
    child.stderr.on('data', () => {});
    child.on('error', () => this.finish(entry, 'error'));
    child.on('exit', () => { if (entry.status === 'starting' || entry.status === 'pending') this.finish(entry, 'error'); });
    child.stdout.setEncoding('utf8'); child.stdout.on('data', (chunk: string) => {
      entry.buffer += chunk; if (entry.buffer.length > 16384) return this.finish(entry, 'error');
      for (;;) { const at = entry.buffer.indexOf('\n'); if (at < 0) break;
        const line = entry.buffer.slice(0, at); entry.buffer = entry.buffer.slice(at + 1);
        try { this.packet(entry, JSON.parse(line)); } catch { this.finish(entry, 'error'); }
      }
    });
    const ready = new Promise<void>((resolve, reject) => { entry.ready = resolve; entry.failReady = reject; });
    send(entry, { id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: { elicitation: { form: {} } },
      clientInfo: { name: 'lab33-host', version: '1.0.0' } } });
    try { await Promise.race([ready, new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Lab33Error(504, 'Local MCP startup timed out.')), 3000))]);
      return this.view(entry); } catch (error) { this.finish(entry, 'error'); throw error; }
  }
  inspect(owner: string, runId: string) { return this.view(this.get(owner, runId)); }
  byConsent(owner: string, consentId: string) { const entry = [...this.entries.values()].find(item => item.owner === owner && item.consentId === consentId);
    if (!entry) throw new Lab33Error(404, 'Unknown or unowned consent page.'); return this.view(entry); }
  async respond(owner: string, input: Lab33Respond) {
    const entry = this.get(owner, input.runId);
    if (entry.mcpRequestId !== input.mcpRequestId || entry.customCallId !== input.customCallId || entry.consentId !== input.consentId)
      throw new Lab33Error(404, 'Question, MCP request, custom call or consent correlation differs.');
    if (entry.status !== 'pending') throw new Lab33Error(409, `Form is ${entry.status}; an answer is no longer accepted.`);
    if (input.action === 'accept') {
      const parsed = lab33FieldSchema.safeParse(input.content);
      if (!parsed.success) throw new Lab33Error(400, 'Invalid date or quantity.');
      entry.form = parsed.data;
    }
    entry.answerCount = 1; entry.evidence.push(`Host validated ${input.action} and replied to MCP request 33.`);
    const finished = new Promise<void>(resolve => { entry.finished = resolve; });
    send(entry, { id: 33, result: input.action === 'accept' ? { action: 'accept', content: entry.form } : { action: 'decline' } });
    await Promise.race([finished, new Promise<void>(resolve => setTimeout(() => { this.finish(entry, 'error'); resolve(); }, 3000))]);
    return this.view(entry);
  }
  abort(owner: string, runId: string) { const entry = this.get(owner, runId);
    if (entry.status !== 'pending') throw new Lab33Error(409, `Form is ${entry.status}.`);
    this.finish(entry, 'aborted'); return this.view(entry); }
  close() { this.closed = true; for (const entry of this.entries.values()) this.finish(entry, 'aborted'); this.entries.clear(); }
}
