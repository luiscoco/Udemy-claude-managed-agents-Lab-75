import { setTimeout as delay } from 'node:timers/promises';
import type { Lab02Request } from '../../shared/lab02-options.js';
import type { StreamEvent } from './session-events.js';

// Authored events, never recorded Claude performance or usage. Both preview modes share this answer.
export const optionsFixtureAnswer = 'Session options apply only to this dedicated session.\nThe authoritative message replaces its text preview.';
const at = '2026-01-01T00:00:00Z';
const running: StreamEvent = { type: 'session.status_running', id: 'run1', processed_at: at };
const preview: StreamEvent = { type: 'event_start', event: { type: 'agent.message', id: 'message1' } };
const delta = (text: string, index = 0): StreamEvent => ({ type: 'event_delta', event_id: 'message1',
  delta: { type: 'content_delta', index, content: { type: 'text', text } } });
const message = (text: string): StreamEvent => ({ type: 'agent.message', id: 'message1', processed_at: at,
  content: [{ type: 'text', text }] });
const idle = (reason: 'end_turn' | 'budget_reached' | 'requires_action'): StreamEvent => ({
  type: 'session.status_idle', id: 'idle1', processed_at: at, stop_details: null,
  stop_reason: reason === 'requires_action' ? { type: reason, event_ids: ['action1'] } : { type: reason } });

export function optionsFixture(input: Lab02Request): { events: StreamEvent[]; hang: boolean } {
  let events: StreamEvent[] = [running]; let hang = false;
  switch (input.scenario) {
    case 'normal': events.push(preview, delta('Session options apply only to this dedicated session.', 0),
      delta('The authoritative message replaces its text preview.', 1), message(optionsFixtureAnswer), idle('end_turn')); break;
    case 'budget-reached': events.push(preview, delta('Partial answer'), message('Partial answer'), idle('budget_reached')); break;
    case 'requires-action': events.push(idle('requires_action')); break;
    case 'session-error': events.push(preview, delta('Unfinished text'), { type: 'session.error', id: 'error1', processed_at: at,
      error: { type: 'unknown_error', message: 'Authored terminal session error.', retry_status: { type: 'terminal' } } }); break;
    case 'stream-ended': events.push(preview, delta('Unfinished text')); break;
    case 'deadline': case 'cancel': events.push(preview, delta('Still waiting')); hang = true; break;
    case 'repeated-events': events.push(running, preview, delta('Same '), delta('Same '), message('Same Same '), message('Same Same '), idle('end_turn')); break;
  }
  if (!input.previews) events = events.filter((event) => event.type !== 'event_start' && event.type !== 'event_delta');
  return { events, hang };
}
export async function* streamOptionsFixture(input: Lab02Request, signal: AbortSignal, stepMs: number) {
  const fixture = optionsFixture(input);
  for (const event of fixture.events) {
    if (stepMs > 0) await delay(stepMs, undefined, { signal });
    signal.throwIfAborted(); yield event;
  }
  if (fixture.hang) await delay(3_600_000, undefined, { signal });
}
