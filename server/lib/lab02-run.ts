import { lab02RequestSchema, lab02ResultSchema } from '../../shared/lab02-options.js';
import type { Lab02Request } from '../../shared/lab02-options.js';
import type { Lab01Frame } from '../../shared/lab01-events.js';
import type { Lab02Port } from './lab02-port.js';
import { runLab01 } from './lab01-run.js';

export async function runLab02(input: Lab02Request, port: Lab02Port, signal: AbortSignal,
  emit: (frame: Lab01Frame) => void, cleanupWaitMs = 10_000) {
  const requested = lab02RequestSchema.parse(input);
  const usage = { scope: 'model-request spans from this stream' as const, requests: 0,
    inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
  const seen = new Set<string>();
  const tracked: Lab02Port = { ...port, async open(id, upstream) {
    const stream = await port.open(id, upstream);
    return (async function* () { for await (const event of stream) {
      if (port.source === 'managed-api' && event.type === 'span.model_request_end' && !seen.has(event.id)) {
        seen.add(event.id); usage.requests++;
        usage.inputTokens += event.model_usage.input_tokens; usage.outputTokens += event.model_usage.output_tokens;
        usage.cacheCreationTokens += event.model_usage.cache_creation_input_tokens;
        usage.cacheReadTokens += event.model_usage.cache_read_input_tokens;
      }
      yield event;
    } })();
  } };
  try {
    const result = await runLab01({ mode: requested.mode, prompt: requested.prompt, port: tracked, signal,
      deadlineMs: requested.deadlineSeconds * 1000, cleanupWaitMs,
      emit: (frame) => emit(frame.kind === 'notice' && frame.text.startsWith('Event stream established')
        ? { ...frame, text: `Event stream established; text previews ${requested.previews ? 'enabled' : 'disabled'}. Sending user.message next.` } : frame) });
    return lab02ResultSchema.parse({ ...result, requested, effective: port.effective,
      reportedUsage: usage.requests ? usage : null });
  } finally { port.closeStream(); }
}
