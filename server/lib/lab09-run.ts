import { lab09RequestSchema, lab09ResultSchema } from '../../shared/lab09-system-prompts.js';
import type { Lab09Request } from '../../shared/lab09-system-prompts.js';
import type { Lab01Frame } from '../../shared/lab01-events.js';
import type { Lab09Port } from './lab09-port.js';
import type { Lab01Port } from './lab01-port.js';
import { runLab01 } from './lab01-run.js';

export async function runLab09(input: Lab09Request, port: Lab09Port, signal: AbortSignal, emit: (frame: Lab01Frame) => void, cleanupWaitMs = 10_000) {
  const requested = lab09RequestSchema.parse(input); const usage = { scope: 'model-request spans from this stream' as const, requests: 0,
    inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 }; const seen = new Set<string>();
  const tracked: Lab01Port = { ...port, async open(id, upstream) { const events = await port.open(id, upstream); return (async function* () {
    for await (const event of events) { if (port.source === 'managed-api' && event.type === 'span.model_request_end' && !seen.has(event.id)) {
      seen.add(event.id); usage.requests++; usage.inputTokens += event.model_usage.input_tokens; usage.outputTokens += event.model_usage.output_tokens;
      usage.cacheCreationTokens += event.model_usage.cache_creation_input_tokens; usage.cacheReadTokens += event.model_usage.cache_read_input_tokens; } yield event; }
  })(); } };
  const result = await runLab01({ mode: requested.mode, prompt: requested.prompt, port: tracked, signal, deadlineMs: requested.deadlineSeconds * 1000, cleanupWaitMs, emit });
  return lab09ResultSchema.parse({ ...result, requested, composition: port.composition, effective: port.effective, reportedUsage: usage.requests ? usage : null });
}
