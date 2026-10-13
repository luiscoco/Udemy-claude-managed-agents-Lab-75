import type { Lab01Request } from '../../shared/lab01-events.js';
import type { StreamEvent } from './session-events.js';

/**
 * Authored offline streams. They are shaped like provider events but are not
 * measurements of Claude. `hang: true` means the stream stays open until aborted.
 */
export interface Fixture { events: StreamEvent[]; hang: boolean }
const at = '2026-01-01T00:00:00Z';
const running = (id: string): StreamEvent => ({ type: 'session.status_running', id, processed_at: at });
const idle = (id: string, reason: 'end_turn' | 'budget_reached' | 'requires_action'): StreamEvent => ({
  type: 'session.status_idle', id, processed_at: at, stop_details: null,
  stop_reason: reason === 'requires_action' ? { type: reason, event_ids: ['sevt_fixture_tool'] } : { type: reason } });
const start = (id: string): StreamEvent => ({ type: 'event_start', event: { type: 'agent.message', id } });
const delta = (eventId: string, text: string, index = 0): StreamEvent => ({
  type: 'event_delta', event_id: eventId, delta: { type: 'content_delta', index, content: { type: 'text', text } } });
const message = (id: string, text: string): StreamEvent => ({
  type: 'agent.message', id, processed_at: at, content: [{ type: 'text', text }] });
const spanStart = (id: string): StreamEvent => ({ type: 'span.model_request_start', id, processed_at: at });
const spanEnd = (id: string, startId: string): StreamEvent => ({
  type: 'span.model_request_end', id, processed_at: at, is_error: false, model_request_start_id: startId,
  model_usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } });

export const fixtureAnswer = '- A session is one running agent instance.\n- Events carry messages and status changes.\n- session.status_idle with end_turn means the turn finished.';
const parts = ['- A session is one running agent instance.\n', '- Events carry messages and status changes.\n', '- session.status_idle with end_turn means the turn finished.'];

export function fixtureFor(scenario: Lab01Request['scenario']): Fixture {
  switch (scenario) {
    case 'normal': return { hang: false, events: [running('sevt_run_1'), spanStart('sevt_span_1'), start('sevt_msg_1'),
      ...parts.map((part) => delta('sevt_msg_1', part)), message('sevt_msg_1', fixtureAnswer), spanEnd('sevt_span_2', 'sevt_span_1'), idle('sevt_idle_1', 'end_turn')] };
    case 'session-error': return { hang: false, events: [running('sevt_run_1'), spanStart('sevt_span_1'), start('sevt_msg_1'),
      delta('sevt_msg_1', parts[0]!), { type: 'session.error', id: 'sevt_err_1', processed_at: at,
        error: { type: 'unknown_error', message: 'Authored fixture failure.', retry_status: { type: 'terminal' } } }] };
    case 'stream-ended': return { hang: false, events: [running('sevt_run_1'), spanStart('sevt_span_1'), start('sevt_msg_1'), delta('sevt_msg_1', parts[0]!)] };
    case 'repeated-events': return { hang: false, events: [running('sevt_run_1'), running('sevt_run_1'),
      start('sevt_msg_1'), delta('sevt_msg_1', 'Same '), delta('sevt_msg_1', 'Same '), start('sevt_msg_1'),
      start('sevt_msg_2'), delta('sevt_msg_2', 'This preview never receives its message.'),
      message('sevt_msg_1', 'Same Same '), message('sevt_msg_1', 'Same Same '), idle('sevt_idle_1', 'end_turn')] };
    case 'requires-action': return { hang: false, events: [running('sevt_run_1'), idle('sevt_idle_1', 'requires_action')] };
    case 'budget-reached': return { hang: false, events: [running('sevt_run_1'), spanStart('sevt_span_1'), start('sevt_msg_1'),
      delta('sevt_msg_1', 'Partial answer'), message('sevt_msg_1', 'Partial answer'), idle('sevt_idle_1', 'budget_reached')] };
    case 'cancel': case 'deadline': return { hang: true, events: [running('sevt_run_1'), spanStart('sevt_span_1'), start('sevt_msg_1'), delta('sevt_msg_1', parts[0]!)] };
  }
}
