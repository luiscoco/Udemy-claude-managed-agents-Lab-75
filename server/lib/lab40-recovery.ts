import { randomUUID } from 'node:crypto';
import { lab40SnapshotSchema } from '../../shared/lab40-resume-drops-turn.js';
import type { Lab40Build, Lab40Choice } from '../../shared/lab40-resume-drops-turn.js';

export class Lab40Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Command = { id: string; state: 'accepted' | 'queued' | 'uncertain' | 'processed'; text: string };
type Effect = { id: string; state: 'pending' | 'applied'; description: string };
type Entry = { owner: string; runId: string; scenario: Lab40Build['scenario']; version: number; sessionId: string;
  remoteEventIds: string[]; commandLedger: Command[]; effectLedger: Effect[]; hostDraft: string; snapshotDraft: string;
  snapshotVersion: number; recovery: 'none' | 'continued' | 'interrupt-confirmed-idle' | 'fresh-derived' | 'reconciliation-required';
  decision: string; undo: 'not-attempted' | 'restored-host-draft' | 'refused'; evidence: string[]; expiresAt: number };
export class Lab40Recovery {
  private entries = new Map<string, Entry>(); private closed = false;
  constructor(private now = () => Date.now()) {}
  dry() { return { source: 'host-only', providerCalls: 0, remoteHistoryMutable: false,
    rule: 'Never truncate Managed event history or silently drop accepted commands and applied effects.' }; }
  private get(owner: string, runId: string) { const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab40Error(404, 'Unknown or unowned recovery run.');
    if (this.now() > entry.expiresAt) { this.entries.delete(runId); throw new Lab40Error(410, 'Recovery run expired.'); }
    return entry; }
  private view(entry: Entry) { return lab40SnapshotSchema.parse({ source: 'authored-fixture', runId: entry.runId,
    scenario: entry.scenario, version: entry.version, sessionId: entry.sessionId, remoteEventIds: entry.remoteEventIds,
    remoteHistoryCount: entry.remoteEventIds.length, commandLedger: entry.commandLedger, effectLedger: entry.effectLedger,
    hostDraft: entry.hostDraft, snapshotDraft: entry.snapshotDraft, snapshotVersion: entry.snapshotVersion,
    recovery: entry.recovery, decision: entry.decision, undo: entry.undo, providerCalls: 0, evidence: entry.evidence }); }
  build(owner: string, input: Lab40Build) {
    if (input.mode === 'live') throw new Lab40Error(422, 'A live retained-session recovery adapter is not configured.');
    for (const [id, entry] of this.entries) if (this.now() > entry.expiresAt) this.entries.delete(id);
    if (this.closed || this.entries.size >= 16) throw new Lab40Error(429, 'Recovery exercise capacity reached.');
    const seed = randomUUID(), base: Entry = { owner, runId: randomUUID(), scenario: input.scenario, version: 1,
      sessionId: `fixture-session-${seed.slice(0, 8)}`, remoteEventIds: [], commandLedger: [], effectLedger: [],
      hostDraft: 'Uncommitted host note v2', snapshotDraft: 'Uncommitted host note v1', snapshotVersion: 1,
      recovery: 'none', decision: 'Inspect the ledger before choosing recovery.', undo: 'not-attempted',
      evidence: ['Host snapshot v1 retained; remote event history is immutable.'], expiresAt: this.now() + 10 * 60_000 };
    const cmd = (suffix: string, state: Command['state'], text: string): Command => ({ id: `cmd-${seed.slice(0, 8)}-${suffix}`, state, text });
    const effect = (suffix: string, state: Effect['state'], description: string): Effect => ({ id: `effect-${seed.slice(0, 8)}-${suffix}`, state, description });
    if (input.scenario === 'kept-turn') {
      base.remoteEventIds = [`sevt-${seed.slice(0, 8)}-1`, `sevt-${seed.slice(0, 8)}-2`];
      base.commandLedger = [cmd('1', 'processed', 'First user turn')];
      base.effectLedger = [effect('1', 'applied', 'Saved observation')];
    } else if (input.scenario === 'uncertain-send') {
      base.remoteEventIds = [`sevt-${seed.slice(0, 8)}-1`];
      base.commandLedger = [cmd('1', 'processed', 'First user turn'), cmd('2', 'uncertain', 'Later send with unknown receipt')];
    } else if (input.scenario === 'queued-follow-up') {
      base.remoteEventIds = [`sevt-${seed.slice(0, 8)}-1`];
      base.commandLedger = [cmd('1', 'processed', 'First user turn'), cmd('2', 'queued', 'Accepted follow-up')];
    } else if (input.scenario === 'pending-effect') {
      base.remoteEventIds = [`sevt-${seed.slice(0, 8)}-1`];
      base.commandLedger = [cmd('1', 'processed', 'First user turn')];
      base.effectLedger = [effect('1', 'pending', 'Write call awaiting host confirmation')];
    }
    base.evidence.push(`Scenario ${input.scenario}: ${base.commandLedger.length} commands, ${base.effectLedger.length} effects.`);
    this.entries.set(base.runId, base); return this.view(base);
  }
  state(owner: string, runId: string) { return this.view(this.get(owner, runId)); }
  choose(owner: string, runId: string, choice: Lab40Choice) {
    const entry = this.get(owner, runId);
    if (entry.recovery !== 'none') throw new Lab40Error(409, 'Recovery choice already recorded.');
    const uncertain = entry.commandLedger.some(item => item.state === 'uncertain');
    const pending = entry.effectLedger.some(item => item.state === 'pending');
    const queued = entry.commandLedger.some(item => item.state === 'queued');
    if (choice === 'continue' && (uncertain || pending)) throw new Lab40Error(409, 'Reconcile uncertain send or pending effect before continuation.');
    if (choice === 'fresh-derived' && (uncertain || pending || queued)) throw new Lab40Error(409, 'Outstanding commands or effects require reconciliation before a fresh session.');
    if (choice === 'interrupt' && (uncertain || pending)) throw new Lab40Error(409, 'Cannot claim confirmed idle with unresolved work.');
    if (choice === 'reconcile') { entry.recovery = 'reconciliation-required'; entry.decision = 'Inspect external receipt/effect evidence; do not retry an uncertain send or duplicate an effect.'; }
    else if (choice === 'interrupt') { entry.recovery = 'interrupt-confirmed-idle'; entry.decision = 'Fixture confirms idle; retained owned session can be reused after ledger review.'; }
    else if (choice === 'fresh-derived') { entry.recovery = 'fresh-derived'; entry.decision = 'Fresh fixture session uses only selected verified context; original history remains.'; }
    else { entry.recovery = 'continued'; entry.decision = queued ? 'Continue the owned session and process the queued follow-up once.' : 'Continue the owned session; keep prior turn and effects.'; }
    entry.version++; entry.evidence.push(`Recovery ${entry.recovery}; command and effect IDs preserved.`);
    return this.view(entry);
  }
  undo(owner: string, runId: string, expectedVersion: number) {
    const entry = this.get(owner, runId);
    if (entry.version !== expectedVersion) throw new Lab40Error(409, 'Host snapshot version changed.');
    if (entry.commandLedger.length || entry.effectLedger.length || entry.remoteEventIds.length) {
      entry.undo = 'refused'; entry.decision = 'Undo cannot erase accepted commands, effects or remote events; continue or reconcile.';
    } else { entry.hostDraft = entry.snapshotDraft; entry.undo = 'restored-host-draft'; entry.decision = 'Only the versioned host draft was restored.'; }
    entry.version++; entry.evidence.push(`Undo ${entry.undo}; remote history untouched.`); return this.view(entry);
  }
  close() { this.closed = true; this.entries.clear(); }
}
