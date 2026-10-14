import { randomUUID } from 'node:crypto';
import { lab14RequestSchema, lab14ResultSchema } from '../../shared/lab14-models.js';
import type { Lab14Input, Lab14Result } from '../../shared/lab14-models.js';
import type { Lab01Frame } from '../../shared/lab01-events.js';
import { runLab01, LabError } from './lab01-run.js';
import { createLab14Port } from './lab14-port.js';
import type { Lab14Port } from './lab14-port.js';
import { managedSettings } from './managed-config.js';

type Entry = { owner: string; input: Lab14Input; report: Lab14Result; controller: AbortController; work?: Promise<Lab14Result>; ports: Lab14Port[]; touched: number };
export function createLab14Manager(factory = createLab14Port, env = process.env, cleanupWaitMs = 10_000) {
  const entries = new Map<string, Entry>(); let closing = false;
  function get(id: string, owner: string) { const entry = entries.get(id); if (!entry || entry.owner !== owner) throw new LabError('Unknown or unowned experiment.'); return entry; }
  function prepare(owner: string, raw: unknown) {
    const input = lab14RequestSchema.parse(raw), settings = managedSettings(env);
    if (input.deadlineSeconds * 1000 > settings.deadlineMs) throw new LabError('Deadline exceeds server policy.');
    for (const [id, entry] of entries) if (entry.report.state !== 'running' && entry.report.state !== 'pending' && Date.now() - entry.touched > 900_000) entries.delete(id);
    // A browser may cancel before receiving its local run ID. Reconciled work from
    // that same owner must not block the next explicit experiment indefinitely.
    for (const [id, entry] of entries) if (entry.owner === owner && entry.report.state === 'closed') entries.delete(id);
    if (closing || entries.size >= settings.maxConcurrent || [...entries.values()].some(entry => entry.owner === owner)) throw new LabError('Close the previous experiment or wait for available capacity.');
    // Constructing a port only validates setup. No provider calls occur until Send.
    const port = factory(input, undefined, env);
    if (input.fallback) factory({ ...input, configuration: input.fallback, fallback: null, scenario: 'normal' }, undefined, env);
    const runId = randomUUID();
    const report: Lab14Result = { runId, prompt: input.prompt, source: port.source, attempts: [], fallbackDecision: 'Not evaluated.', state: 'prepared', message: 'Configuration prepared locally. Sending starts a fresh session; no remote session exists yet.' };
    entries.set(runId, { owner, input, report, controller: new AbortController(), ports: [port], touched: Date.now() });
    return report;
  }
  async function send(id: string, owner: string, prompt: string, signal: AbortSignal, emit: (frame: Lab01Frame) => void) {
    const entry = get(id, owner);
    if (entry.report.state !== 'prepared') throw new LabError('Prepare a new configuration for a fresh session.');
    entry.report.state = 'running'; entry.input.prompt = prompt; entry.report.prompt = prompt; entry.touched = Date.now();
    const abort = () => entry.controller.abort(signal.reason);
    signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
    const work = (async () => {
      for (let index = 0; index < 2; index++) {
        if (index && entry.controller.signal.aborted) break;
        const configuration = index ? entry.input.fallback! : entry.input.configuration;
        const request = { ...entry.input, configuration, fallback: null, scenario: index ? 'normal' as const : entry.input.scenario };
        const port = index ? factory(request, undefined, env) : entry.ports[0]!;
        if (index) entry.ports.push(port);
        const usage = { scope: 'model-request spans from this stream' as const, requests: 0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
        const seen = new Set<string>();
        let publicMessages = 0, observedEvents = 0;
        const tracked: Lab14Port = { ...port, async open(sessionId, upstream) {
          const stream = await port.open(sessionId, upstream);
          return (async function* () { for await (const event of stream) {
            if (++observedEvents > 1000) throw new LabError('Observed event limit reached; reconciling this session.');
            if (port.source === 'managed-api' && event.type === 'span.model_request_end' && !seen.has(event.id)) {
              seen.add(event.id); usage.requests++;
              usage.inputTokens += event.model_usage.input_tokens; usage.outputTokens += event.model_usage.output_tokens;
              usage.cacheCreationTokens += event.model_usage.cache_creation_input_tokens; usage.cacheReadTokens += event.model_usage.cache_read_input_tokens;
            }
            // Private thinking is never included in UI evidence, even through injected ports.
            if (event.type === 'agent.message') {
              if (publicMessages++ >= 4) continue;
              const text = event.content.flatMap(block => block.type === 'text' ? [block.text] : []).join('\n').slice(0, 4000);
              yield { ...event, content: [{ type: 'text' as const, text }] };
            } else if (event.type !== 'agent.thinking' && event.type !== 'event_start' && event.type !== 'event_delta') yield event;
          } })();
        } };
        const start = performance.now();
        const result = await runLab01({ mode: entry.input.mode, prompt, port: tracked, signal: entry.controller.signal,
          deadlineMs: entry.input.deadlineSeconds * 1000, cleanupWaitMs, emit });
        // Bounded evidence fits one SSE result frame, including escaped Unicode.
        result.messages = result.messages.slice(0, 4).map(message => ({ ...message, text: message.text.slice(0, 4000) }));
        result.previews = [];
        entry.report.attempts.push({ attempt: index + 1, requested: configuration, resolved: port.snapshot, result,
          reportedUsage: usage.requests ? usage : null, elapsedMs: port.source === 'managed-api' ? Math.round(performance.now() - start) : null, creation: port.creation });
        const settled = result.cleanup === 'archived' || result.cleanup === 'simulated' || port.creation === 'rejected' || port.creation === 'not-started';
        entry.report.state = settled ? 'closed' : 'pending';
        if (index || !entry.input.fallback || result.outcome.kind !== 'error' || entry.controller.signal.aborted) {
          entry.report.fallbackDecision = index ? 'Host fallback ran in a separately identified fresh session.' : 'No fallback: not selected, primary did not fail, or local cancellation occurred.'; break;
        }
        if (!settled) { entry.report.fallbackDecision = 'Fallback blocked: earlier remote work or creation is uncertain. Reconcile it before another attempt.'; break; }
        // A resolved configuration mismatch is a safety failure, not model unavailability.
        if (port.snapshot && !port.snapshot.matches || port.creation === 'not-started') { entry.report.fallbackDecision = 'Fallback blocked: configuration verification failed or creation was not attempted.'; break; }
      }
      entry.report.message = entry.report.state === 'pending' ? 'Cleanup or creation is uncertain. Capacity remains reserved; inspect Claude Console.' : 'Experiment finished. Each attempt used a fresh session; offline timings and costs are not measurements.';
      return lab14ResultSchema.parse(entry.report);
    })();
    entry.work = work;
    try { return await work; }
    catch { entry.report.state = 'pending'; entry.report.message = 'Unexpected execution failure. Remote work must be reconciled before reuse.'; throw new LabError(entry.report.message); }
    finally { signal.removeEventListener('abort', abort); }
  }
  async function end(id: string, owner: string) {
    const entry = get(id, owner); entry.controller.abort('close');
    if (entry.work) { try { await entry.work; } catch { return entry.report; } }
    if (entry.report.state === 'pending') {
      for (const attempt of entry.report.attempts) {
        if (attempt.creation === 'uncertain' && !attempt.result.sessionId) return entry.report;
        if (attempt.result.cleanup !== 'pending' || !attempt.result.sessionId) continue;
        const port = entry.ports[attempt.attempt - 1]!;
        try { const status = await port.status(attempt.result.sessionId); if (status !== 'idle') return entry.report;
          await port.archive(attempt.result.sessionId); attempt.result.cleanup = port.source === 'managed-api' ? 'archived' : 'simulated';
        } catch { return entry.report; }
      }
    }
    entry.report.state = 'closed'; entry.report.message = 'Experiment closed; known remote sessions reconciled.'; entries.delete(id); return entry.report;
  }
  return { prepare, send, end, inspect: (id: string, owner: string) => get(id, owner).report,
    async newConfiguration(id: string, owner: string, input: unknown) {
      lab14RequestSchema.parse(input); // Invalid replacement cannot close the previous experiment.
      const report = await end(id, owner); if (report.state === 'pending') throw new LabError('Reconcile uncertain work before changing configuration.');
      return prepare(owner, input);
    }, async close() { closing = true; await Promise.allSettled([...entries].map(([id, entry]) => end(id, entry.owner))); },
  };
}
