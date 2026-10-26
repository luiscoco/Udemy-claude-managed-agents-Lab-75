import { randomUUID } from 'node:crypto';
import { Router, json, type Request, type Response } from 'express';
import { z } from 'zod';
import { lab70RequestSchema, type Lab70Frame } from '../../shared/lab70-python-sdk.js';
import { lab70ToolDefinition, pythonPin, runLab70Python, selectLab70Python, type PythonReply } from '../lib/lab70-python.js';
import { managedSettings } from '../lib/managed-config.js';
import { apiError } from '../lib/errors.js';

type Session = { handle: string; owner: string; remoteId: string; mode: 'offline' | 'live'; scenario: string;
  state: 'idle' | 'busy' | 'closed' | 'unknown' };
type Run = { id: string; owner: string; state: 'running' | 'completed' | 'cancelled' | 'error'; frames: Lab70Frame[];
  mode: 'offline' | 'live'; reply: PythonReply | null; controller: AbortController; work?: Promise<void>; sessionHandle: string | null };
export class Lab70Workshop {
  private readonly runs = new Map<string, Run>(); private readonly sessions = new Map<string, Session>();
  private capability: Extract<Lab70Frame, { type: 'readiness' }> | null = null; private probing = false; private closing = false;
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}
  facts() { const interpreter = selectLab70Python(this.env); const configured = managedSettings(this.env).liveReady;
    return { pythonPin, typescriptPin: '1.3.0', interpreterAvailable: Boolean(interpreter), isolated: true,
      capability: this.capability, liveReady: configured && Boolean(this.capability?.capable), toolDefinition: lab70ToolDefinition,
      note: 'Facts do not install packages or contact Anthropic. Check the selected isolated interpreter explicitly.' }; }
  async probe() { if (this.probing) throw new Error('Readiness probe already active.'); this.probing = true;
    try { const reply = await runLab70Python({ mode: 'readiness' }, { signal: new AbortController().signal, env: this.env });
      const frame = reply.frames.find((item): item is Extract<Lab70Frame, { type: 'readiness' }> => item.type === 'readiness');
      if (!frame || reply.protocolError) throw new Error(reply.protocolError ?? 'Python readiness failed.'); this.capability = frame; return this.facts();
    } finally { this.probing = false; } }
  private owned(owner: string, id: string) { const run = this.runs.get(id); if (!run || run.owner !== owner) throw new Error('Run not found.'); return run; }
  snapshot(owner: string, id: string) { const run = this.owned(owner, id); return { id, state: run.state, frames: [...run.frames],
    reply: run.reply, sessionHandle: run.sessionHandle, source: run.mode === 'live' ? 'managed-api' : 'offline-python-worker' }; }
  sessionList(owner: string) { return [...this.sessions.values()].filter(session => session.owner === owner)
    .map(({ owner: _owner, ...session }) => session); }
  start(owner: string, input: unknown) { const request = lab70RequestSchema.parse(input);
    if (this.closing || this.runs.size >= 30 || [...this.runs.values()].some(run => run.owner === owner && run.state === 'running') ||
      [...this.runs.values()].filter(run => run.state === 'running').length >= 2) throw new Error('Python worker capacity reached.');
    if (request.mode === 'live' && (!this.facts().liveReady || !['normal', 'custom-tool'].includes(request.scenario)))
      throw new Error('Live Python setup unavailable or scenario unsupported.');
    if (request.operation === 'retained-start' && ([...this.sessions.values()].some(item => item.owner === owner && item.state !== 'closed') ||
      [...this.sessions.values()].filter(item => item.state !== 'closed').length >= 4)) throw new Error('Retained Python session capacity reached; close the existing handle.');
    const retainedOperation = request.operation === 'retained-turn' || request.operation === 'close';
    const session = request.sessionHandle ? this.sessions.get(request.sessionHandle) : undefined;
    if (retainedOperation && (!session || session.owner !== owner || session.state !== 'idle' || session.mode !== request.mode))
      throw new Error('Owned confirmed-idle session handle required.');
    if (!retainedOperation && request.sessionHandle) throw new Error('New sessions do not accept a retained handle.');
    if (session) session.state = 'busy';
    const run: Run = { id: randomUUID(), owner, mode: request.mode, state: 'running', frames: [], reply: null, controller: new AbortController(),
      sessionHandle: session?.handle ?? null }; this.runs.set(run.id, run);
    run.work = (async () => { try {
      if (request.scenario === 'missing-python') throw new Error('Simulated missing Python interpreter.');
      const reply = await runLab70Python({ mode: request.mode, operation: request.operation,
        scenario: session?.scenario ?? request.scenario, prompt: request.prompt,
        ...(session ? { session_id: session.remoteId } : {}) }, { signal: run.controller.signal, env: this.env,
        emit: frame => run.frames.push(frame) });
      run.reply = reply; const result = reply.frames.find((frame): frame is Extract<Lab70Frame, { type: 'result' }> => frame.type === 'result');
      run.state = reply.protocolError || !result ? 'error' : result.outcome;
      if (result?.retained && result.session_id && result.cleanup === 'confirmed-idle-retained') {
        const handle = session?.handle ?? randomUUID(); this.sessions.set(handle, { handle, owner, remoteId: result.session_id,
          mode: request.mode, scenario: session?.scenario ?? request.scenario, state: 'idle' }); run.sessionHandle = handle;
      } else if (session) session.state = result && ['archived', 'simulated-archive'].includes(result.cleanup) ? 'closed' : 'unknown';
    } catch (error) { run.state = 'error'; if (session) session.state = 'unknown';
      run.reply = { frames: [...run.frames], stderrBytes: 0, stderrTruncated: false, stderrPreview: '', killed: false,
        protocolError: error instanceof Error && /Python|interpreter|Simulated/.test(error.message) ? error.message : 'Python bridge failed.' }; }
    })(); return this.snapshot(owner, run.id);
  }
  cancel(owner: string, id: string) { const run = this.owned(owner, id); if (run.state === 'running') run.controller.abort('user'); return this.snapshot(owner, id); }
  async settle(owner: string, id: string) { await this.owned(owner, id).work; return this.snapshot(owner, id); }
  async close() { this.closing = true; for (const run of this.runs.values()) run.controller.abort('shutdown');
    await Promise.allSettled([...this.runs.values()].map(run => run.work));
    const idle = [...this.sessions.values()].filter(session => session.state === 'idle');
    for (let index = 0; index < idle.length; index += 2) {
      await Promise.allSettled(idle.slice(index, index + 2).map(async session => {
        try { const reply = await runLab70Python({ mode: session.mode, operation: 'close', scenario: session.scenario,
            prompt: 'Close idle session.', session_id: session.remoteId }, { signal: new AbortController().signal, env: this.env, deadlineMs: 10000 });
          const result = reply.frames.find(frame => frame.type === 'result');
          session.state = result?.type === 'result' && ['archived', 'simulated-archive'].includes(result.cleanup) ? 'closed' : 'unknown';
        } catch { session.state = 'unknown'; }
      }));
    }
  }
}
export function createLab70Router(store = new Lab70Workshop()) {
  const router = Router(); router.use(json({ strict: true, limit: '2kb' }));
  router.use((request, response, next) => { const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) { response.status(403).json(apiError('INVALID_REQUEST', 'Local Python bridge owner required.')); return; }
    response.set('Cache-Control', 'no-store'); next(); });
  const owner = (request: Request) => request.headers['x-lab-owner'] as string;
  const reply = async (response: Response, action: () => unknown | Promise<unknown>, status = 200) => { try { response.status(status).json(await action()); }
    catch (error) { const message = error instanceof Error && /Python|interpreter|handle|capacity|not found|Readiness/.test(error.message) ? error.message : 'Closed Python bridge request rejected.';
      response.status(/not found/.test(message) ? 404 : 409).json(apiError('CONFLICT', message)); } };
  router.get('/facts', (_request, response) => response.json(store.facts()));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab70-python-sdk.ts', 'server/lib/lab70-python.ts',
    'server/concepts/70-python-sdk.ts', 'python/lab70/worker.py', 'python/lab70/requirements.txt'] }));
  router.post('/probe', (request, response) => void reply(response, () => { z.strictObject({}).parse(request.body); return store.probe(); }));
  router.get('/sessions', (request, response) => response.json(store.sessionList(owner(request))));
  router.post('/runs', (request, response) => void reply(response, () => store.start(owner(request), request.body), 202));
  router.get('/runs/:id', (request, response) => void reply(response, () => store.snapshot(owner(request), request.params.id as string)));
  router.post('/runs/:id/cancel', (request, response) => void reply(response, () => { z.strictObject({}).parse(request.body); return store.cancel(owner(request), request.params.id as string); }));
  return { router, close: () => store.close() };
}
