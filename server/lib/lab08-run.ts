import { lab08Agents, lab08FrameSchema, lab08ResultSchema } from '../../shared/lab08-subagents.js';
import type { Lab08Frame, Lab08ParsedRequest, Lab08Result } from '../../shared/lab08-subagents.js';
import type { Lab08Port } from './lab08-port.js';

export async function runLab08(input: Lab08ParsedRequest, port: Lab08Port, runId: string, signal: AbortSignal, onFrame: (frame: Lab08Frame) => void): Promise<Lab08Result> {
  let seq = 0; const states: Lab08Result['states'] = [];
  const emit = (kind: 'thread'|'effect'|'state', value: unknown) => { const raw = kind === 'thread' ? { seq: ++seq, kind, thread: value } : kind === 'effect' ? { seq: ++seq, kind, effect: value } : { seq: ++seq, kind, ...(value as object) };
    const frame = lab08FrameSchema.parse(raw); if (frame.kind === 'state' && !states.includes(frame.state)) states.push(frame.state); onFrame(frame); };
  try { const result = await port.execute(input, signal, emit); return lab08ResultSchema.parse({ mode: input.mode, source: port.source, runId, requested: input, agents: lab08Agents,
      threads: result.threads, effects: result.effects, states, duplicatesIgnored: result.duplicatesIgnored, sessionId: result.sessionId, outcome: 'completed', interruption: result.interruption,
      message: 'Delegation, report receipt and independent host verification are recorded separately. Thread history is not filesystem isolation.' });
  } catch (error) { if (!signal.aborted) throw error; const confirmed = await port.interrupt().catch(() => false); return lab08ResultSchema.parse({ mode: input.mode, source: port.source, runId, requested: input, agents: lab08Agents,
      threads: [{ threadId: 'sthr_cancelled', role: 'parent', agentName: 'delegation-coordinator', status: 'stopped', history: [] }], effects: [], states, duplicatesIgnored: 0, sessionId: null,
      outcome: 'cancelled', interruption: port.source === 'authored-fixture' ? 'simulated' : confirmed ? 'confirmed' : 'unconfirmed', message: 'Child activity was stopped through the session interrupt boundary.' }); }
}
