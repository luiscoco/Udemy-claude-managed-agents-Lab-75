import type { Evidence, EventInput, RunRequest } from '../../shared/contracts.js';

// SDK types belong behind this Node-only boundary. A future live implementation
// must normalize messages here and sanitize raw evidence before exposing it.
export interface QueryPort {
  execute(input: RunRequest, signal: AbortSignal, emit: (event: EventInput) => void,
    inspect: (evidence: Evidence) => void): Promise<string>;
}
