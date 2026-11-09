import { randomUUID } from 'node:crypto';
import { FixtureLab06Port } from './lab06-port.js';
import { lab41SnapshotSchema } from '../../shared/lab41-v2-session-api.js';
import type { Lab41Action, Lab41Scenario } from '../../shared/lab41-v2-session-api.js';

export class Lab41Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Entry = { owner: string; runId: string; scenario: Lab41Scenario; sessionId: string; status: 'idle' | 'archived' | 'interrupted-idle';
  userEventIds: string[]; agentEventIds: string[]; history: Awaited<ReturnType<FixtureLab06Port['history']>>;
  lifecycle: string[]; archiveCount: number; expiresAt: number };
export class Lab41Lifecycle {
  private entries = new Map<string, Entry>(); private port = new FixtureLab06Port(); private closed = false;
  constructor(private now = () => Date.now()) {}
  facts() { return { source: 'host-only', sdk: '@anthropic-ai/sdk@1.7.0', currentApi: ['sessions.create', 'events.stream', 'events.send', 'events.list', 'sessions.retrieve', 'sessions.archive'],
    historical: 'A prior local-process model is described only; no legacy runtime is loaded.', processCountClaim: false, jsonlCompatibilityClaim: false, providerCalls: 0 }; }
  private get(owner: string, runId: string) { const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab41Error(404, 'Unknown or unowned lifecycle run.');
    if (this.now() > entry.expiresAt) { this.entries.delete(runId); throw new Lab41Error(410, 'Lifecycle run expired.'); }
    return entry; }
  private async view(entry: Entry) { return lab41SnapshotSchema.parse({ source: 'authored-fixture', runId: entry.runId,
    scenario: entry.scenario, sessionId: entry.sessionId, status: entry.status, createdSessions: 1,
    userEventIds: entry.userEventIds, agentEventIds: entry.agentEventIds,
    history: entry.history, lifecycle: entry.lifecycle,
    reconnectCreates: 0, archiveCount: entry.archiveCount, providerCalls: 0,
    note: 'Offline Managed-shaped port; resolved fixture IDs and host actions, not billed provider evidence.' }); }
  private async turn(entry: Entry, prompt: string) {
    if (entry.status === 'archived') throw new Lab41Error(409, 'Archived session refuses a new turn.');
    const controller = new AbortController(), stream = await this.port.open(entry.sessionId, controller.signal, 'normal');
    try { const userId = await this.port.send(entry.sessionId, prompt, controller.signal); entry.userEventIds.push(userId);
      let idle = false; for await (const event of stream.events) {
        if (event.type === 'agent.message') entry.agentEventIds.push(event.id);
        if (event.type === 'session.status_idle') { idle = true; break; }
      }
      if (!idle) throw new Lab41Error(502, 'Turn ended without idle confirmation.');
      if (await this.port.status(entry.sessionId) !== 'idle') throw new Lab41Error(502, 'Session retrieve did not confirm idle.');
      entry.status = 'idle'; entry.history = await this.port.history(entry.sessionId);
      entry.lifecycle.push(`events.send ${userId}; stream agent reply; confirmed session.status_idle and sessions.retrieve idle`);
    } finally { stream.close(); controller.abort(); }
  }
  private async archive(entry: Entry) { if (entry.status === 'archived') throw new Lab41Error(409, 'Session already archived.');
    await this.port.archive(entry.sessionId); entry.status = 'archived'; entry.archiveCount = 1; entry.lifecycle.push('sessions.archive after idle'); }
  async start(owner: string, scenario: Lab41Scenario) {
    for (const [id, entry] of this.entries) if (this.now() > entry.expiresAt) this.entries.delete(id);
    if (this.closed || this.entries.size >= 16) throw new Lab41Error(429, 'Lifecycle exercise capacity reached.');
    const created = await this.port.create({} as Parameters<FixtureLab06Port['create']>[0]);
    const entry: Entry = { owner, runId: randomUUID(), scenario, sessionId: created.id, status: 'idle', userEventIds: [],
      agentEventIds: [], history: [], lifecycle: [`sessions.create resolved ${created.id}`], archiveCount: 0, expiresAt: this.now() + 10 * 60_000 };
    this.entries.set(entry.runId, entry);
    await this.turn(entry, 'The fictional project is called Aurora Notebook.');
    if (scenario === 'one-shot' || scenario === 'archived-refusal') await this.archive(entry);
    return this.view(entry);
  }
  async state(owner: string, runId: string) { return this.view(this.get(owner, runId)); }
  async act(owner: string, runId: string, action: Lab41Action) { const entry = this.get(owner, runId);
    if (action === 'second-turn') await this.turn(entry, 'What is the fictional project name?');
    else if (action === 'interrupt') { if (entry.status !== 'idle') throw new Lab41Error(409, 'Interrupt requires an idle retained session in this fixture.');
      await this.port.interrupt(entry.sessionId); entry.status = 'interrupted-idle'; entry.lifecycle.push('user.interrupt; fixture idle confirmed; same session retained'); }
    else if (action === 'reconnect') { if (entry.status === 'archived') throw new Lab41Error(409, 'Archived session cannot reconnect.');
      entry.history = await this.port.history(entry.sessionId); entry.lifecycle.push('events.list hydrated history; no sessions.create'); }
    else if (action === 'archive') await this.archive(entry);
    else { if (entry.status !== 'archived') throw new Lab41Error(409, 'Archive first to inspect refusal.');
      entry.lifecycle.push('Archived session refused new send; no events.send'); }
    return this.view(entry); }
  async close() { this.closed = true; for (const entry of this.entries.values()) if (entry.status !== 'archived') await this.port.archive(entry.sessionId).catch(() => {}); this.entries.clear(); }
}
