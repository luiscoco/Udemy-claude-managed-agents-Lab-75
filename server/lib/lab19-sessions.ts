import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'node:crypto';
import { lab19DetailSchema, lab19ListSchema, lab19SummarySchema } from '../../shared/lab19-session-management.js';
import type { Lab19Branch, Lab19Detail, Lab19Event, Lab19Summary, Lab19Turn } from '../../shared/lab19-session-management.js';
import type { Lab15Snapshot } from '../../shared/lab15-usage.js';
import { createFixtureLab15Port, createLiveLab15Port } from './lab15-port.js';
import { Lab15Sessions } from './lab15-sessions.js';
import { createManagedClient, managedSettings } from './managed-config.js';

export class Lab19Error extends Error { constructor(public status: number, message: string) { super(message); } }
type Entry = { id: string; owner: string; internalOwner: string; sessions: Lab15Sessions; snapshot: Lab15Snapshot;
  mode: 'scripted' | 'live'; title: string; tag: string | null; lineageParentId: string | null; lineageBoundaryEventId: string | null;
  summaryHandoff: string | null; events: Lab19Event[]; version: number; busy: boolean; archived: boolean; providerStatus: string | null };
const publicText = (text: string) => text.slice(0, 1000);

export class Lab19Manager {
  private entries = new Map<string, Entry>(); private closed = false;
  constructor(private sdk?: Anthropic, private env: NodeJS.ProcessEnv = process.env) {}
  private client() { return this.sdk ?? createManagedClient(this.env); }
  private get(id: string, owner: string) {
    const entry = this.entries.get(id); if (!entry || entry.owner !== owner) throw new Lab19Error(404, 'Unknown or unowned conversation.');
    return entry;
  }
  private idle(entry: Entry) {
    if (entry.busy || entry.archived || entry.snapshot.state !== 'idle') throw new Lab19Error(409, 'An owned, confirmed-idle active session is required.');
  }
  private summary(entry: Entry): Lab19Summary {
    return lab19SummarySchema.parse({ conversationId: entry.id, sessionId: entry.snapshot.sessionId, mode: entry.mode,
      state: entry.archived ? 'archived' : entry.busy ? 'busy' : entry.snapshot.state,
      title: entry.title, tag: entry.tag, lineageParentId: entry.lineageParentId, lineageBoundaryEventId: entry.lineageBoundaryEventId,
      turnCount: entry.snapshot.messagesUsed, hostEventCount: entry.events.length, version: entry.version,
      cleanup: entry.snapshot.cleanup, providerStatus: entry.providerStatus });
  }
  private localPage(entry: Entry, cursor?: string) {
    const offset = cursor ? Number(/^p(\d+)$/.exec(cursor)?.[1] ?? -1) : 0;
    if (!Number.isInteger(offset) || offset < 0 || offset > entry.events.length) throw new Lab19Error(400, 'Invalid host history cursor.');
    const events = entry.events.slice(offset, offset + 4), next = offset + events.length;
    return { events, nextCursor: next < entry.events.length ? `p${next}` : null, omittedPages: next < entry.events.length,
      source: 'host-captured' as const };
  }
  private async providerPage(entry: Entry, cursor?: string) {
    const sessionId = entry.snapshot.sessionId; if (!sessionId) throw new Lab19Error(409, 'No Managed session ID exists.');
    const page = await this.client().beta.sessions.events.list(sessionId, { limit: 4, order: 'asc',
      types: ['user.message', 'agent.message'], ...(cursor ? { page: cursor } : {}) }, { timeout: 5000 });
    const events: Lab19Event[] = page.data.slice(0, 4).flatMap(event => {
      if (event.type !== 'user.message' && event.type !== 'agent.message') return [];
      const text = event.content.flatMap(block => block.type === 'text' ? [block.text] : []).join('\n');
      return [{ id: event.id.slice(0, 200), type: event.type, text: publicText(text), source: 'managed-api' as const }];
    });
    return { events, nextCursor: page.next_page?.slice(0, 200) ?? null, omittedPages: Boolean(page.next_page), source: 'managed-api' as const };
  }
  private async detailEntry(entry: Entry, cursor?: string, provider = false): Promise<Lab19Detail> {
    if (provider && entry.mode === 'live') {
      const remote = await this.client().beta.sessions.retrieve(entry.snapshot.sessionId!, {}, { timeout: 3000 });
      if (remote.id !== entry.snapshot.sessionId) throw new Lab19Error(409, 'Provider returned a different session ID.');
      entry.providerStatus = remote.status;
    }
    const page = provider && entry.mode === 'live' ? await this.providerPage(entry, cursor) : this.localPage(entry, cursor);
    return lab19DetailSchema.parse({ session: this.summary(entry), hostEvents: entry.events, page, summaryHandoff: entry.summaryHandoff,
      note: provider && entry.mode === 'live' ? 'Provider metadata and this bounded event page were retrieved after ownership validation.'
        : 'Host-captured events are a bounded handoff record, not the full remote transcript or hidden state.' });
  }
  async detail(id: string, owner: string, cursor?: string, provider = false) { return this.detailEntry(this.get(id, owner), cursor, provider); }
  async list(owner: string, verify = false) {
    const owned = [...this.entries.values()].filter(entry => entry.owner === owner);
    let providerListing: 'not-requested' | 'observed' | 'unavailable' = 'not-requested', providerPageOmitted = false;
    if (verify && owned.some(entry => entry.mode === 'live' && entry.snapshot.sessionId)) {
      try {
        const page = await this.client().beta.sessions.list({ limit: 20, include_archived: true }, { timeout: 5000 });
        const byId = new Map(page.data.map(session => [session.id, session.status]));
        for (const entry of owned) if (entry.mode === 'live' && entry.snapshot.sessionId && byId.has(entry.snapshot.sessionId))
          entry.providerStatus = byId.get(entry.snapshot.sessionId)!;
        providerListing = 'observed'; providerPageOmitted = Boolean(page.next_page);
      } catch { providerListing = 'unavailable'; }
    }
    return lab19ListSchema.parse({ sessions: owned.map(entry => this.summary(entry)), providerListing, providerPageOmitted,
      note: 'Only host-owned sessions are returned. A provider page may omit other owned sessions; absence there does not revoke ownership.' });
  }
  private newEntry(owner: string, mode: Entry['mode'], deadlineSeconds: number, budgetCents: number,
    lineageParentId: string | null = null, lineageBoundaryEventId: string | null = null, summaryHandoff: string | null = null) {
    if (this.closed || this.entries.size >= 6 || [...this.entries.values()].filter(entry => entry.owner === owner && !entry.archived).length >= 3)
      throw new Lab19Error(429, 'Close, delete or reset an existing conversation before creating another.');
    if (mode === 'live' && !managedSettings(this.env).liveReady) throw new Lab19Error(422, 'Live setup is unavailable. No session was created.');
    const id = randomUUID(), internalOwner = `${owner}:${id}`;
    const sessions = new Lab15Sessions(input => input.mode === 'live' ? createLiveLab15Port(input, this.sdk, this.env) : createFixtureLab15Port(input), this.env);
    const snapshot = sessions.prepare(internalOwner, { mode, scenario: 'normal', prompt: 'Lab 19 retained conversation', deadlineSeconds,
      budgetCents, maxTurns: 3, maxMessages: 3 });
    const entry: Entry = { id, owner, internalOwner, sessions, snapshot, mode, title: lineageParentId ? 'Derived conversation' : 'New conversation',
      tag: null, lineageParentId, lineageBoundaryEventId, summaryHandoff, events: [], version: 1, busy: false,
      archived: false, providerStatus: null };
    this.entries.set(id, entry); return entry;
  }
  private async send(entry: Entry, prompt: string, signal: AbortSignal, emit: (snapshot: Lab15Snapshot) => void) {
    if (entry.busy) throw new Lab19Error(409, 'A turn is already active for this conversation.');
    entry.busy = true;
    try {
      entry.snapshot = await entry.sessions.execute(entry.snapshot.runId, entry.internalOwner, { type: 'send', prompt }, signal, snapshot => {
        entry.snapshot = snapshot; emit(snapshot);
      });
      if (entry.snapshot.state === 'idle' && entry.snapshot.outcome?.kind === 'completed') {
        entry.events.push({ id: randomUUID(), type: 'user.message', text: publicText(prompt), source: 'host-captured' },
          { id: randomUUID(), type: 'agent.message', text: publicText(entry.snapshot.response.trim()), source: 'host-captured' });
      }
      entry.version++;
      entry.busy = false;
      return this.detailEntry(entry);
    } finally { entry.busy = false; }
  }
  async turn(owner: string, input: Lab19Turn, signal: AbortSignal, emit: (snapshot: Lab15Snapshot) => void) {
    const entry = input.action === 'new' ? this.newEntry(owner, input.mode, input.deadlineSeconds, input.budgetCents)
      : this.get(input.conversationId!, owner);
    if (entry.mode !== input.mode) throw new Lab19Error(409, 'Conversation mode differs from the request.');
    if (input.action === 'continue') this.idle(entry);
    return this.send(entry, input.prompt, signal, emit);
  }
  async branch(id: string, owner: string, input: Lab19Branch, signal: AbortSignal, emit: (snapshot: Lab15Snapshot) => void) {
    const parent = this.get(id, owner); this.idle(parent);
    const index = parent.events.findIndex(event => event.id === input.boundaryEventId);
    if (index < 0) throw new Lab19Error(404, 'Selected host evidence boundary is unknown for this conversation.');
    const selected = parent.events.slice(0, index + 1);
    const summary = selected.map(event => `${event.type === 'user.message' ? 'User' : 'Agent'}: ${event.text}`).join(' ').slice(0, 400);
    const child = this.newEntry(owner, parent.mode, input.deadlineSeconds, input.budgetCents, parent.id, input.boundaryEventId, summary);
    const prompt = `Selected-history summary (host-authored; no hidden state or pending calls): ${summary}\nNew request: ${input.prompt}`.slice(0, 1000);
    const detail = await this.send(child, prompt, signal, emit);
    if (child.mode === 'live' && child.snapshot.state === 'idle' && child.snapshot.sessionId) {
      try { await this.client().beta.sessions.update(child.snapshot.sessionId, { title: child.title,
        metadata: { lab19_parent_session: parent.snapshot.sessionId ?? '', lab19_boundary_event: input.boundaryEventId } }, { timeout: 5000 }); }
      catch { return { ...detail, note: 'Derived session exists; provider lineage metadata update was unavailable. Host lineage and explicit prompt remain recorded.' }; }
    }
    return detail;
  }
  async rename(id: string, owner: string, title: string) {
    const entry = this.get(id, owner); this.idle(entry);
    if (entry.mode === 'live') {
      const remote = await this.client().beta.sessions.update(entry.snapshot.sessionId!, { title }, { timeout: 5000 });
      if (remote.id !== entry.snapshot.sessionId || remote.title !== title) throw new Lab19Error(409, 'Provider title update was not confirmed.');
    }
    entry.title = title; entry.version++; return this.detailEntry(entry);
  }
  async tag(id: string, owner: string, tag: string) {
    const entry = this.get(id, owner); this.idle(entry);
    if (entry.mode === 'live') {
      const remote = await this.client().beta.sessions.update(entry.snapshot.sessionId!, { metadata: { lab19_tag: tag } }, { timeout: 5000 });
      if (remote.id !== entry.snapshot.sessionId || remote.metadata?.lab19_tag !== tag) throw new Lab19Error(409, 'Provider metadata patch was not confirmed.');
    }
    entry.tag = tag; entry.version++; return this.detailEntry(entry);
  }
  async archive(id: string, owner: string) {
    const entry = this.get(id, owner); this.idle(entry);
    entry.snapshot = await entry.sessions.end(entry.snapshot.runId, entry.internalOwner);
    if (entry.snapshot.state !== 'closed') throw new Lab19Error(409, 'Archive is unconfirmed; inspect remote cleanup.');
    entry.archived = true; entry.version++; return this.detailEntry(entry);
  }
  async delete(id: string, owner: string) {
    const entry = this.get(id, owner); this.idle(entry);
    if (!entry.snapshot.sessionId) throw new Lab19Error(409, 'No established idle session exists to delete.');
    if (entry.mode === 'live') {
      const deleted = await this.client().beta.sessions.delete(entry.snapshot.sessionId, {}, { timeout: 5000 });
      if (deleted.id !== entry.snapshot.sessionId) throw new Lab19Error(409, 'Provider deletion was not confirmed.');
    }
    this.entries.delete(id);
    return { deleted: true as const, conversationId: id, sessionId: entry.snapshot.sessionId,
      note: 'Deletion removed this owned idle session. Archive is a separate history-preserving action.' };
  }
  async reset(owner: string) {
    const entries = [...this.entries.values()].filter(entry => entry.owner === owner);
    if (entries.some(entry => entry.mode !== 'scripted' || entry.busy || !['idle', 'closed', 'prepared'].includes(entry.snapshot.state)))
      throw new Lab19Error(409, 'Reset is limited to owned idle offline fixtures.');
    for (const entry of entries) {
      if (!entry.archived) await entry.sessions.end(entry.snapshot.runId, entry.internalOwner);
      this.entries.delete(entry.id);
    }
    return { reset: true as const, removed: entries.length, note: 'Owned offline fixtures were closed and removed from the host inventory.' };
  }
  async close() { this.closed = true; await Promise.allSettled([...this.entries.values()].filter(entry => !entry.archived).map(entry => entry.sessions.close())); }
}
