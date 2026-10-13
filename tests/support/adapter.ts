import type { QueryPort } from '../../server/lib/query-port.js';
import { fixtureResponse } from './lesson.js';
import { createScriptedAdapter, fixtureWait } from '../../server/lib/scripted-adapter.js';
import type { FixtureWait } from '../../server/lib/scripted-adapter.js';

export function createTestAdapter(delayMs = 250, wait: FixtureWait = fixtureWait): QueryPort {
  return createScriptedAdapter(async (input, signal, emit, inspect) => {
    signal.throwIfAborted();
    if (input.mode !== 'scripted') throw new Error('Unsupported mode');
    await wait(input.scenario === 'slow-cancel' ? 3_000 : delayMs, signal);
    signal.throwIfAborted();
    emit({ type: 'tool-fixture', payload: { source: 'authored-fixture', tool: 'fixture.greeting', prompt: input.prompt } });
    const output = fixtureResponse(input.learnerName, input.prompt);
    inspect({ source: 'authored-fixture', raw: JSON.stringify({ fixture: 'test-run', input, output, modelCalls: 0 }) });
    if (input.scenario === 'stream-failure') throw new Error('Deliberate fixture stream failure');
    signal.throwIfAborted();
    emit({ type: 'output', payload: { text: output } });
    return output;
  });
}
