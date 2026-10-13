import type { BetaManagedAgentsStreamSessionEvents } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import type { Lab01Frame, Lab01Outcome } from '../../shared/lab01-events.js';

/** The one event type both the live adapter and the offline fixtures produce. */
export type StreamEvent = BetaManagedAgentsStreamSessionEvents;
export type FrameInput = Lab01Frame extends infer F ? F extends Lab01Frame ? Omit<F, 'seq'> : never : never;
export const maxEvents = 300;
const rawLimit = 4000;

type Preview = { blocks: Map<number, string>; state: 'streaming' | 'replaced' | 'incomplete' };
const joined = (blocks: Map<number, string>) => [...blocks.entries()].sort(([a], [b]) => a - b).map(([, text]) => text).join('\n');
const rawOf = (event: unknown) => JSON.stringify(event).slice(0, rawLimit);

/**
 * Pure event consumer. It never talks to a provider, so offline fixtures and live
 * streams go through exactly the same logic. It does not decide cancellation or
 * deadlines: the runner owns those and applies them to the outcome afterwards.
 */
export function createEventConsumer() {
  const seen = new Set<string>();
  const previews = new Map<string, Preview>();
  const messages: { eventId: string; text: string }[] = [];
  let outcome: Lab01Outcome | null = null;
  let eventCount = 0, duplicates = 0, lastError = '';

  function conclude(kind: Lab01Outcome['kind'], stopReason: string | null, detail: string) {
    outcome = { kind, stopReason, detail };
  }
  function pushEvent(event: StreamEvent): FrameInput[] {
    eventCount++;
    const raw = rawOf(event);
    if (event.type === 'event_start') {
      const id = event.event.id;
      if (event.event.type !== 'agent.message') return [{ kind: 'other', type: 'event_start (agent.thinking: start-only)', raw }];
      // A repeated start must not reset text that deltas have already accumulated.
      if (!previews.has(id)) previews.set(id, { blocks: new Map(), state: 'streaming' });
      return [{ kind: 'preview', eventId: id, text: joined(previews.get(id)!.blocks), raw }];
    }
    if (event.type === 'event_delta') {
      let preview = previews.get(event.event_id);
      if (!preview) { preview = { blocks: new Map(), state: 'streaming' }; previews.set(event.event_id, preview); }
      // Deltas carry no event ID of their own: never dedupe them, and ignore stragglers after replacement.
      if (preview.state !== 'streaming') return [{ kind: 'other', type: 'event_delta (ignored: preview already closed)', raw }];
      const index = event.delta.index ?? 0;
      preview.blocks.set(index, (preview.blocks.get(index) ?? '') + event.delta.content.text);
      return [{ kind: 'preview', eventId: event.event_id, text: joined(preview.blocks), raw }];
    }
    // Everything else is a persisted event with a top-level ID.
    if (seen.has(event.id)) { duplicates++; return [{ kind: 'duplicate', eventType: event.type, id: event.id }]; }
    seen.add(event.id);
    switch (event.type) {
      case 'agent.message': {
        const text = event.content.map((block) => block.type === 'text' ? block.text : '[redacted block]').join('\n');
        const preview = previews.get(event.id);
        if (preview) preview.state = 'replaced';
        messages.push({ eventId: event.id, text });
        return [{ kind: 'message', eventId: event.id, text, replacedPreview: Boolean(preview), raw }];
      }
      case 'span.model_request_start':
        return [{ kind: 'span', type: event.type, id: event.id, detail: '', raw }];
      case 'span.model_request_end':
        // An errored request produces no agent.message, so any open preview can no longer be reconciled.
        if (event.is_error) for (const preview of previews.values()) if (preview.state === 'streaming') preview.state = 'incomplete';
        return [{ kind: 'span', type: event.type, id: event.id, detail: event.is_error ? 'model request failed' : `output tokens: ${event.model_usage.output_tokens}`, raw }];
      case 'session.status_running': case 'session.status_rescheduled':
        return [{ kind: 'lifecycle', type: event.type, id: event.id, detail: '', raw }];
      case 'session.status_idle': {
        const reason = event.stop_reason.type;
        if (outcome) return [{ kind: 'lifecycle', type: event.type, id: event.id, detail: `stop_reason: ${reason} (outcome already decided)`, raw }];
        if (reason === 'end_turn') conclude('completed', reason, 'The agent finished its turn.');
        else if (reason === 'requires_action') conclude('paused', reason, 'The session is waiting for input that this lesson does not provide.');
        else if (reason === 'budget_reached') conclude('paused', reason, 'The session budget was reached; the turn did not finish.');
        else if (reason === 'retries_exhausted' || reason === 'refusal') conclude('error', reason, `The session stopped: ${reason}.`);
        else conclude('incomplete', String(reason), 'Unrecognised stop reason; treated as not completed.');
        return [{ kind: 'lifecycle', type: event.type, id: event.id, detail: `stop_reason: ${reason}`, raw }];
      }
      case 'session.error': {
        const retrying = event.error.retry_status?.type === 'retrying';
        lastError = `${event.error.type}: ${event.error.message}`.slice(0, 300);
        // A retrying error is not the end of the turn; a later idle or EOF decides it.
        if (!retrying && !outcome) conclude('error', event.error.type, lastError);
        return [{ kind: 'lifecycle', type: event.type, id: event.id, detail: lastError + (retrying ? ' (retrying)' : ''), raw }];
      }
      case 'session.status_terminated':
        if (!outcome) conclude('error', 'terminated', 'The session was terminated.');
        return [{ kind: 'lifecycle', type: event.type, id: event.id, detail: '', raw }];
      default:
        return [{ kind: 'other', type: event.type, raw }];
    }
  }
  return {
    push(event: StreamEvent) {
      if (eventCount >= maxEvents) {
        if (!outcome) conclude('error', 'event_limit', `More than ${maxEvents} events; the lesson stopped reading.`);
        return { frames: [] as FrameInput[], done: true };
      }
      const frames = pushEvent(event);
      return { frames, done: outcome !== null };
    },
    /** Called once consumption stops, whatever the reason. Open previews become incomplete. */
    finish(): Lab01Outcome {
      for (const preview of previews.values()) if (preview.state === 'streaming') preview.state = 'incomplete';
      if (!outcome) conclude('incomplete', null, `The stream ended before the turn completed.${lastError ? ` Last session.error: ${lastError}` : ''}`);
      return outcome!;
    },
    get outcome() { return outcome; },
    snapshot() {
      return { messages: [...messages], duplicatesIgnored: duplicates, eventCount,
        previews: [...previews.entries()].filter(([, p]) => p.state !== 'streaming')
          .map(([eventId, p]) => ({ eventId, text: joined(p.blocks), state: p.state as 'replaced' | 'incomplete' })) };
    },
  };
}
