import { setTimeout } from 'node:timers/promises';
import type { QueryPort } from './query-port.js';

export type FixtureWait = (ms: number, signal: AbortSignal) => Promise<void>;
export const fixtureWait: FixtureWait = async (ms, signal) => { await setTimeout(ms, undefined, { signal }); };
/** A lab supplies its authored script; navigation never invokes it. */
export function createScriptedAdapter(script: QueryPort['execute']): QueryPort {
  return { async execute(input, signal, emit, inspect) {
    signal.throwIfAborted();
    if (input.mode !== 'scripted') throw new Error('Unsupported mode');
    const output = await script(input, signal, emit, inspect);
    signal.throwIfAborted();
    return output;
  } };
}
