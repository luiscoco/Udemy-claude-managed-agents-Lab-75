import { createHash, randomUUID } from 'node:crypto';
import type { BetaManagedAgentsSpanModelUsage } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { lab46SnapshotSchema } from '../../shared/lab46-prompt-caching.js';
import type { Lab46Scenario } from '../../shared/lab46-prompt-caching.js';
import { normalizeLab15Usage } from './lab15-accounting.js';

export class Lab46Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
const handbook = 'Fictional field handbook v1: record species, count, time, place and weather. Use stable observation IDs.';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const empty = { inputTokens: null, outputTokens: null, cacheReadTokens: null, cacheCreationTokens: null };
function counters(usage: BetaManagedAgentsSpanModelUsage | null) {
  if (!usage) return { ...empty };
  const normalized = normalizeLab15Usage({ input_tokens: usage.input_tokens, output_tokens: usage.output_tokens,
    cache_read_input_tokens: usage.cache_read_input_tokens });
  return { inputTokens: normalized.inputTokens, outputTokens: normalized.outputTokens,
    cacheReadTokens: normalized.cacheReadTokens, cacheCreationTokens: usage.cache_creation_input_tokens };
}
function usage(input: number, output: number, read: number, create: number): BetaManagedAgentsSpanModelUsage {
  return { input_tokens: input, output_tokens: output, cache_read_input_tokens: read, cache_creation_input_tokens: create };
}
export class Lab46CacheObservations {
  private active = 0; private closed = false;
  facts() { return { source: 'installed-sdk-1.7.0', supported: ['span.model_request_end.model_usage.cache_read_input_tokens',
    'span.model_request_end.model_usage.cache_creation_input_tokens', 'session.usage.usage.cache_read_input_tokens',
    'session.usage.usage.cache_creation'], unsupportedSessionControls: ['cache_control', 'SYSTEM_PROMPT_DYNAMIC_BOUNDARY',
    'cache TTL switches', 'PreModelSwitch veto'], providerCalls: 0,
    note: 'Managed Agents owns internal model request composition. A host wire tap cannot reveal its internal Messages calls.' }; }
  anatomy() { return { handbook, stableHandbookHash: hash(handbook), dynamicSuffix: 'Fictional sighting question changes per turn.',
    source: 'host-only', controllableCacheBoundary: false, directMessagesSeparateApi: true, providerCalls: 0 }; }
  run(scenario: Lab46Scenario) {
    if (this.closed || this.active >= 4) throw new Lab46Error(429, 'Cache comparison capacity reached.');
    this.active++; try {
      const firstSession = `sesn_fixture_${randomUUID().slice(0, 8)}`;
      const fresh = scenario === 'changed-model' || scenario === 'changed-tools';
      const secondSession = fresh ? `sesn_fixture_${randomUUID().slice(0, 8)}` : firstSession;
      const suffixes: [string, string] = scenario === 'changed-prefix' ? ['Count three fictional finches.', 'Revised handbook: count four fictional finches.'] :
        ['Count three fictional finches.', scenario === 'reused-content' ? 'Count three fictional finches.' : 'Count four fictional finches.'];
      const firstContent = handbook + suffixes[0], secondContent = (scenario === 'changed-prefix' ? 'Fictional field handbook v2: changed opening rule.' : handbook) + suffixes[1];
      const firstUsage = scenario === 'missing-usage' ? null : scenario === 'short-input' ? usage(18, 8, 0, 0) : usage(460, 24, 0, 310);
      const secondUsage = scenario === 'missing-usage' ? null : scenario === 'short-input' ? usage(19, 9, 0, 0) :
        scenario === 'reused-content' ? usage(190, 25, 270, 0) : scenario === 'changed-prefix' ? usage(470, 25, 0, 330) :
          usage(475, 26, 0, 320);
      const first = { sessionId: firstSession, model: 'fictional-model-v1', toolsVersion: 'tools-v1', contentHash: hash(firstContent),
        turn: 1, via: firstUsage ? 'span.model_request_end' as const : 'missing' as const, scope: 'model-request' as const, counters: counters(firstUsage), listCostCents: null };
      const second = { sessionId: secondSession, model: scenario === 'changed-model' ? 'fictional-model-v2' : first.model,
        toolsVersion: scenario === 'changed-tools' ? 'tools-v2' : first.toolsVersion, contentHash: hash(secondContent),
        turn: fresh ? 1 : 2, via: secondUsage ? 'span.model_request_end' as const : 'missing' as const,
        scope: 'model-request' as const, counters: counters(secondUsage), listCostCents: null };
      const comparable = !fresh && firstUsage !== null && secondUsage !== null && first.scope === second.scope;
      const delta = comparable ? {
        inputTokens: second.counters.inputTokens! - first.counters.inputTokens!, outputTokens: second.counters.outputTokens! - first.counters.outputTokens!,
        cacheReadTokens: second.counters.cacheReadTokens! - first.counters.cacheReadTokens!,
        cacheCreationTokens: second.counters.cacheCreationTokens! - first.counters.cacheCreationTokens!,
      } : null;
      const uncertainty = fresh ? 'Fresh session/model/tools identity differs; token counters are shown side by side, not subtracted.' :
        !firstUsage ? 'Usage was not observed; cache behavior is unknown.' :
          'Authored counters illustrate observation only. No hit, minimum size, price or savings is guaranteed.';
      return lab46SnapshotSchema.parse({ source: 'authored-usage-fixture', scenario, handbook, dynamicSuffixes: suffixes,
        readings: [first, second], comparable, delta, uncertainty, savingsClaim: false, controllableCacheBoundary: false,
        providerCalls: 0, evidence: ['Two authored model-request usage records; not real billed savings.',
          fresh ? 'Fresh session identity for changed model/tools.' : 'Retained fixture session identity.',
          'Supported SDK counters normalized with the Lab 15 usage boundary.'] });
    } finally { this.active--; }
  }
  close() { this.closed = true; }
}
