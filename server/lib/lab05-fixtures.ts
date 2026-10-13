import { setTimeout as delay } from 'node:timers/promises';
import { defaultChallengeInput } from '../../shared/lab05-custom-tools.js';
import type { Lab05ParsedRequest, Lab05Scenario } from '../../shared/lab05-custom-tools.js';
import type { CustomToolResult } from './tool-session-port.js';
import type { StreamEvent } from './session-events.js';

/**
 * Recorded agent.custom_tool_use sequences. Each inner array is one pause: its calls arrive together and the
 * session idles with all of their sevt_ IDs. The plan never adapts to results, so the runs show the host
 * contract, not Claude's choices.
 */
export interface RecordedCall { name: string; input: Record<string, unknown> }
export function lab05Plan(scenario: Lab05Scenario, challengeInput: Record<string, unknown> = defaultChallengeInput): readonly (readonly RecordedCall[])[] {
  const list = { name: 'list_tasks', input: {} };
  const add = { name: 'add_task', input: { title: 'Write the custom tools guide', priority: 'high' } };
  const complete = { name: 'complete_task', input: { id: 'task_3' } };
  switch (scenario) {
    case 'tour': return [[list], [add], [complete], [{ name: 'add_task', input: challengeInput }],
      // Two calls in one pause: each gets its own result, keyed by its own sevt_ ID.
      [{ name: 'complete_task', input: { id: 'task_99' } }, { name: 'complete_task', input: { id: 'task_3' } }],
      [{ name: 'list_tasks', input: { status: 'open' } }]];
    case 'valid-only': return [[list], [add], [complete], [{ name: 'list_tasks', input: { status: 'done' } }]];
    case 'slow-handler': return [[{ name: 'add_task', input: { title: 'Slow handler demo', priority: 'normal' } }], [list]];
    case 'hang': return [[list], [add]];
  }
}

const at = '2026-01-01T00:00:00Z';
const running = (id: string): StreamEvent => ({ type: 'session.status_running', id, processed_at: at });

/** One authored session: the stream waits for user.message, then pauses until every call in a pause is answered. */
export function createLab05Fixture(request: Pick<Lab05ParsedRequest, 'scenario' | 'challengeInput'>, stepMs = 80) {
  const plan = lab05Plan(request.scenario, request.challengeInput);
  let markSent!: () => void;
  const sent = new Promise<void>((resolve) => { markSent = resolve; });
  const issued = new Set<string>();
  const results = new Map<string, CustomToolResult>();
  const waiters = new Map<string, () => void>();
  function resultFor(id: string, signal: AbortSignal) {
    return new Promise<CustomToolResult>((resolve, reject) => {
      if (results.has(id)) { resolve(results.get(id)!); return; }
      const onAbort = () => { waiters.delete(id); reject(signal.reason); };
      signal.addEventListener('abort', onAbort, { once: true });
      waiters.set(id, () => { signal.removeEventListener('abort', onAbort); resolve(results.get(id)!); });
    });
  }
  async function* events(signal: AbortSignal): AsyncGenerator<StreamEvent> {
    const step = async () => { if (stepMs > 0) await delay(stepMs, undefined, { signal }); signal.throwIfAborted(); };
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => reject(signal.reason);
      signal.addEventListener('abort', onAbort, { once: true });
      void sent.then(() => { signal.removeEventListener('abort', onAbort); resolve(); });
    });
    await step(); yield running('sevt_run_0');
    const summary: string[] = [];
    let index = 0, pause = 0;
    for (const batch of plan) {
      pause++;
      const ids: string[] = [];
      for (const call of batch) {
        const id = `sevt_custom_${++index}`;
        ids.push(id); issued.add(id);
        await step();
        yield { type: 'agent.custom_tool_use', id, name: call.name, input: call.input, processed_at: at };
      }
      await step();
      yield { type: 'session.status_idle', id: `sevt_idle_${pause}`, processed_at: at, stop_details: null, stop_reason: { type: 'requires_action', event_ids: ids } };
      const answers = await Promise.all(ids.map((id) => resultFor(id, signal)));
      await step(); yield running(`sevt_run_${pause}`);
      for (const answer of answers) {
        // The stream echoes each result; custom tool results are processed on receipt.
        yield { type: 'user.custom_tool_result', id: `sevt_echo_${answer.customToolUseId}`, custom_tool_use_id: answer.customToolUseId,
          content: [{ type: 'text', text: answer.text }], is_error: answer.isError, processed_at: at };
        summary.push(`${answer.tool} ${answer.customToolUseId}: ${answer.isError ? 'error' : 'ok'}`);
      }
      if (request.scenario === 'hang') await delay(3_600_000, undefined, { signal });
    }
    await step();
    yield { type: 'agent.message', id: 'sevt_msg_1', processed_at: at,
      content: [{ type: 'text', text: `Authored fixture summary (not Claude output):\n- ${summary.join('\n- ')}` }] };
    await step();
    yield { type: 'session.status_idle', id: 'sevt_idle_end', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } };
  }
  return {
    events, markSent: () => markSent(), results,
    /** Mirrors the API: a result for an unknown ID, or a second result for one call, is refused. */
    respond(answers: readonly CustomToolResult[]) {
      for (const answer of answers) {
        if (!issued.has(answer.customToolUseId)) throw new Error(`No agent.custom_tool_use has the ID ${answer.customToolUseId}.`);
        if (results.has(answer.customToolUseId)) throw new Error(`${answer.customToolUseId} was already answered.`);
      }
      for (const answer of answers) { results.set(answer.customToolUseId, answer); waiters.get(answer.customToolUseId)?.(); waiters.delete(answer.customToolUseId); }
    },
  };
}
export type Lab05Fixture = ReturnType<typeof createLab05Fixture>;
