import { spawn } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';
import { lab70FrameSchema, lab70ToolSchema, type Lab70Frame } from '../../shared/lab70-python-sdk.js';
import { managedResourceIds } from './managed-config.js';

export const pythonPin = '2.7.0';
export function selectLab70Python(env: NodeJS.ProcessEnv = process.env) {
  const candidates = [resolve('.venv/Scripts/python.exe'), resolve('.venv/bin/python'),
    'C:\\Python314\\python.exe', 'C:\\Python313\\python.exe', 'C:\\Python312\\python.exe', '/usr/bin/python3'];
  const requested = env.PYTHON_SDK_EXECUTABLE;
  if (requested) {
    if (!isAbsolute(requested) || !existsSync(requested)) return null;
    const actual = realpathSync(requested);
    return candidates.some(path => existsSync(path) && realpathSync(path) === actual) ? actual : null;
  }
  const found = candidates.find(path => existsSync(path)); return found ? realpathSync(found) : null;
}
const schema = (() => { const { $schema: _dialect, ...input } = z.toJSONSchema(lab70ToolSchema,
  { target: 'draft-2020-12', io: 'input' }); return input; })();
export const lab70ToolDefinition = { type: 'custom' as const, name: 'format_observation',
  description: 'Format a fictional bird observation without side effects.', input_schema: schema };
export type PythonRequest = { mode: 'offline' | 'live' | 'readiness'; operation?: string; scenario?: string;
  prompt?: string; session_id?: string; tool_schema?: unknown };
export type PythonReply = { frames: Lab70Frame[]; stderrBytes: number; stderrTruncated: boolean;
  stderrPreview: string; killed: boolean; protocolError: string | null };
export function runLab70Python(request: PythonRequest, options: { signal: AbortSignal; emit?: (frame: Lab70Frame) => void;
  env?: NodeJS.ProcessEnv; interpreter?: string | null; deadlineMs?: number }): Promise<PythonReply> {
  const env = options.env ?? process.env; const interpreter = options.interpreter === undefined ? selectLab70Python(env) : options.interpreter;
  if (!interpreter) return Promise.reject(new Error('No allowlisted Python interpreter. Create .venv or configure PYTHON_SDK_EXECUTABLE.'));
  const childEnv: NodeJS.ProcessEnv = {};
  for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) if (env[key]) childEnv[key] = env[key];
  if (request.mode === 'live') { const ids = managedResourceIds(env);
    childEnv.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY; childEnv.LAB70_AGENT_ID = ids.agentId; childEnv.LAB70_ENVIRONMENT_ID = ids.environmentId; }
  return new Promise((resolveReply, reject) => {
    const child = spawn(interpreter, ['-I', '-u', '-B', resolve('python/lab70/worker.py')],
      { cwd: process.cwd(), env: childEnv, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    const frames: Lab70Frame[] = []; const toolReplies = new Map<string, unknown>();
    let buffer = '', stdoutBytes = 0, stderrBytes = 0, stderr = Buffer.alloc(0), protocolError: string | null = null, killed = false, closed = false;
    let grace: ReturnType<typeof setTimeout> | undefined;
    const kill = () => { if (!closed) { killed = true; child.kill(); } };
    const fail = (message: string) => { protocolError ??= message; kill(); };
    const write = (value: unknown) => { if (!closed && child.stdin.writable) child.stdin.write(`${JSON.stringify(value)}\n`); };
    const cancel = () => { write({ type: 'cancel' }); if (!grace) grace = setTimeout(kill, request.mode === 'live' ? 10000 : 1500); };
    // Include isolated-interpreter startup in the bounded local budget. Cold
    // Windows startup can exceed five seconds even without a provider request.
    const deadline = setTimeout(cancel, options.deadlineMs ?? (request.mode === 'live' ? 45000 : 15000));
    options.signal.addEventListener('abort', cancel, { once: true });
    child.stdin.on('error', () => {}); child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => { stdoutBytes += Buffer.byteLength(chunk);
      if (stdoutBytes > 65536) { fail('Worker stdout exceeded 64 KiB.'); return; } buffer += chunk;
      if (buffer.length > 12000 && !buffer.includes('\n')) { fail('Worker line exceeded its bound.'); return; }
      for (;;) { const end = buffer.indexOf('\n'); if (end < 0) break; const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
        if (!line.trim()) continue;
        if (line.length > 12000 || frames.some(frame => frame.type === 'result' || frame.type === 'readiness')) { fail('Unexpected worker output after terminal frame.'); return; }
        let frame: Lab70Frame; try { frame = lab70FrameSchema.parse(JSON.parse(line)); } catch { fail('Malformed JSON-lines worker stdout.'); return; }
        if (frames.length >= 80) { fail('Worker frame bound exceeded.'); return; }
        frames.push(frame); options.emit?.(frame);
        if (frame.type === 'tool_use') {
          let result = toolReplies.get(frame.id);
          if (!result) { const parsed = frame.name === lab70ToolDefinition.name ? lab70ToolSchema.safeParse(frame.input) : null;
            const accepted = Boolean(parsed?.success) && toolReplies.size < 2;
            result = { type: 'user.custom_tool_result', custom_tool_use_id: frame.id, is_error: !accepted,
              content: [{ type: 'text', text: accepted && parsed?.success ? `${parsed.data.count} fictional ${parsed.data.species} birds observed offline.` : 'Closed host tool input rejected.' }] };
            toolReplies.set(frame.id, result);
          }
          write(result);
        }
      }
    });
    child.stderr.on('data', (chunk: string) => { const bytes = Buffer.from(chunk); stderrBytes += bytes.length;
      if (stderr.length < 4096) stderr = Buffer.concat([stderr, bytes.subarray(0, 4096 - stderr.length)]); });
    child.once('error', () => { closed = true; clearTimeout(deadline); if (grace) clearTimeout(grace);
      options.signal.removeEventListener('abort', cancel); reject(new Error('Selected Python executable could not start.')); });
    child.once('close', code => { if (closed) return; closed = true; clearTimeout(deadline); if (grace) clearTimeout(grace);
      options.signal.removeEventListener('abort', cancel);
      if (buffer.trim()) protocolError ??= 'Worker left an incomplete JSON line.';
      if (code !== 0 && !protocolError) protocolError = killed ? 'Worker terminated; remote stop is unconfirmed.' : 'Worker exited unsuccessfully.';
      if (!frames.some(frame => frame.type === 'result' || frame.type === 'readiness')) protocolError ??= 'Worker produced no terminal frame.';
      let preview = stderr.toString('utf8').slice(0, 300).replace(/(?:sk-ant-|sk-)[A-Za-z0-9_-]+|Bearer\s+\S+/g, '[REDACTED]');
      if (env.ANTHROPIC_API_KEY) preview = preview.replaceAll(env.ANTHROPIC_API_KEY, '[REDACTED]');
      resolveReply({ frames, stderrBytes, stderrTruncated: stderrBytes > 4096, stderrPreview: preview, killed, protocolError });
    });
    write({ ...request, ...(request.mode === 'readiness' ? {} : { tool_schema: schema }) });
    if (options.signal.aborted) cancel();
  });
}
