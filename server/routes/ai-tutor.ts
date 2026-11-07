import { Router, json, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tutorContext, tutorRequestSchema, preparedTutorAnswer, type TutorLesson, type TutorModel, type SavedTutorAnswer } from '../../shared/ai-tutor.js';
import { AiTutorStore } from '../lib/ai-tutor-store.js';
import { createTutorProvider, tutorMaxOutputTokens, type TutorProvider } from '../lib/ai-tutor-provider.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
type Pending = { owner: string; answer: Omit<SavedTutorAnswer, 'id' | 'savedAt'>; expires: number };
export function createAiTutorRouter(options: { lessons: readonly TutorLesson[]; env?: NodeJS.ProcessEnv;
  provider?: TutorProvider; storageDirectory?: string; sourceRoot?: string; deadlineMs?: number; now?: () => number }) {
  const env = options.env ?? process.env, lessons = new Map(options.lessons.map(lesson => [lesson.id, lesson]));
  const live = (env.AI_TUTOR_LIVE_ENABLED === undefined || env.AI_TUTOR_LIVE_ENABLED === 'true') && Boolean(env.ANTHROPIC_API_KEY?.trim());
  const now = options.now ?? Date.now, pending = new Map<string, Pending>(), calls: number[] = [];
  let active = 0, provider = options.provider;
  let catalog: { rows: TutorModel[]; until: number } | undefined, loading: Promise<TutorModel[]> | undefined;
  const getProvider = () => provider ??= createTutorProvider(env.ANTHROPIC_API_KEY!.trim());
  const ownerHash = (request: Request) => {
    const value = request.header('x-ai-tutor-owner'); return z.uuid().safeParse(value).success ? hash(value!) : null;
  };
  const find = (value: string) => /^([1-9]|[1-6]\d|7[0-5])$/.test(value) ? lessons.get(Number(value)) : undefined;
  async function context(lesson: TutorLesson) {
    const path = lesson.inspect.find(name => /^server\/[A-Za-z0-9/_-]+\.ts$/.test(name))
      ?? lesson.inspect.find(name => /^shared\/[A-Za-z0-9/_-]+\.ts$/.test(name));
    if (path) {
      try {
        const base = await realpath(options.sourceRoot ?? root), target = await realpath(resolve(base, path)), rel = relative(base, target);
        if (isAbsolute(rel) || rel.startsWith('..')) throw Error('Outside source root');
        const text = await readFile(target, 'utf8'), lines = text.split(/\r?\n/);
        const start = Math.max(0, lines.findIndex(line => /^export (?:async )?(?:function|class|const|type|interface)\b/.test(line)));
        const excerpt = lines.slice(start, start + 24).join('\n').slice(0, 1800);
        return tutorContext(lesson, { path, excerpt, sha256: hash(text) });
      } catch { /* Prepared guidance remains useful when a source file is unavailable. */ }
    }
    return tutorContext(lesson, null);
  }
  function withStore<T>(action: (store: AiTutorStore) => T): T {
    if (!options.storageDirectory) throw Error('Storage unavailable');
    const store = new AiTutorStore(options.storageDirectory);
    try { return action(store); } finally { store.close(); }
  }
  async function models() {
    if (catalog && catalog.until > now()) return catalog.rows;
    if (loading) return loading;
    loading = (async () => {
      const rows = await getProvider().models(AbortSignal.timeout(10000));
      if (rows.length > 1000 || rows.some(row => !/^claude-[a-z0-9-]{1,113}$/.test(row.id) || !row.name || row.name.length > 200)) throw Error('Invalid model catalog');
      const unique = [...new Map(rows.map(row => [row.id, row])).values()];
      catalog = { rows: unique, until: now() + 300000 }; return unique;
    })();
    try { return await loading; } finally { loading = undefined; }
  }
  const router = Router();
  router.use((request, response, next) => {
    const host = request.headers.host ?? '';
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}`) {
      response.status(403).json({ message: 'Use the local learning application for tutor requests.' }); return;
    }
    response.set('Cache-Control', 'no-store'); next();
  });
  router.use(json({ strict: true, limit: '12kb' }));
  router.get('/status', (_request, response) => response.json({ liveAvailable: live, savedAnswersAvailable: Boolean(options.storageDirectory),
    maxOutputTokens: tutorMaxOutputTokens, message: live ? 'Live answers use one paid Claude request after your consent.'
      : 'Prepared guidance is available. To enable live answers, configure ANTHROPIC_API_KEY and AI_TUTOR_LIVE_ENABLED=true on the server.' }));
  router.get('/models', async (_request, response) => {
    if (!live) { response.json({ models: [], available: false, message: 'Live Claude is not configured on this server.' }); return; }
    try { response.json({ models: await models(), available: true }); }
    catch { response.status(503).json({ message: 'Claude models could not be loaded. Check the server key and connection, then try again.' }); }
  });
  router.get('/:lesson/saved', async (request, response) => {
    const lesson = find(request.params.lesson), owner = ownerHash(request);
    if (!lesson) { response.status(404).json({ message: 'Lab not found.' }); return; }
    if (!owner) { response.status(400).json({ message: 'A browser saved-answer identifier is required.' }); return; }
    const digest = hash(JSON.stringify(await context(lesson)));
    try { response.json({ answers: withStore(store => store.list(owner, lesson.id)).map(answer => ({ ...answer, current: answer.contextHash === digest })) }); }
    catch { response.status(503).json({ message: 'Saved answers could not be loaded.' }); }
  });
  router.post('/:lesson/saved', async (request, response) => {
    const lesson = find(request.params.lesson), owner = ownerHash(request), parsed = z.strictObject({ pendingToken: z.uuid() }).safeParse(request.body);
    if (!lesson) { response.status(404).json({ message: 'Lab not found.' }); return; }
    if (!owner || !parsed.success) { response.status(400).json({ message: 'A completed answer token and browser identifier are required.' }); return; }
    const entry = pending.get(parsed.data.pendingToken);
    if (!entry || entry.owner !== owner || entry.answer.lesson !== lesson.id || entry.expires <= now()) {
      response.status(404).json({ message: 'This unsaved answer is no longer available to save. You can still copy its text into your notes.' }); return;
    }
    const digest = hash(JSON.stringify(await context(lesson)));
    // Another save may have consumed the token while source context was read.
    if (pending.get(parsed.data.pendingToken) !== entry) { response.status(404).json({ message: 'This answer was already saved. Reopen it in the saved list.' }); return; }
    try {
      const saved = withStore(store => store.save(owner, entry.answer));
      if (!saved) { response.status(409).json({ message: 'This lab has 100 saved answers. Remove one before saving another.' }); return; }
      pending.delete(parsed.data.pendingToken); response.status(201).json({ answer: { ...saved, current: saved.contextHash === digest } });
    } catch { response.status(503).json({ message: 'The answer could not be saved. Its text remains available to copy.' }); }
  });
  router.delete('/:lesson/saved/:answerId', (request, response) => {
    const lesson = find(request.params.lesson), owner = ownerHash(request), id = request.params.answerId;
    if (!lesson) { response.status(404).json({ message: 'Lab not found.' }); return; }
    if (!owner || !z.uuid().safeParse(id).success) { response.status(400).json({ message: 'A saved answer and browser identifier are required.' }); return; }
    try {
      if (!withStore(store => store.delete(owner, lesson.id, id))) { response.status(404).json({ message: 'Saved answer not found.' }); return; }
      response.status(204).end();
    } catch { response.status(503).json({ message: 'The saved answer could not be removed.' }); }
  });
  router.post('/:lesson', async (request, response) => {
    const lesson = find(request.params.lesson), parsed = tutorRequestSchema.safeParse(request.body);
    if (!lesson) { response.status(404).json({ message: 'Lab not found.' }); return; }
    if (!parsed.success) { response.status(400).json({ message: 'Choose a valid tutor question and answer mode.' }); return; }
    const body = parsed.data;
    if (body.mode === 'prepared') {
      response.json({ mode: 'prepared', answer: preparedTutorAnswer(await context(lesson), body.intent), modelCalls: 0,
        note: 'Prepared lesson guidance follows the selected topic. Choose Live Claude for a tailored answer to your exact question.' }); return;
    }
    if (!live || !body.consent) { response.status(403).json({ message: 'Live Claude needs a configured server key and fresh consent for this paid question.' }); return; }
    if (active >= 2) { response.status(429).json({ message: 'The tutor is busy. Wait for a current question to finish.' }); return; }
    while (calls.length && calls[0]! <= now() - 60000) calls.shift();
    if (calls.length >= 12) { response.status(429).json({ message: 'The tutor request limit was reached. Wait a minute before asking again.' }); return; }
    // Reserve before the model-catalog lookup, so concurrent admission is bounded.
    active++; calls.push(now());
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), options.deadlineMs ?? 45000);
    const closed = () => { if (!response.writableEnded) controller.abort(); };
    request.once('aborted', closed); response.once('close', closed);
    try {
      const selected = (await models()).find(model => model.id === body.model);
      if (!selected) { response.status(400).json({ message: 'Select a currently available Claude model.' }); return; }
      const material = await context(lesson);
      if (controller.signal.aborted) throw Error('Aborted');
      const result = await getProvider().answer({ model: selected.id, context: JSON.stringify(material), question: body.question,
        intent: body.intent, signal: controller.signal });
      if (controller.signal.aborted) throw Error('Aborted');
      if (!['end_turn', 'max_tokens'].includes(result.stopReason ?? '') || !result.answer.trim() || result.answer.length > 32000) {
        response.status(502).json({ message: 'Claude returned no usable tutor answer. No automatic retry was made.' }); return;
      }
      const incomplete = result.stopReason === 'max_tokens';
      let pendingToken: string | undefined; const owner = ownerHash(request);
      if (!incomplete && owner && options.storageDirectory) {
        for (const [token, value] of pending) if (value.expires <= now()) pending.delete(token);
        if (pending.size >= 100) pending.delete(pending.keys().next().value!);
        pendingToken = randomUUID();
        pending.set(pendingToken, { owner, expires: now() + 1800000, answer: { lesson: lesson.id, intent: body.intent,
          question: body.question, model: selected.id, answer: result.answer, usage: result.usage,
          generatedAt: new Date(now()).toISOString(), contextHash: hash(JSON.stringify(material)) } });
      }
      if (!response.destroyed) response.json({ mode: 'live', model: selected.id, answer: result.answer, modelCalls: 1,
        usage: result.usage, incomplete, ...(pendingToken ? { pendingToken } : {}), note: 'Live Claude answer. Check its claims against the lesson and your own results. Token counts are reported usage; monetary cost is not returned by this API.' });
    } catch {
      if (!response.destroyed) response.status(controller.signal.aborted ? 504 : 502).json({ message: controller.signal.aborted
        ? 'The tutor question stopped or timed out. A request already sent may still incur charges.'
        : 'Claude could not complete this answer. Check the server configuration and account quota. No automatic retry was made.' });
    } finally { clearTimeout(timer); request.off('aborted', closed); response.off('close', closed); controller.abort(); active--; }
  });
  router.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const status = error && typeof error === 'object' && 'status' in error && error.status === 413 ? 413 : 400;
    response.status(status).json({ message: status === 413 ? 'The tutor request is too large.' : 'The tutor request could not be read.' });
  });
  return router;
}
