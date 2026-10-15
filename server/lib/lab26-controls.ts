import { randomUUID } from 'node:crypto';
import type { Lab26Call, Lab26Open } from '../../shared/lab26-query-control.js';
import { lab26SessionSchema } from '../../shared/lab26-query-control.js';

export class Lab26Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Session = { id: string; owner: string; status: 'idle' | 'running' | 'archived'; model: 'fixture-model-a' | 'fixture-model-b';
  title: string; tag: string | null; tools: Array<'read_report' | 'format_note'>; mcpServers: Array<'fictional_catalog'>;
  budgetCents: number; history: string[]; interruption: 'not-needed' | 'confirmed-idle' | 'unconfirmed';
  parentSessionId: string | null; summaryHandoff: string | null; version: number; timer: ReturnType<typeof setTimeout> | undefined; expires: number; delayMs: number };
export class Lab26Controls {
  private entries = new Map<string, Session>();
  private closed = false;
  constructor(private now = () => Date.now(), private slowMs = 1200) {}
  private get(id: string, owner: string) {
    const entry = this.entries.get(id);
    if (!entry || entry.owner !== owner || this.now() > entry.expires) throw new Lab26Error(404, 'Unknown or expired owned session.');
    return entry;
  }
  private view(entry: Session) { return lab26SessionSchema.parse({ sessionId: entry.id, source: 'authored-fixture', status: entry.status,
    model: entry.model, title: entry.title, tag: entry.tag, tools: entry.tools, mcpServers: entry.mcpServers,
    budgetCents: entry.budgetCents, history: entry.history, interruption: entry.interruption,
    parentSessionId: entry.parentSessionId, summaryHandoff: entry.summaryHandoff, version: entry.version,
    note: 'This authored session models the documented control boundary; no remote session was created.' }); }
  private create(owner: string, budgetCents: number, model: Session['model'], parentSessionId: string | null, summaryHandoff: string | null, delayMs = this.slowMs) {
    if (this.closed || this.entries.size >= 12 || [...this.entries.values()].filter(e => e.owner === owner && e.status !== 'archived').length >= 3)
      throw new Lab26Error(429, 'Close an owned session before opening another.');
    const entry: Session = { id: randomUUID(), owner, status: 'idle', model, title: 'Observation notebook', tag: null,
      tools: ['read_report', 'format_note'], mcpServers: ['fictional_catalog'], budgetCents, history: [], interruption: 'not-needed',
      parentSessionId, summaryHandoff, version: 1, timer: undefined, expires: this.now() + 300_000, delayMs };
    this.entries.set(entry.id, entry); return this.view(entry);
  }
  open(owner: string, input: Lab26Open) {
    if (input.mode !== 'scripted') throw new Lab26Error(422, 'Live control requires an explicitly configured owned Managed session; no billed session was opened.');
    return this.create(owner, input.budgetCents, 'fixture-model-a', null, null, input.scenario === 'normal' ? 20 : this.slowMs);
  }
  call(owner: string, input: Lab26Call) {
    const entry = this.get(input.sessionId, owner);
    if (input.operation === 'retrieve' || input.operation === 'history') return this.view(entry);
    if (entry.status === 'archived') throw new Lab26Error(409, 'Archived sessions cannot be mutated.');
    if (input.operation === 'interrupt') {
      if (entry.status === 'running') { if (entry.timer) clearTimeout(entry.timer); entry.timer = undefined;
        entry.status = 'idle'; entry.interruption = 'confirmed-idle'; entry.history.push('Host observed interrupt acknowledgment and confirmed idle.'); entry.version++; }
      return this.view(entry);
    }
    if (entry.status !== 'idle') throw new Lab26Error(409, 'This update requires a confirmed-idle session.');
    switch (input.operation) {
      case 'send': {
        entry.status = 'running'; entry.history.push(`User: ${input.message}`); entry.version++;
        const version = entry.version;
        entry.timer = setTimeout(() => { if (entry.status === 'running' && entry.version === version) {
          entry.history.push('Agent: Authored fixture reply.'); entry.status = 'idle'; entry.timer = undefined; entry.version++; } }, entry.delayMs);
        entry.timer.unref?.(); return this.view(entry);
      }
      case 'title-metadata': entry.title = input.title; entry.tag = input.tag; break;
      case 'idle-tools-mcp': entry.tools = [...new Set(input.tools)]; entry.mcpServers = [...new Set(input.mcpServers)]; break;
      case 'budget-change': {
        if (input.budgetCents > entry.budgetCents && !input.confirmResume) throw new Lab26Error(409, 'Raising a budget can resume work; explicit opt-in is required.');
        entry.budgetCents = input.budgetCents; break;
      }
      case 'archive': entry.status = 'archived'; break;
      case 'fresh-model-handoff': {
        // New model selection cannot mutate this session. The explicit summary is the only context carried forward.
        return this.create(owner, entry.budgetCents, input.model, entry.id, input.summary, entry.delayMs);
      }
    }
    entry.version++; return this.view(entry);
  }
  close() { this.closed = true; for (const entry of this.entries.values()) { if (entry.timer) clearTimeout(entry.timer); entry.timer = undefined; } }
}
