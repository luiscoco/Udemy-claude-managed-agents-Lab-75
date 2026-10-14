import { randomUUID } from 'node:crypto';
import type { Lab06HistoryEvent } from '../../shared/lab06-sessions.js';

export interface ConversationEntry {
  conversationId: string; owner: string; sessionId: string; archived: boolean; turnCount: number;
  history: Lab06HistoryEvent[]; seen: Set<string>; expiresAt: number;
}
export class Lab06ConversationStore {
  private readonly entries = new Map<string, ConversationEntry>();
  constructor(private readonly ttlMs = 30 * 60_000, private readonly now = () => Date.now()) {}
  create(owner: string, sessionId: string) {
    const entry: ConversationEntry = { conversationId: randomUUID(), owner, sessionId, archived: false, turnCount: 0,
      history: [], seen: new Set(), expiresAt: this.now() + this.ttlMs };
    this.entries.set(entry.conversationId, entry); return entry;
  }
  read(id: string, owner: string) {
    const entry = this.entries.get(id);
    if (!entry) return { kind: 'missing' as const };
    if (entry.owner !== owner) return { kind: 'foreign' as const };
    if (entry.archived) return { kind: 'archived' as const, entry };
    if (entry.expiresAt <= this.now()) return { kind: 'expired' as const, entry };
    entry.expiresAt = this.now() + this.ttlMs; return { kind: 'ok' as const, entry };
  }
  merge(entry: ConversationEntry, events: readonly Lab06HistoryEvent[]) {
    let duplicates = 0;
    for (const event of events) { if (entry.seen.has(event.id)) { duplicates++; continue; } entry.seen.add(event.id); entry.history.push(event); }
    return duplicates;
  }
  all() { return [...this.entries.values()]; }
}

