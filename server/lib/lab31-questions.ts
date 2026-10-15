import { randomUUID } from 'node:crypto';
import type { BetaManagedAgentsUserCustomToolResultEventParams } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { lab31AskUserShape, lab31SnapshotSchema } from '../../shared/lab31-ask-user-question.js';
import type { Lab31Answer, Lab31Run } from '../../shared/lab31-ask-user-question.js';

export class Lab31Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Status = 'pending' | 'answered' | 'expired' | 'canceled';
type Entry = { owner: string; runId: string; sessionId: string; eventId: string; scenario: Lab31Run['scenario']; status: Status;
  question: ReturnType<typeof lab31AskUserShape.parse>; expiresAt: number; answer: string | null;
  resultEvent: BetaManagedAgentsUserCustomToolResultEventParams | null; resultSendCount: number;
  timer: ReturnType<typeof setTimeout> | undefined; waiters: Set<() => void> };
export class Lab31Questions {
  private entries = new Map<string, Entry>(); private closed = false;
  constructor(private now = () => Date.now()) {}
  private get(owner: string, runId: string) { const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab31Error(404, 'Unknown or unowned question run.');
    if (entry.status === 'pending' && this.now() >= entry.expiresAt) this.finish(entry, 'expired'); return entry; }
  private view(entry: Entry) { return lab31SnapshotSchema.parse({ source: 'authored-fixture', runId: entry.runId, sessionId: entry.sessionId,
    eventId: entry.eventId, scenario: entry.scenario, status: entry.status, question: entry.question,
    expiresAt: new Date(entry.expiresAt).toISOString(), answer: entry.answer, resultEvent: entry.resultEvent,
    resultSendCount: entry.resultSendCount, unrelatedToolEffects: 0, providerCalls: 0,
    note: 'Authored custom-tool pause. A human answer becomes one correlated result; it authorizes no other tool.' }); }
  private finish(entry: Entry, status: Exclude<Status, 'pending'>) {
    if (entry.status !== 'pending') return;
    entry.status = status; if (entry.timer) clearTimeout(entry.timer); entry.timer = undefined;
    for (const settle of entry.waiters) settle(); entry.waiters.clear();
  }
  run(owner: string, input: Lab31Run) {
    if (input.mode !== 'scripted') throw new Lab31Error(422, 'Live ask_user needs a separately configured Managed custom-tool session.');
    if (this.closed || this.entries.size >= 12 || [...this.entries.values()].filter(entry => entry.owner === owner && entry.status === 'pending').length >= 2)
      throw new Lab31Error(429, 'Question capacity reached.');
    const options = input.scenario === 'option-selection' ? [{ id: 'short', label: 'Short answer' }, { id: 'detailed', label: 'Detailed answer' }] :
      [{ id: 'dev', label: 'Development' }, { id: 'staging', label: 'Staging' }, { id: 'production', label: 'Production' }];
    const question = lab31AskUserShape.parse({ question: input.scenario === 'option-selection' ? 'How detailed should the fictional report be?'
      : 'Which fictional deployment target should the report use?', options, allowCustom: input.scenario === 'allowed-custom-text' });
    const entry: Entry = { owner, runId: randomUUID(), sessionId: randomUUID(), eventId: `sevt_${randomUUID().replaceAll('-', '')}`,
      scenario: input.scenario, status: 'pending', question, expiresAt: this.now() + (input.scenario === 'expiry' ? 1200 : 30_000),
      answer: null, resultEvent: null, resultSendCount: 0, timer: undefined, waiters: new Set() };
    this.entries.set(entry.runId, entry); entry.timer = setTimeout(() => this.finish(entry, 'expired'), Math.max(0, entry.expiresAt - this.now()));
    entry.timer.unref?.(); return this.view(entry);
  }
  inspect(owner: string, runId: string) { return this.view(this.get(owner, runId)); }
  answer(owner: string, input: Lab31Answer) {
    const entry = this.get(owner, input.runId);
    if (entry.sessionId !== input.sessionId || entry.eventId !== input.eventId) throw new Lab31Error(404, 'Question correlation does not match this run.');
    if (entry.status !== 'pending') throw new Lab31Error(409, `Question is ${entry.status}; no second result is accepted.`);
    const selected = input.selectedOption, custom = input.customText?.trim();
    if (Boolean(selected) === Boolean(custom)) throw new Lab31Error(400, 'Choose exactly one option or allowed custom text.');
    if (selected && !entry.question.options.some(option => option.id === selected)) throw new Lab31Error(400, 'Selected option is not in the stored question.');
    if (custom && (!entry.question.allowCustom || custom.length > 200)) throw new Lab31Error(400, 'Custom text is unavailable or too long.');
    const answer = selected ?? custom!;
    const resultEvent: BetaManagedAgentsUserCustomToolResultEventParams = { type: 'user.custom_tool_result',
      custom_tool_use_id: entry.eventId, is_error: false, content: [{ type: 'text', text: JSON.stringify({ answer }) }] };
    entry.answer = answer; entry.resultEvent = resultEvent; entry.resultSendCount = 1; this.finish(entry, 'answered'); return this.view(entry);
  }
  cancel(owner: string, runId: string) { const entry = this.get(owner, runId); this.finish(entry, 'canceled'); return this.view(entry); }
  async wait(owner: string, runId: string, timeoutMs: number, signal: AbortSignal) {
    const entry = this.get(owner, runId); if (entry.status !== 'pending') return this.view(entry);
    await new Promise<void>((resolve, reject) => {
      const settle = () => { cleanup(); resolve(); }, aborted = () => { cleanup(); reject(new Lab31Error(499, 'Browser wait disconnected.')); };
      const timer = setTimeout(settle, timeoutMs);
      const cleanup = () => { clearTimeout(timer); entry.waiters.delete(settle); signal.removeEventListener('abort', aborted); };
      entry.waiters.add(settle); signal.addEventListener('abort', aborted, { once: true }); if (signal.aborted) aborted();
    });
    return this.view(this.get(owner, runId));
  }
  close() { this.closed = true; for (const entry of this.entries.values()) this.finish(entry, 'canceled'); this.entries.clear(); }
}
