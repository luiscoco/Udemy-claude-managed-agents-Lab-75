import { randomUUID } from 'node:crypto';
import { Router, json } from 'express';
import { z } from 'zod';
import { lab06RequestSchema } from '../../shared/lab06-sessions.js';
import type { Lab06Frame, Lab06ParsedRequest } from '../../shared/lab06-sessions.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { createLiveLab06Port, FixtureLab06Port } from '../lib/lab06-port.js';
import type { Lab06Port } from '../lib/lab06-port.js';
import { Lab06ConversationStore } from '../lib/lab06-store.js';
import { openSse } from '../sse.js';

const ownerPattern = /^[A-Za-z0-9_-]{1,80}$/;
type FrameInput = Lab06Frame extends infer Frame ? Frame extends Lab06Frame ? Omit<Frame, 'seq'> : never : never;
function ownerOf(headers: Record<string, unknown>) { const value = typeof headers['x-lab-owner'] === 'string' ? headers['x-lab-owner'] : 'browser-demo'; return ownerPattern.test(value) ? value : null; }
function textOf(event: { type: string; content?: readonly { type: string; text?: string }[] }) {
  return event.type === 'agent.message' ? event.content?.map((block) => block.type === 'text' ? block.text ?? '' : '[non-text block]').join('\n') : undefined;
}

export function createLab06Router(options: { fixture?: FixtureLab06Port; live?: (input: Lab06ParsedRequest) => Lab06Port; store?: Lab06ConversationStore } = {}) {
  const router = Router(); const fixture = options.fixture ?? new FixtureLab06Port(); const store = options.store ?? new Lab06ConversationStore();
  const live = options.live ?? (() => createLiveLab06Port()); const active = new Map<AbortController, Promise<void>>(); let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? ''; const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) { response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return; }
    next();
  });
  const lookup = (id: string, owner: string, response: import('express').Response) => {
    const result = store.read(id, owner);
    if (result.kind === 'missing') response.status(404).json(apiError('NOT_FOUND', 'Unknown conversation ID.'));
    else if (result.kind === 'foreign') response.status(403).json(apiError('INVALID_REQUEST', 'This conversation belongs to another exercise owner.'));
    else if (result.kind === 'archived') response.status(409).json(apiError('CONFLICT', 'This conversation is archived. Start a new one.'));
    else if (result.kind === 'expired') response.status(409).json(apiError('CONFLICT', 'This conversation expired. Start a new one.'));
    return result.kind === 'ok' ? result.entry : null;
  };
  router.get('/conversation', (request, response) => {
    const owner = ownerOf(request.headers); if (!owner) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid X-Lab-Owner header.')); return; }
    const parsed = z.strictObject({ conversationId: z.uuid() }).safeParse(request.query);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Send ?conversationId= with the local UUID.')); return; }
    const entry = lookup(parsed.data.conversationId, owner, response); if (!entry) return;
    response.json({ conversationId: entry.conversationId, sessionId: entry.sessionId, archived: entry.archived,
      turnCount: entry.turnCount, history: entry.history, expiresAt: new Date(entry.expiresAt).toISOString() });
  });
  router.post('/close', json({ limit: '2kb', strict: true }), async (request, response) => {
    const owner = ownerOf(request.headers); const parsed = z.strictObject({ conversationId: z.uuid(), mode: z.enum(['scripted', 'live']) }).safeParse(request.body);
    if (!owner || !parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Send a valid owner, conversationId and mode.')); return; }
    const entry = lookup(parsed.data.conversationId, owner, response); if (!entry) return;
    const port = parsed.data.mode === 'scripted' ? fixture : live({ mode: 'live', action: 'continue', conversationId: entry.conversationId,
      prompt: 'close', scenario: 'normal', deadlineSeconds: 30 });
    const status = await port.status(entry.sessionId).catch(() => 'unknown');
    if (status !== 'idle') { response.status(409).json(apiError('CONFLICT', `Session is ${status}; close requires confirmed idle.`)); return; }
    await port.archive(entry.sessionId); entry.archived = true; response.json({ closed: true, conversationId: entry.conversationId, sessionId: entry.sessionId });
  });
  router.post('/query', json({ limit: '8kb', strict: true }), async (request, response) => {
    const parsed = lab06RequestSchema.safeParse(request.body); const owner = ownerOf(request.headers);
    if (!owner || !parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Check owner, action, conversation ID, prompt, scenario, budget and deadline.', parsed.success ? undefined : parsed.error)); return; }
    const settings = managedSettings();
    if (closing || active.size >= settings.maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    let port: Lab06Port; try { port = parsed.data.mode === 'scripted' ? fixture : live(parsed.data); }
    catch { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Configure Managed live mode first.')); return; }
    let entry = parsed.data.action === 'new' ? null : lookup(parsed.data.conversationId!, owner, response); if (parsed.data.action !== 'new' && !entry) return;
    const controller = new AbortController(); const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 20_000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + 10_000, quiet: true });
    const work = (async () => { let upstream: Awaited<ReturnType<Lab06Port['open']>> | undefined;
      try {
        if (!entry) { const created = await port.create(parsed.data); entry = store.create(owner, created.id); }
        const localTurnId = randomUUID(); let seq = 0; const sendFrame = (frame: FrameInput) => stream.send('progress', { ...frame, seq: ++seq });
        sendFrame({ kind: 'session', conversationId: entry.conversationId, sessionId: entry.sessionId, localTurnId, action: parsed.data.action });
        upstream = await port.open(entry.sessionId, controller.signal, parsed.data.scenario);
        if (parsed.data.action === 'reconnect') {
          const duplicates = store.merge(entry, await port.history(entry.sessionId));
          for (let i = 0; i < duplicates; i++) sendFrame({ kind: 'duplicate', id: `persisted-duplicate-${i + 1}` });
          stream.send('result', { mode: parsed.data.mode, source: port.source, action: parsed.data.action, conversationId: entry.conversationId,
            sessionId: entry.sessionId, localTurnId, sentEventId: null, history: entry.history, duplicatesIgnored: duplicates,
            outcome: 'reconnected', archived: false, message: `Reconnected to ${entry.sessionId}; stream opened before paginated history hydration.` }); return;
        }
        const sentEventId = await port.send(entry.sessionId, parsed.data.prompt, controller.signal); entry.turnCount++;
        let completed = false;
        for await (const event of upstream.events) {
          const id = 'id' in event ? event.id : 'event_id' in event ? event.event_id : `delta-${seq + 1}`;
          const text = textOf(event); sendFrame({ kind: 'event', id, eventType: event.type, ...(text ? { text } : {}) });
          if (event.type === 'session.status_idle' && event.stop_reason.type === 'end_turn') { completed = true; break; }
        }
        const history = await port.history(entry.sessionId); const duplicates = store.merge(entry, history);
        stream.send('result', { mode: parsed.data.mode, source: port.source, action: parsed.data.action, conversationId: entry.conversationId,
          sessionId: entry.sessionId, localTurnId, sentEventId, history: entry.history, duplicatesIgnored: duplicates,
          outcome: completed ? 'completed' : 'incomplete', archived: false,
          message: completed ? `Turn ${entry.turnCount} completed; the retained session remains open.` : 'The stream ended before end_turn; the retained session remains open.' });
      } catch (error) {
        if (!controller.signal.aborted) stream.send('error', { message: error instanceof Error ? error.message : 'The session request failed.' });
        else if (entry) await port.interrupt(entry.sessionId).catch(() => {});
      } finally { upstream?.close(); await stream.end(); active.delete(controller); }
    })(); active.set(controller, work); await work;
  });
  router.use(apiErrorHandler);
  return { router, fixture, store, async close() { closing = true; for (const controller of active.keys()) controller.abort('shutdown'); await Promise.allSettled(active.values());
    await Promise.allSettled(store.all().filter((entry) => !entry.archived).map(async (entry) => { const port = entry.sessionId.startsWith('sesn_fixture_') ? fixture : createLiveLab06Port();
      const status = await port.status(entry.sessionId).catch(() => 'unknown'); if (status !== 'idle') await port.interrupt(entry.sessionId).catch(() => {});
      if (status === 'idle') { await port.archive(entry.sessionId).catch(() => {}); entry.archived = true; } })); } };
}

