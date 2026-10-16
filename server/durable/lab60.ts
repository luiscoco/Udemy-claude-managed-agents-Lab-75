import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { lab60ToolSchemas } from '../../shared/lab60-durable-agents.js';
import type { lab60StrategySchema } from '../../shared/lab60-durable-agents.js';

type Strategy = z.infer<typeof lab60StrategySchema>;
type Scenario = 'crash-after-third' | 'lease-loss' | 'no-progress';
type Item = { id: string; ageDays: number; amountCents: number; unused: boolean };
export const items: readonly Item[] = [
  { id: 'ITEM-01', ageDays: 2, amountCents: 2400, unused: true },
  { id: 'ITEM-02', ageDays: 7, amountCents: 1500, unused: true },
  { id: 'ITEM-03', ageDays: 12, amountCents: 4900, unused: true },
  { id: 'ITEM-04', ageDays: 19, amountCents: 19900, unused: true },
  { id: 'ITEM-05', ageDays: 30, amountCents: 600, unused: true },
  { id: 'ITEM-06', ageDays: 31, amountCents: 900, unused: true },
  { id: 'ITEM-07', ageDays: 3, amountCents: 20100, unused: true },
  { id: 'ITEM-08', ageDays: 5, amountCents: 4000, unused: false },
];
export const eligible = (item: Item) => item.ageDays <= 30 && item.amountCents <= 20000 && item.unused;
type Journal = { id: string; owner: string; scenario: Scenario; state: 'running' | 'crashed' | 'done' | 'failed';
  completedKeys: string[]; leaseUntil: number; heartbeat: number; noProgress: number; decision: string };
type Ledger = { key: string; itemId: string; amountCents: number; appliedAt: number }[];
const schema = z.strictObject({ id: z.uuid(), owner: z.string(), scenario: z.enum(['crash-after-third', 'lease-loss', 'no-progress']),
  state: z.enum(['running', 'crashed', 'done', 'failed']), completedKeys: z.array(z.string()).max(8),
  leaseUntil: z.number(), heartbeat: z.number(), noProgress: z.number().int(), decision: z.string() });
const ledgerSchema = z.array(z.strictObject({ key: z.string(), itemId: z.string(), amountCents: z.number().int(),
  appliedAt: z.number() })).max(32);
const atomic = (path: string, value: unknown) => { const temporary = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify(value));
  for (let attempt = 0; attempt < 10; attempt++) {
    try { renameSync(temporary, path); return; }
    catch (error) { const code = (error as NodeJS.ErrnoException).code;
      if (attempt === 9 || code !== 'EPERM' && code !== 'EBUSY') throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * (attempt + 1)); }
  }
};
export const effectKey = (jobId: string, itemId: string) => `refund:${jobId}:${itemId}`;
export const supervisorDecision = (state: Journal['state'], scenario: Scenario, strategy: Strategy) =>
  state === 'done' ? 'done' : state === 'failed' || scenario === 'lease-loss' || scenario === 'no-progress' ? 'fail' :
    strategy === 'naive-restart' ? 'fresh' : strategy === 'journal-only' ? 'retry' : 'resume';
export const toolDefinitions = Object.entries(lab60ToolSchemas).map(([name, shape]) => {
  const { $schema: _dialect, ...input_schema } = z.toJSONSchema(shape, { target: 'draft-2020-12', io: 'input' });
  return { type: 'custom' as const, name, description: `Host-owned ${name.replaceAll('_', ' ')} for the fictional batch.`, input_schema };
});
export class DurableStore {
  constructor(private readonly root = resolve('artifacts/lab60/jobs'), private readonly clock = () => Date.now()) {
    mkdirSync(root, { recursive: true }); }
  private dir(id: string) { return resolve(this.root, id); }
  private journalPath(id: string) { return resolve(this.dir(id), 'journal.json'); }
  private ledgerPath(id: string) { return resolve(this.dir(id), 'ledger.json'); }
  private read(id: string) { return schema.parse(JSON.parse(readFileSync(this.journalPath(id), 'utf8'))); }
  private ledger(id: string) { return ledgerSchema.parse(JSON.parse(readFileSync(this.ledgerPath(id), 'utf8'))); }
  private save(journal: Journal) { atomic(this.journalPath(journal.id), journal); }
  private saveLedger(id: string, ledger: Ledger) { atomic(this.ledgerPath(id), ledger); }
  private owned(id: string, owner: string) { const journal = this.read(id);
    if (journal.owner !== owner) throw new Error('Job belongs to another owner.'); return journal; }
  private apply(journal: Journal, item: Item, deduplicate: boolean) {
    const key = effectKey(journal.id, item.id), ledger = this.ledger(journal.id);
    if (deduplicate && ledger.some(effect => effect.key === key)) return { key, suppressed: true };
    if (ledger.length >= 32) throw new Error('Ledger capacity reached.');
    ledger.push({ key, itemId: item.id, amountCents: item.amountCents, appliedAt: this.clock() });
    this.saveLedger(journal.id, ledger); return { key, suppressed: false };
  }
  start(owner: string, scenario: Scenario) {
    if (this.jobs(owner).length >= 8) throw new Error('Job capacity reached.');
    const id = randomUUID(), now = this.clock(), journal: Journal = { id, owner, scenario, state: 'running',
      completedKeys: [], leaseUntil: now + 30000, heartbeat: now, noProgress: 0, decision: 'started' };
    mkdirSync(this.dir(id)); this.save(journal); this.saveLedger(id, []);
    if (scenario === 'lease-loss') { journal.leaseUntil = now - 1; journal.state = 'crashed'; journal.decision = 'lease-lost';
      this.save(journal); return this.snapshot(id, owner); }
    if (scenario === 'no-progress') { journal.noProgress = 3; journal.state = 'crashed';
      journal.decision = 'no-progress-limit'; this.save(journal); return this.snapshot(id, owner); }
    for (const item of items.filter(eligible).slice(0, 3)) {
      const applied = this.apply(journal, item, false);
      if (item.id === 'ITEM-03') break; // Crash after the third effect, before its journal write.
      journal.completedKeys.push(applied.key); journal.heartbeat = this.clock(); this.save(journal);
    }
    journal.state = 'crashed'; journal.decision = 'effect-3-before-journal'; this.save(journal);
    return this.snapshot(id, owner);
  }
  recover(id: string, owner: string, strategy: Strategy) {
    const journal = this.owned(id, owner);
    if (journal.state === 'done' || journal.state === 'failed') throw new Error('Job already terminal.');
    const before = this.ledger(id), suppressed: string[] = [], repeated: string[] = [];
    if (journal.scenario === 'lease-loss') { journal.state = 'failed'; journal.decision = 'fail: lease lost';
      this.save(journal); return { ...this.snapshot(id, owner), supervisor: 'fail', suppressed, repeated }; }
    if (journal.scenario === 'no-progress') { journal.state = 'failed'; journal.decision = 'fail: no progress after three checks';
      this.save(journal); return { ...this.snapshot(id, owner), supervisor: 'fail', suppressed, repeated }; }
    const eligibleItems = items.filter(eligible), restartAll = strategy === 'naive-restart';
    for (const item of eligibleItems) {
      const key = effectKey(id, item.id);
      if (!restartAll && journal.completedKeys.includes(key)) continue;
      const effect = this.apply(journal, item, strategy === 'journal-idempotency');
      if (effect.suppressed) suppressed.push(key);
      else if (before.some(existing => existing.key === key)) repeated.push(key);
      if (!journal.completedKeys.includes(key)) journal.completedKeys.push(key);
      journal.heartbeat = this.clock(); journal.leaseUntil = this.clock() + 30000;
      this.save(journal);
    }
    journal.state = 'done'; journal.decision = 'done'; this.save(journal);
    return { ...this.snapshot(id, owner), supervisor: supervisorDecision('crashed', journal.scenario, strategy),
      suppressed, repeated };
  }
  snapshot(id: string, owner: string) { const journal = this.owned(id, owner), ledger = this.ledger(id);
    return { source: 'offline-durable-fixture', jobId: id, scenario: journal.scenario, state: journal.state,
      journalKeys: journal.completedKeys, ledger, duplicates: ledger.length - new Set(ledger.map(effect => effect.key)).size,
      leaseUntil: journal.leaseUntil, heartbeat: journal.heartbeat, decision: journal.decision, providerCalls: 0,
      note: 'Host files and ledger are authoritative. No actual refund or email occurs.' }; }
  jobs(owner: string) { return readdirSync(this.root, { withFileTypes: true }).filter(entry => entry.isDirectory())
    .flatMap(entry => { try { const journal = this.read(entry.name); return journal.owner === owner ? [
      { id: journal.id, state: journal.state, scenario: journal.scenario }] : []; } catch { return []; } }); }
  reset(owner: string) { const jobs = this.jobs(owner); for (const job of jobs) rmSync(this.dir(job.id), { recursive: true, force: true });
    return { removed: jobs.length }; }
  handleTool(owner: string, jobId: string, eventId: string, name: string, input: unknown) {
    if (!/^sevt_[A-Za-z0-9_-]{1,80}$/.test(eventId)) throw new Error('Invalid Managed tool event ID.');
    const shape = lab60ToolSchemas[name as keyof typeof lab60ToolSchemas];
    const parsed = shape?.safeParse(input);
    const answer = (content: unknown, is_error = false) => ({ type: 'user.custom_tool_result' as const,
      custom_tool_use_id: eventId, content: [{ type: 'text' as const, text: JSON.stringify(content) }], is_error });
    if (!parsed?.success) return answer({ error: 'Unknown tool or closed input rejected.' }, true);
    const journal = this.owned(jobId, owner);
    if (name === 'read_refund_item') { const item = items.find(entry => entry.id === (parsed.data as { itemId: string }).itemId)!;
      return answer({ item, eligible: eligible(item) }); }
    if (name === 'record_refund_effect') { const value = parsed.data as { itemId: string; effectKey: string };
      const item = items.find(entry => entry.id === value.itemId)!;
      if (!eligible(item) || value.effectKey !== effectKey(jobId, item.id) || journal.state !== 'running' ||
        journal.leaseUntil <= this.clock())
        return answer({ error: 'Host policy, stable key or lease rejected the effect.' }, true);
      return answer(this.apply(journal, item, true)); }
    return answer({ accepted: true, completed: journal.completedKeys.length });
  }
}
