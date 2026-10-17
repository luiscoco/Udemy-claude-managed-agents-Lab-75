import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { Router, json, type Request, type Response } from 'express';
import { z } from 'zod';
import { lab69PatchSchema, lab69RunSchema, type Lab69Context, type Lab69Patch } from '../../shared/lab69-embedding-sdk.js';
import { checkedPatch, documentHash, documentSnapshot } from '../lib/lab69-host.js';
import { managedSettings } from '../lib/managed-config.js';
import { createLiveLab01Port } from '../lib/lab01-port.js';
import { runLab01 } from '../lib/lab01-run.js';
import { apiError } from '../lib/errors.js';

type Run = { id: string; owner: string; correlationId: string; context: Lab69Context; source: 'authored-fixture' | 'managed-api';
  state: 'running' | 'completed' | 'cancelled' | 'error'; events: { seq: number; type: string; text: string }[];
  patch: Lab69Patch | null; sessionId: string | null; cleanup: string; controller: AbortController; work?: Promise<void> };
export class Lab69Backend {
  private readonly runs = new Map<string, Run>(); private readonly documents = new Map<string, Lab69Context>(); private closing = false;
  document(owner: string) { let document = this.documents.get(owner); if (!document) {
    if (this.documents.size >= 30) throw new Error('Document capacity reached.');
    document = documentSnapshot(randomUUID(), 1, '# Field observation\n\nThree Aurora Finches observed offline.\n'); this.documents.set(owner, document); }
    return { ...document };
  }
  change(owner: string) { const current = this.document(owner);
    const document = documentSnapshot(current.documentId, current.version + 1, `${current.text}\nLocal document edit.\n`);
    this.documents.set(owner, document); return document; }
  private owned(owner: string, id: string) { const run = this.runs.get(id); if (!run || run.owner !== owner) throw new Error('Run not found.'); return run; }
  snapshot(owner: string, id: string) { const run = this.owned(owner, id); return { id: run.id, correlationId: run.correlationId,
    state: run.state, source: run.source, events: [...run.events], patch: run.patch, sessionId: run.sessionId, cleanup: run.cleanup }; }
  correlation(owner: string, correlationId: string) { const run = [...this.runs.values()].find(item => item.owner === owner && item.correlationId === correlationId);
    if (!run) throw new Error('Run not found.'); return this.snapshot(owner, run.id); }
  start(owner: string, input: unknown) { const request = lab69RunSchema.parse(input);
    if (documentHash(request.context.text) !== request.context.hash) throw new Error('Explicit context hash mismatch.');
    const old = [...this.runs.values()].find(run => run.owner === owner && run.correlationId === request.correlationId);
    if (old) { if (old.context.documentId !== request.context.documentId || old.context.version !== request.context.version ||
      old.context.hash !== request.context.hash || old.source !== (request.mode === 'offline' ? 'authored-fixture' : 'managed-api'))
      throw new Error('Reused correlation has different context.'); return this.snapshot(owner, old.id); }
    if (request.mode === 'live' && (request.scenario !== 'normal' || !managedSettings().liveReady)) throw new Error('Live setup unavailable or scenario unsupported.');
    if (this.closing || this.runs.size >= 30 || [...this.runs.values()].some(run => run.owner === owner && run.state === 'running') ||
      [...this.runs.values()].filter(run => run.state === 'running').length >= 2) throw new Error('Active run capacity reached.');
    const run: Run = { id: randomUUID(), owner, correlationId: request.correlationId, context: request.context,
      source: request.mode === 'offline' ? 'authored-fixture' : 'managed-api', state: 'running', events: [], patch: null,
      sessionId: null, cleanup: 'pending', controller: new AbortController() }; this.runs.set(run.id, run);
    const emit = (type: string, text: string) => { if (run.events.length < 40) run.events.push({ seq: run.events.length + 1, type, text: text.slice(0, 2000) }); };
    const deadline = setTimeout(() => run.controller.abort('deadline'), request.mode === 'offline' ? 3000 : 35000); deadline.unref();
    run.work = (async () => { try {
      emit('start', 'Trusted host supplied explicit document text, version and hash.');
      if (request.mode === 'offline') {
        await delay(100, undefined, { signal: run.controller.signal }); emit('preview', 'Reviewing the explicit fictional observation context.');
        if (request.scenario === 'transport-failure') throw new Error('Authored transport failure.');
        await delay(request.scenario === 'hang' ? 30000 : 120, undefined, { signal: run.controller.signal });
        run.patch = lab69PatchSchema.parse({ correlationId: request.correlationId, documentId: request.context.documentId,
          baseVersion: request.context.version, baseHash: request.context.hash,
          replacement: `${request.context.text}\nReviewed observation: three fictional Aurora Finches; location and time remain unknown.\n` });
        run.cleanup = 'local-fixture-closed'; run.state = 'completed'; emit('final', 'Patch proposed only; the local document is unchanged.');
      } else {
        const prompt = `Return only one JSON object with correlationId, documentId, baseVersion, baseHash, replacement. Improve clarity of this fictional observation without inventing facts. Keep identifiers exactly as given.\n${JSON.stringify({ correlationId: request.correlationId,
          documentId: request.context.documentId, baseVersion: request.context.version, baseHash: request.context.hash, text: request.context.text })}`;
        const result = await runLab01({ mode: 'live', prompt, port: createLiveLab01Port(), signal: run.controller.signal,
          deadlineMs: 25000, cleanupWaitMs: 5000, emit: frame => { if (frame.kind === 'preview') emit('preview', frame.text); } });
        run.sessionId = result.sessionId; run.cleanup = result.cleanup;
        if (result.outcome.kind !== 'completed') throw new Error('Managed turn did not complete.');
        const text = result.messages.at(-1)?.text ?? ''; run.patch = lab69PatchSchema.parse(JSON.parse(text));
        checkedPatch(request.context, request.context, run.patch, request.correlationId, true);
        run.state = 'completed'; emit('final', 'Host validated the final patch; no local document change yet.');
      }
    } catch { run.state = run.controller.signal.aborted ? 'cancelled' : 'error';
      if (request.mode === 'offline') run.cleanup = 'local-fixture-closed';
      emit('outcome', run.state === 'cancelled' ? 'Local cancellation requested; inspect cleanup separately.' : 'Transport or patch validation failed.');
    } finally { clearTimeout(deadline); } })();
    return this.snapshot(owner, run.id);
  }
  cancel(owner: string, id: string) { const run = this.owned(owner, id); if (run.state === 'running') run.controller.abort('user'); return this.snapshot(owner, id); }
  async settle(owner: string, id: string) { await this.owned(owner, id).work; return this.snapshot(owner, id); }
  apply(owner: string, id: string) { const run = this.owned(owner, id); if (run.state !== 'completed' || !run.patch) throw new Error('No final patch available.');
    const current = this.document(owner); const patch = checkedPatch(run.context, current, run.patch, run.correlationId, true);
    const next = documentSnapshot(current.documentId, current.version + 1, patch.replacement); this.documents.set(owner, next);
    run.patch = null; return next; }
  async close() { this.closing = true; for (const run of this.runs.values()) run.controller.abort('shutdown');
    await Promise.allSettled([...this.runs.values()].map(run => run.work)); }
}
export function createLab69Router(store = new Lab69Backend()) {
  const router = Router(); router.use(json({ strict: true, limit: '16kb' }));
  router.use((request, response, next) => { const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) { response.status(403).json(apiError('INVALID_REQUEST', 'Local trusted host owner required.')); return; }
    response.set('Cache-Control', 'no-store'); next(); });
  const owner = (request: Request) => request.headers['x-lab-owner'] as string;
  const reply = (response: Response, action: () => unknown, status = 200) => { try { response.status(status).json(action()); }
    catch (error) { const message = error instanceof Error && /capacity|not found|hash|conflict|patch|Live|context/.test(error.message) ? error.message : 'Host operation rejected.';
      response.status(/not found/.test(message) ? 404 : 409).json(apiError('CONFLICT', message)); } };
  router.get('/facts', (_request, response) => response.json({ source: 'explicit-host-context', liveReady: managedSettings().liveReady,
    note: 'The browser simulation does not prove VS Code extension execution. Keys stay in the Node backend.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab69-embedding-sdk.ts', 'server/lib/lab69-host.ts',
    'server/concepts/69-embedding-sdk.ts'], extension: 'extensions/lab69', note: 'Run the extension build and launch instructions in the guide.' }));
  router.get('/document', (request, response) => reply(response, () => store.document(owner(request))));
  router.post('/document/change', (request, response) => reply(response, () => { z.strictObject({}).parse(request.body); return store.change(owner(request)); }));
  router.post('/document/apply', (request, response) => reply(response, () => store.apply(owner(request), z.strictObject({ runId: z.string().uuid() }).parse(request.body).runId)));
  router.post('/runs', (request, response) => reply(response, () => store.start(owner(request), request.body), 202));
  router.get('/correlations/:id', (request, response) => reply(response, () => store.correlation(owner(request), request.params.id as string)));
  router.get('/runs/:id', (request, response) => reply(response, () => store.snapshot(owner(request), request.params.id as string)));
  router.post('/runs/:id/cancel', (request, response) => reply(response, () => { z.strictObject({}).parse(request.body); return store.cancel(owner(request), request.params.id as string); }));
  return { router, close: () => store.close() };
}
