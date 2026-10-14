import { lab11RequestSchema, lab11ResultSchema } from '../../shared/lab11-skills.js';
import type { Lab11Request, SkillRead } from '../../shared/lab11-skills.js';
import type { Lab03Frame } from '../../shared/lab03-tools.js';
import type { Lab11Port } from './lab11-port.js';
import { runToolSession } from './tool-session-run.js';
import { LabError } from './lab01-run.js';

/** Correlate exact read calls with results, never agent prose or a host preview. */
export async function runLab11(input: Lab11Request, port: Lab11Port, signal: AbortSignal, emit: (frame: Lab03Frame) => void, cleanupWaitMs = 10000) {
  const requested = lab11RequestSchema.parse(input); const reads = new Map<string, SkillRead>(), seen = new Set<string>(); let count = 0;
  const usage = { scope: 'model-request spans from this stream' as const, requests: 0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
  const tracked: Lab11Port = { ...port, async open(id, upstream) { const events = await port.open(id, upstream); return (async function* () {
    for await (const event of events) {
      if (++count > 300) throw new LabError('Lab 11 event bound reached.');
      if ('id' in event && !seen.has(event.id)) { seen.add(event.id);
        if (event.type === 'agent.tool_use' && event.name === 'read' && port.configured && port.bundle && !event.session_thread_id) {
          const path = event.input.file_path;
          if (typeof path === 'string' && path.length <= 500 && path.startsWith('/') && !path.includes('\\') && !path.split('/').some(p => p === '..' || p === '.') &&
            /\/(?:skills\/)(?:[^/]+\/)*format-observation\/(SKILL\.md|references\/format\.md)$/.test(path))
            reads.set(event.id, { useId: event.id, resultId: null, path, file: path.endsWith('/SKILL.md') ? 'instructions' : 'reference', state: 'attempted', contentMatchesBundle: null });
        }
        if (event.type === 'agent.tool_result') { const read = reads.get(event.tool_use_id); if (read) {
          read.resultId = event.id; read.state = event.is_error ? 'failed' : 'succeeded';
          const expected = port.bundle?.files.find(f => f.path === (read.file === 'instructions' ? 'SKILL.md' : 'references/format.md'));
          const text = (event.content ?? []).flatMap(b => b.type === 'text' ? [b.text] : []).join('\n').replace(/\r\n/g, '\n');
          read.contentMatchesBundle = read.state === 'succeeded' && expected ? text.includes(expected.text.trim()) : null;
        } }
        if (port.source === 'managed-api' && event.type === 'span.model_request_end') { usage.requests++;
          usage.inputTokens += event.model_usage.input_tokens; usage.outputTokens += event.model_usage.output_tokens;
          usage.cacheCreationTokens += event.model_usage.cache_creation_input_tokens; usage.cacheReadTokens += event.model_usage.cache_read_input_tokens; }
      } yield event;
    }
  })(); } };
  const result = await runToolSession({ mode: requested.mode, prompt: requested.prompt, port: tracked, signal,
    deadlineMs: requested.deadlineSeconds * 1000, cleanupWaitMs, maxConfirmations: 10, emit,
    answer: async calls => calls.map(call => ({ toolUseId: call.id, tool: call.use?.name ?? 'unknown', result: 'deny' as const,
      reason: 'Unexpected paused action: this lesson only enables read.', denyMessage: 'Lab 11 does not authorize this action.' })) });
  const { notes, ...core } = result;
  return lab11ResultSchema.parse({ ...core, mode: requested.mode, requested, message: notes.join(' ').slice(0, 800), configured: port.configured,
    resolvedSkills: port.resolvedSkills, reads: [...reads.values()], reportedUsage: usage.requests ? usage : null,
    evidenceNote: 'Metadata is configuration, not loading. Read evidence requires a matching tool call and result; success does not attest semantic compliance or the complete remote bundle. Missing events mean no observed read, not proof of no read.' });
}
