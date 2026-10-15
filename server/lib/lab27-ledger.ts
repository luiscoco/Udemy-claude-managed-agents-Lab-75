import { randomUUID } from 'node:crypto';
import type { Lab27Call, Lab27Open } from '../../shared/lab27-background-tasks.js';
import { lab27SnapshotSchema } from '../../shared/lab27-background-tasks.js';

export class Lab27Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Event = { id: string; type: 'task.running' | 'task.completed' | 'task.stopped' | 'child.started'; snapshot?: boolean };
type Entry = { owner: string; taskId: string; sessionId: string; threadId: string; taskState: 'running' | 'completed' | 'stopped' | 'closed';
  remoteStatus: 'running' | 'idle' | 'archived'; browserConnection: 'attached' | 'detached'; childActivity: 'none' | 'authored-event';
  eventIds: string[]; report: string | null; stopEvidence: 'not-requested' | 'confirmed-idle'; snapshotApplied: boolean;
  expires: number; timer: ReturnType<typeof setTimeout> | undefined };
export class Lab27Ledger {
  private entries = new Map<string, Entry>(); private closed = false;
  constructor(private now = () => Date.now(), private workMs = 1200) {}
  private get(owner: string, taskId: string) { const entry = this.entries.get(taskId);
    if (!entry || entry.owner !== owner) throw new Lab27Error(404, 'Unknown or unowned task.');
    if (this.now() > entry.expires) { if (entry.timer) clearTimeout(entry.timer); entry.timer = undefined;
      entry.taskState = 'closed'; entry.remoteStatus = 'archived'; throw new Lab27Error(410, 'Retained task expired; cleanup was initiated.'); }
    return entry; }
  private view(entry: Entry) { return lab27SnapshotSchema.parse({ taskId: entry.taskId, sessionId: entry.sessionId, threadId: entry.threadId,
    source: 'authored-fixture', taskState: entry.taskState, remoteStatus: entry.remoteStatus,
    browserConnection: entry.browserConnection, childActivity: entry.childActivity, createCount: 1, duplicateCards: 0,
    eventIds: entry.eventIds, report: entry.report, reportVerified: false, stopEvidence: entry.stopEvidence,
    snapshotApplied: entry.snapshotApplied,
    note: 'Host task ledger fixture. Reconnect reads the same entry and never creates a second session; report text still needs verification.' }); }
  open(owner: string, input: Lab27Open) {
    if (input.mode !== 'scripted') throw new Lab27Error(422, 'Live task control requires a configured Managed adapter; no billed session was opened.');
    if (!input.backgroundAllowed) throw new Lab27Error(422, 'Host policy disables background work.');
    if (this.closed || this.entries.size >= 12 || [...this.entries.values()].filter(e => e.owner === owner && e.taskState !== 'closed').length >= 3)
      throw new Lab27Error(429, 'Task capacity reached.');
    const entry: Entry = { owner, taskId: randomUUID(), sessionId: randomUUID(), threadId: randomUUID(), taskState: 'running',
      remoteStatus: 'running', browserConnection: 'attached', childActivity: 'none', eventIds: [], report: null,
      stopEvidence: 'not-requested', snapshotApplied: false, expires: this.now() + 300_000, timer: undefined };
    this.entries.set(entry.taskId, entry);
    this.observe(entry, { id: 'task-started', type: 'task.running' });
    this.observe(entry, { id: 'child-started', type: 'child.started' });
    if (input.scenario === 'completed') this.observe(entry, { id: 'task-completed', type: 'task.completed' });
    else { entry.timer = setTimeout(() => this.observe(entry, { id: 'task-completed', type: 'task.completed' }), this.workMs); entry.timer.unref?.(); }
    return this.view(entry);
  }
  // A host snapshot replaces task state only when explicitly marked as such. Event replay is idempotent by event ID.
  observe(entry: Entry, event: Event) {
    if (entry.taskState === 'closed' || entry.eventIds.includes(event.id)) return;
    if (event.snapshot) { entry.eventIds = []; entry.snapshotApplied = true; }
    entry.eventIds.push(event.id);
    if (event.type === 'child.started') entry.childActivity = 'authored-event';
    if (event.type === 'task.running') { entry.taskState = 'running'; entry.remoteStatus = 'running'; }
    if (event.type === 'task.completed') { entry.taskState = 'completed'; entry.remoteStatus = 'idle';
      entry.report = 'Authored completion report: Aurora Finch notebook prepared. Independent report verification remains pending.'; entry.timer = undefined; }
    if (event.type === 'task.stopped') { entry.taskState = 'stopped'; entry.remoteStatus = 'idle'; entry.stopEvidence = 'confirmed-idle'; entry.timer = undefined; }
  }
  call(owner: string, input: Lab27Call) {
    const entry = this.get(owner, input.taskId);
    switch (input.operation) {
      case 'detach': entry.browserConnection = 'detached'; break;
      case 'reconnect': entry.browserConnection = 'attached';
        // Authored history replay includes an old running event. Its stable ID prevents rollback or duplicate cards.
        this.observe(entry, { id: 'task-started', type: 'task.running' }); break;
      case 'inspect': break;
      case 'stop': if (entry.taskState === 'running') { if (entry.timer) clearTimeout(entry.timer);
        this.observe(entry, { id: 'stop-confirmed-idle', type: 'task.stopped' }); } break;
      case 'close': if (entry.remoteStatus !== 'idle') throw new Lab27Error(409, 'Stop work and confirm idle before archive.');
        entry.taskState = 'closed'; entry.remoteStatus = 'archived'; break;
    }
    return this.view(entry);
  }
  oneshot(owner: string, input: Lab27Open) {
    if (input.scenario !== 'completed') throw new Lab27Error(400, 'One-shot requires the completed fixture.');
    const opened = this.open(owner, input); return this.call(owner, { operation: 'close', taskId: opened.taskId });
  }
  close() { this.closed = true; for (const entry of this.entries.values()) {
    if (entry.timer) clearTimeout(entry.timer); entry.timer = undefined; entry.taskState = 'closed'; entry.remoteStatus = 'archived'; } }
}
