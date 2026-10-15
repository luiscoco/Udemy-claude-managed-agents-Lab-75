import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lab35EventSchema, lab35SnapshotSchema } from '../../shared/lab35-session-stores.js';
import type { Lab35Manage, Lab35Run } from '../../shared/lab35-session-stores.js';

export class Lab35Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Event = ReturnType<typeof lab35EventSchema.parse>;
type DiskEntry = { conversationId: string; owner: string; sessionId: string; remoteState: 'idle' | 'archived';
  flush: 'eager' | 'batched'; threads: string[]; mirrorIncomplete: boolean; appendFails: boolean };
type Entry = DiskEntry & { pending: Event[] };
const idPart = (id: string) => id.replaceAll('-', '');
const safeEvent = (entry: Entry, sequence: number): Event => lab35EventSchema.parse({
  eventId: `sevt_${idPart(entry.conversationId)}_${sequence}`, sessionId: entry.sessionId,
  threadId: sequence === 2 ? entry.threads[1]! : entry.threads[0]!, sequence,
  kind: sequence === 0 ? 'user' : 'agent', text: sequence === 0 ? 'Summarize a fictional field note.' :
    sequence === 1 ? 'A fictional observation includes time, place and count.' : 'Worker thread adds a checked detail.' });

export class Lab35Mirror {
  readonly root: string; private entries = new Map<string, Entry>(); private closed = false;
  constructor(root = join(tmpdir(), `managed-lab35-${randomUUID()}`)) { this.root = root; mkdirSync(root, { recursive: true });
    if (!existsSync(join(root, 'effects.json'))) writeFileSync(join(root, 'effects.json'), '[]'); this.load(); }
  private indexPath() { return join(this.root, 'index.json'); }
  private dir(entry: Entry) { return join(this.root, entry.conversationId); }
  private path(entry: Entry, threadId: string) { return join(this.dir(entry), `${threadId}.jsonl`); }
  private load() {
    this.entries.clear(); if (!existsSync(this.indexPath())) return;
    const rows = JSON.parse(readFileSync(this.indexPath(), 'utf8')) as DiskEntry[];
    if (!Array.isArray(rows) || rows.length > 12) throw new Lab35Error(500, 'Mirror index is invalid.');
    for (const row of rows) {
      if (!/^[0-9a-f-]{36}$/.test(row.conversationId) || !/^sesn_[a-z0-9]+$/i.test(row.sessionId) ||
        !Array.isArray(row.threads) || row.threads.length !== 2 || row.threads.some(id => !/^thrd_[a-z0-9]+$/i.test(id)))
        throw new Lab35Error(500, 'Mirror index contains unsafe keys.');
      this.entries.set(row.conversationId, { ...row, pending: [] });
    }
  }
  private writeIndex() {
    const rows: DiskEntry[] = [...this.entries.values()].map(({ pending: _pending, ...row }) => row);
    const temporary = join(this.root, `index-${randomUUID()}.tmp`);
    writeFileSync(temporary, JSON.stringify(rows)); renameSync(temporary, this.indexPath());
  }
  private get(owner: string, conversationId: string) { const entry = this.entries.get(conversationId);
    if (!entry || entry.owner !== owner) throw new Lab35Error(404, 'Unknown or unowned conversation.'); return entry; }
  private persisted(entry: Entry): Event[] {
    const events: Event[] = [];
    for (const threadId of entry.threads) {
      const path = this.path(entry, threadId); if (!existsSync(path)) continue;
      const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
      if (lines.length > 20) throw new Lab35Error(500, 'Mirror load bound exceeded.');
      for (const line of lines) events.push(lab35EventSchema.parse(JSON.parse(line)));
    }
    return events.sort((a, b) => a.sequence - b.sequence);
  }
  private view(entry: Entry) {
    const stored = this.persisted(entry);
    return lab35SnapshotSchema.parse({ source: 'authored-fixture', conversationId: entry.conversationId, owner: entry.owner,
      sessionId: entry.sessionId, remoteState: entry.remoteState, flush: entry.flush, persistedCount: stored.length,
      pendingCount: entry.pending.length, threads: entry.threads, mirrorStatus: entry.mirrorIncomplete || entry.pending.length ? 'incomplete' : 'complete',
      appendFails: entry.appendFails, effectLedgerCount: 0, providerCalls: 0, events: stored,
      note: 'The local mirror contains canonical sevt_ events only. It neither owns the remote session nor restores its sandbox.' });
  }
  private append(entry: Entry, event: Event) {
    if (entry.appendFails) { entry.mirrorIncomplete = true; this.writeIndex(); throw new Lab35Error(507, 'Simulated append failure; remote state is unchanged and mirror is incomplete.'); }
    const stored = this.persisted(entry); if (stored.some(item => item.eventId === event.eventId)) return;
    mkdirSync(this.dir(entry), { recursive: true }); appendFileSync(this.path(entry, event.threadId), `${JSON.stringify(event)}\n`);
  }
  run(owner: string, input: Lab35Run) {
    if (input.mode === 'live') throw new Lab35Error(422, 'Live continuation needs an existing owned Managed session and a dedicated adapter.');
    if (this.closed || this.entries.size >= 12) throw new Lab35Error(429, 'Mirror capacity reached.');
    const conversationId = randomUUID(), part = idPart(conversationId);
    const entry: Entry = { conversationId, owner, sessionId: `sesn_${part}`, remoteState: 'idle', flush: input.flush,
      threads: [`thrd_${part}m`, `thrd_${part}w`], mirrorIncomplete: input.scenario === 'missing-thread',
      appendFails: input.scenario === 'append-failure', pending: [] };
    this.entries.set(conversationId, entry); this.writeIndex();
    for (const sequence of [0, 1]) {
      const event = safeEvent(entry, sequence);
      if (input.flush === 'eager') { try { this.append(entry, event); } catch (error) { if (!(error instanceof Lab35Error)) throw error; break; } }
      else entry.pending.push(event);
    }
    return this.view(entry);
  }
  entriesFor(owner: string) { return [...this.entries.values()].filter(entry => entry.owner === owner).map(entry => this.view(entry)); }
  inspect(owner: string, conversationId: string) { return this.view(this.get(owner, conversationId)); }
  failures(owner: string, conversationId: string, appendFails: boolean) { const entry = this.get(owner, conversationId);
    entry.appendFails = appendFails; this.writeIndex(); return this.view(entry); }
  manage(owner: string, input: Lab35Manage) {
    const entry = this.get(owner, input.conversationId);
    if (input.operation === 'flush') {
      for (const event of [...entry.pending]) { this.append(entry, event); entry.pending.shift(); }
      if (!entry.mirrorIncomplete) this.writeIndex(); return this.view(entry);
    }
    if (input.operation === 'crash-restart') {
      const lost = entry.pending.length; if (lost) { entry.mirrorIncomplete = true; this.writeIndex(); }
      this.load(); return this.view(this.get(owner, input.conversationId));
    }
    if (input.operation === 'archive') { entry.remoteState = 'archived'; this.writeIndex(); return this.view(entry); }
    if (entry.remoteState === 'archived') throw new Lab35Error(409, 'Archived remote session cannot be resumed by a mirror.');
    for (const sequence of [1, 2]) {
      if (sequence === 2 && entry.mirrorIncomplete && !entry.pending.length && !this.persisted(entry).length) continue;
      const event = safeEvent(entry, sequence);
      if (entry.flush === 'batched') {
        if (!entry.pending.some(item => item.eventId === event.eventId) && !this.persisted(entry).some(item => item.eventId === event.eventId)) entry.pending.push(event);
      } else this.append(entry, event);
    }
    return this.view(entry);
  }
  reset(owner: string, conversationId: string) { const entry = this.get(owner, conversationId);
    rmSync(this.dir(entry), { recursive: true, force: true }); this.entries.delete(conversationId); this.writeIndex(); return { deleted: true }; }
  close() { this.closed = true; }
  destroy() { this.close(); rmSync(this.root, { recursive: true, force: true }); }
}
