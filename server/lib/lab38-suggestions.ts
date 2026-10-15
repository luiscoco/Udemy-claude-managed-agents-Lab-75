import { randomUUID } from 'node:crypto';
import { lab38SnapshotSchema, lab38SuggestionSchema } from '../../shared/lab38-prompt-suggestions.js';
import type { Lab38Chat, Lab38Send } from '../../shared/lab38-prompt-suggestions.js';

export class Lab38Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Suggestion = ReturnType<typeof lab38SuggestionSchema.parse>;
type Entry = { owner: string; conversationId: string; scenario: Lab38Chat['scenario']; status: 'open' | 'closed';
  turn: number; responseVersion: number; response: string; enabled: boolean; suggestions: Suggestion[]; availableAt: number;
  draft: string; sentCount: number; staleRejected: boolean };
const text = 'What observation detail would you like to check next?';
export class Lab38Suggestions {
  private entries = new Map<string, Entry>(); private closed = false;
  constructor(private now = () => Date.now()) {}
  private get(owner: string, conversationId: string) { const entry = this.entries.get(conversationId);
    if (!entry || entry.owner !== owner) throw new Lab38Error(404, 'Unknown or unowned conversation.'); return entry; }
  private view(entry: Entry) { return lab38SnapshotSchema.parse({ source: 'authored-fixture', conversationId: entry.conversationId,
    scenario: entry.scenario, status: entry.status, turn: entry.turn, responseVersion: entry.responseVersion, response: entry.response,
    enabled: entry.enabled, suggestions: entry.suggestions, draft: entry.draft, sentCount: entry.sentCount, autoSendCount: 0,
    staleRejected: entry.staleRejected,
    answerUsage: { inputTokens: 0, outputTokens: 0, source: 'authored-fixture' },
    suggestionUsage: entry.suggestions.length ? { inputTokens: 0, outputTokens: 0, source: 'authored-fixture' } : null,
    providerCalls: 0, note: 'Suggestions are application-authored fixtures. Copying one changes only the draft; sending is a separate user action.' }); }
  chat(owner: string, input: Lab38Chat) {
    if (input.mode === 'live') throw new Lab38Error(422, 'Live suggestion generation needs a separately budgeted Managed session.');
    if (this.closed || this.entries.size >= 20) throw new Lab38Error(429, 'Suggestion capacity reached.');
    const entry: Entry = { owner, conversationId: randomUUID(), scenario: input.scenario, status: 'open', turn: 1,
      responseVersion: 1, response: 'A fictional Aurora Finch note can include time, location and observed behavior.',
      enabled: input.scenario !== 'disabled', suggestions: [], availableAt: this.now() + (input.scenario === 'delayed' ? 1200 : 0),
      draft: '', sentCount: 1, staleRejected: false };
    this.entries.set(entry.conversationId, entry); return this.view(entry);
  }
  when(owner: string, conversationId: string) {
    const entry = this.get(owner, conversationId);
    if (entry.status !== 'open' || !entry.enabled || entry.scenario === 'suppressed' || this.now() < entry.availableAt) return this.view(entry);
    if (entry.suggestions.some(item => item.turn !== entry.turn || item.responseVersion !== entry.responseVersion)) {
      entry.suggestions = []; entry.staleRejected = true; return this.view(entry);
    }
    if (!entry.suggestions.length) entry.suggestions = [lab38SuggestionSchema.parse({ id: randomUUID(), text,
      conversationId: entry.conversationId, turn: entry.turn, responseVersion: entry.responseVersion })];
    return this.view(entry);
  }
  send(owner: string, input: Lab38Send) {
    const entry = this.get(owner, input.conversationId);
    if (entry.status !== 'open') throw new Lab38Error(409, 'Conversation is closed.');
    if (input.expectedTurn !== entry.turn || input.expectedResponseVersion !== entry.responseVersion)
      throw new Lab38Error(409, 'Stale turn or response version; no user message sent.');
    if (input.suggestionId) { const suggestion = entry.suggestions.find(item => item.id === input.suggestionId);
      if (!suggestion || suggestion.turn !== entry.turn || suggestion.responseVersion !== entry.responseVersion || suggestion.text !== input.text)
        throw new Lab38Error(409, 'Stale or mismatched suggestion; no user message sent.'); }
    entry.sentCount++; entry.turn++; entry.responseVersion++;
    entry.response = `Fictional follow-up response to: ${input.text}`;
    entry.draft = ''; if (entry.scenario !== 'stale') entry.suggestions = [];
    entry.availableAt = this.now() + (entry.scenario === 'delayed' ? 1200 : 0);
    return this.view(entry);
  }
  switches(owner: string, conversationId: string, enabled: boolean) { const entry = this.get(owner, conversationId);
    if (entry.status !== 'open') throw new Lab38Error(409, 'Conversation is closed.');
    entry.enabled = enabled; if (!enabled) entry.suggestions = []; return this.view(entry); }
  inspect(owner: string, conversationId: string) { return this.view(this.get(owner, conversationId)); }
  end(owner: string, conversationId: string) { const entry = this.get(owner, conversationId); entry.status = 'closed';
    entry.suggestions = []; return this.view(entry); }
  close() { this.closed = true; this.entries.clear(); }
}
