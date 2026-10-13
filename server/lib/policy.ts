import type { RunRequest } from '../../shared/contracts.js';
import { apiError } from './errors.js';

export interface RunPolicy { maxSessions: number; maxConcurrent: number; ttlMs: number; deadlineMs: number;
  maxEvents: number; maxEvidence: number; maxModelTurns: number; budgetUsd: number }
export const scriptedPolicy: Readonly<RunPolicy> = Object.freeze({ maxSessions: 16, maxConcurrent: 2, ttlMs: 60_000, deadlineMs: 2_000,
  maxEvents: 16, maxEvidence: 8, maxModelTurns: 0, budgetUsd: 0 });
export function checkScriptedPolicy(input: RunRequest) {
  return input.mode === 'scripted' ? null : apiError('UNSUPPORTED_MODE', 'This scripted path does not support live execution.');
}
