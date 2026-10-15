import { createHash, randomUUID } from 'node:crypto';
import { lab17ReportSchema, lab17SessionSchema } from '../../shared/lab17-checkpointing.js';
import type { Lab17Plan, Lab17Report, Lab17Restore, Lab17Send, Lab17SessionInput } from '../../shared/lab17-checkpointing.js';
import type { Lab15Snapshot } from '../../shared/lab15-usage.js';
import { Lab15Sessions } from './lab15-sessions.js';
import { createFixtureLab15Port, createLiveLab15Port } from './lab15-port.js';
import { createManagedClient } from './managed-config.js';
import { applyLab17Changes, createLab17Tree, lab17Changes, lab17Files, persistLab17Snapshot, readLab17, writeLab17 } from './lab17-files.js';

export class Lab17Error extends Error { constructor(public status: number, message: string) { super(message); } }
type Contents = Record<'notes.md' | 'draft.md', string | null>;
type Saved = { metadata: Lab17Report['snapshots'][number]; contents: Contents };
type Entry = { owner: string; runId: string; underlying: Lab15Snapshot; root: string; busy: boolean; version: number;
  snapshots: Saved[]; plan: Lab17Plan | null; turns: Lab17Report['turns']; hostHandlerCalls: number;
  remoteOutputs: Lab17Report['remoteOutputs']; message: string };
export class Lab17Manager {
  private entries = new Map<string, Entry>(); private closed = false;
  private observedManagedIds = new Map<string, string[]>();
  private sessions: Lab15Sessions;
  constructor(sessions?: Lab15Sessions, private env = process.env) {
    this.sessions = sessions ?? new Lab15Sessions(input => {
      const base = input.mode === 'live' ? createLiveLab15Port(input, undefined, env) : createFixtureLab15Port(input);
      return { ...base, open: async (id, signal) => {
        const stream = await base.open(id, signal);
        const observed = this.observedManagedIds;
        return (async function* () {
          for await (const event of stream) {
            if ('id' in event && typeof event.id === 'string' && event.id !== 'stale_idle') {
              const ids = observed.get(id) ?? [];
              if (!ids.includes(event.id)) observed.set(id, [...ids, event.id].slice(-12));
            }
            yield event;
          }
        })();
      } };
    }, env);
  }
  private get(runId: string, owner: string) { const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab17Error(404, 'Unknown or unowned fixture session.'); return entry; }
  private idle(entry: Entry) {
    if (entry.busy || !['prepared', 'idle'].includes(entry.underlying.state))
      throw new Lab17Error(409, 'A confirmed idle or prepared session is required. Active, paused or uncertain work cannot be restored.');
  }
  private async report(entry: Entry, final = false): Promise<Lab17Report> {
    return lab17ReportSchema.parse({ runId: entry.runId, mode: entry.underlying.source === 'managed-api' ? 'live' : 'scripted', source: entry.underlying.source,
      state: entry.busy && !final ? 'busy' : entry.underlying.state, version: entry.version, sessionId: entry.underlying.sessionId,
      files: await lab17Files(entry.root), snapshots: entry.snapshots.map(item => item.metadata), plan: entry.plan, turns: entry.turns,
      remoteOutputs: entry.remoteOutputs, builtInFilesystemToolsEnabled: false, hostHandlerCalls: entry.hostHandlerCalls,
      cleanup: entry.underlying.cleanup, message: entry.message });
  }
  async session(owner: string, raw: unknown) {
    const input = lab17SessionSchema.parse(raw);
    for (const [id, entry] of this.entries) if (entry.underlying.state === 'closed') this.entries.delete(id);
    if (this.closed || this.entries.size >= 2 || [...this.entries.values()].some(entry => entry.owner === owner))
      throw new Lab17Error(429, 'Close the existing fixture session or reconcile pending cleanup first.');
    const underlying = this.sessions.prepare(owner, { mode: input.mode, scenario: 'normal', prompt: 'Lab 17 host file history',
      budgetCents: input.budgetCents, maxTurns: 3, maxMessages: 3, deadlineSeconds: input.deadlineSeconds });
    let root: string;
    try { root = await createLab17Tree(underlying.runId); }
    catch (error) { await this.sessions.end(underlying.runId, owner); throw error; }
    const entry: Entry = { owner, runId: underlying.runId, underlying, root, busy: false, version: 1, snapshots: [], plan: null, turns: [],
      hostHandlerCalls: 0, remoteOutputs: { status: 'not-inspected', files: [], note: 'Remote outputs have not been inspected.' },
      message: 'Prepared a local fixture tree and owned session. No model turn has started.' };
    this.entries.set(entry.runId, entry); return this.report(entry);
  }
  async inspect(runId: string, owner: string) { return this.report(this.get(runId, owner)); }
  private async hostAction(entry: Entry, action: Lab17Send['action'], text: string) {
    if (action === 'read-notes') { const current = await readLab17(entry.root, 'notes.md'); entry.hostHandlerCalls++; return `Read notes.md: ${current ?? '(absent)'}`; }
    if (action === 'edit-notes') {
      const current = await readLab17(entry.root, 'notes.md');
      if (!current?.includes('Status: draft')) throw new Lab17Error(409, 'notes.md no longer has the draft status.');
      const status = text.trim() || 'reviewed'; if (!/^[A-Za-z ]{1,40}$/.test(status)) throw new Lab17Error(400, 'Use a short alphabetic status.');
      await writeLab17(entry.root, 'notes.md', current.replace('Status: draft', `Status: ${status}`));
      entry.version++; entry.hostHandlerCalls++; return 'Edited tracked notes.md on the host.';
    }
    if (action === 'create-draft') { await writeLab17(entry.root, 'draft.md', text || 'Aurora Finch summary\n');
      entry.version++; entry.hostHandlerCalls++; return 'Created tracked draft.md on the host.'; }
    if (action === 'create-untracked') { await writeLab17(entry.root, 'scratch.md', text || 'Untracked observer note\n');
      entry.version++; entry.hostHandlerCalls++; return 'Created untracked scratch.md on the host. Snapshots will leave it alone.'; }
    throw new Lab17Error(400, 'Unsupported host action.');
  }
  private async inspectOutputs(entry: Entry) {
    if (entry.underlying.source === 'authored-fixture') {
      entry.remoteOutputs = { status: 'authored-none', files: [], note: 'Offline fixture has no remote files; no provider request occurred.' }; return;
    }
    const sessionId = entry.underlying.sessionId;
    if (!sessionId) throw new Lab17Error(409, 'No remote session ID is available.');
    const client = createManagedClient(this.env);
    try {
      const page = await client.beta.files.list({ scope_id: sessionId, limit: 10 }, { timeout: 5000 });
      const files: Lab17Report['remoteOutputs']['files'] = [];
      for (const file of page.data.slice(0, 3)) {
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}\.(txt|md)$/.test(file.filename) || file.size_bytes > 65536) continue;
        const response = await client.files.download(file.id, {}, { timeout: 5000 });
        const bytes = Buffer.from(await response.arrayBuffer()); if (bytes.length > 65536) continue;
        files.push({ name: file.filename, sizeBytes: bytes.length, hash: createHash('sha256').update(bytes).digest('hex') });
      }
      entry.remoteOutputs = { status: files.length ? 'downloaded' : 'none', files,
        note: 'Session-scoped files were downloaded and hashed separately; none entered the host snapshot tree.' };
    } catch { entry.remoteOutputs = { status: 'failed', files: [], note: 'Remote output inspection failed; no host snapshot file changed.' }; }
  }
  async send(owner: string, raw: Lab17Send, signal: AbortSignal, emit: (report: Lab17Report) => void) {
    const entry = this.get(raw.runId, owner); this.idle(entry);
    if (entry.version !== raw.expectedVersion) throw new Lab17Error(409, 'Fixture version changed. Inspect the latest state before sending.');
    entry.busy = true; entry.plan = null;
    try {
      if (raw.action === 'inspect-remote-outputs') { if (entry.underlying.state !== 'idle') throw new Lab17Error(409, 'An established idle session is required.');
        await this.inspectOutputs(entry); entry.message = entry.remoteOutputs.note; return await this.report(entry, true); }
      const session = await this.sessions.execute(entry.runId, owner, { type: 'send', prompt: raw.prompt }, signal, snapshot => {
        entry.underlying = snapshot; void this.report(entry).then(emit).catch(() => {});
      });
      entry.underlying = session;
      if (session.state !== 'idle' || session.outcome?.kind !== 'completed') {
        entry.message = 'Session turn did not complete at confirmed idle; the host file handler did not run.'; return await this.report(entry, true);
      }
      const hostEventId = randomUUID();
      let effect: string;
      try { effect = await this.hostAction(entry, raw.action, raw.text); }
      catch (error) { effect = error instanceof Error ? `Host handler rejected: ${error.message}` : 'Host handler failed.'; }
      entry.turns.push({ hostEventId, prompt: raw.prompt, response: session.response.slice(0, 1000), action: raw.action,
        sessionId: session.sessionId, outcome: session.outcome });
      entry.message = `${effect} Conversation history retains ${entry.turns.length} turn(s). Host effect is independent of the model's claim.`;
      return await this.report(entry, true);
    } finally { entry.busy = false; }
  }
  async snapshot(runId: string, owner: string) {
    const entry = this.get(runId, owner); this.idle(entry);
    if (entry.snapshots.length >= 5) throw new Lab17Error(409, 'At most five snapshots are kept in this experiment.');
    entry.busy = true;
    try {
      const files = await lab17Files(entry.root), contents: Contents = { 'notes.md': files[0]!.content, 'draft.md': files[1]!.content };
      const snapshotId = randomUUID();
      const metadata: Saved['metadata'] = { snapshotId, version: entry.version, createdAt: new Date().toISOString(), sessionId: entry.underlying.sessionId,
        relatedHostEventIds: entry.turns.map(turn => turn.hostEventId), relatedManagedEventIds: (this.observedManagedIds.get(entry.underlying.sessionId ?? '') ?? []).slice(-12),
        files: files.slice(0, 2).map(({ path, tracked, exists, hash }) => ({ path, tracked, exists, hash })) as Saved['metadata']['files'] };
      await persistLab17Snapshot(entry.root, snapshotId, contents); entry.snapshots.push({ metadata, contents }); entry.plan = null;
      entry.message = 'Snapshot recorded two tracked host paths, the session ID and observed host/stream event IDs.';
      return await this.report(entry, true);
    } finally { entry.busy = false; }
  }
  async restore(owner: string, input: Lab17Restore) {
    const entry = this.get(input.runId, owner); this.idle(entry);
    if (entry.version !== input.expectedVersion) throw new Lab17Error(409, 'Fixture version changed after the proposed restore.');
    const saved = entry.snapshots.find(item => item.metadata.snapshotId === input.snapshotId);
    if (!saved) throw new Lab17Error(404, 'Unknown snapshot for this owned fixture session.');
    entry.busy = true;
    try {
      if (input.dryRun) {
        entry.plan = { planId: randomUUID(), snapshotId: input.snapshotId, expectedVersion: entry.version,
          changes: await lab17Changes(entry.root, saved.contents), untrackedUntouched: true, remoteSessionUntouched: true };
        entry.message = 'Dry run lists exact tracked-path restores/deletes. Confirm with this plan ID and unchanged fixture version.';
      } else {
        if (!entry.plan || entry.plan.planId !== input.planId || entry.plan.snapshotId !== input.snapshotId || entry.plan.expectedVersion !== entry.version)
          throw new Lab17Error(409, 'Dry-run plan is missing or stale; no file changed.');
        await applyLab17Changes(entry.root, entry.plan, saved.contents);
        if (entry.plan.changes.length) entry.version++;
        entry.plan = null; entry.message = `Restored tracked host files only. ${entry.turns.length} conversation turn(s) and the remote sandbox remain untouched.`;
      }
      return await this.report(entry, true);
    } finally { entry.busy = false; }
  }
  async end(runId: string, owner: string) { const entry = this.get(runId, owner);
    entry.underlying = await this.sessions.end(runId, owner); entry.plan = null;
    entry.message = entry.underlying.state === 'closed' ? 'Session archived; fixture files and snapshots remain as host evidence.' : 'Remote cleanup remains pending; do not start another session.';
    return this.report(entry); }
  async oneshot(owner: string, input: { session: Lab17SessionInput; action: 'read-notes' | 'edit-notes' | 'create-draft'; prompt: string; text: string }, signal: AbortSignal) {
    const created = await this.session(owner, input.session);
    try { await this.send(owner, { runId: created.runId, action: input.action, prompt: input.prompt, text: input.text, expectedVersion: created.version }, signal, () => {}); }
    finally { await this.end(created.runId, owner); }
    return this.inspect(created.runId, owner);
  }
  async close() { this.closed = true; await this.sessions.close(); }
}
