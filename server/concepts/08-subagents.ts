import { randomUUID } from 'node:crypto';
import { Router, json } from 'express';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { openSse } from '../sse.js';
import { createFixtureLab08Port, createLiveLab08Port, lab08AgentEnv, lab08AgentId } from '../lib/lab08-port.js';
import type { Lab08Port } from '../lib/lab08-port.js';
import { runLab08 } from '../lib/lab08-run.js';
import { lab08Agents, lab08RequestSchema, lab08SdkOnlyFields } from '../../shared/lab08-subagents.js';
import type { Lab08ParsedRequest } from '../../shared/lab08-subagents.js';

export function createLab08Router(options: { live?: (input: Lab08ParsedRequest) => Lab08Port; fixtureStepMs?: number } = {}) {
  const router = Router(); const active = new Map<AbortController, Promise<void>>(); let closing = false; const live = options.live ?? createLiveLab08Port;
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? ''; const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) { response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return; } next(); });
  router.get('/agents', (_request, response) => response.json({ agents: lab08Agents, liveAgent: { envVar: lab08AgentEnv, configured: Boolean(lab08AgentId()) }, configuration: { type: 'multiagent_20261001', inlineAgents: 'disabled', workflows: 'disabled' } }));
  router.post('/query', json({ limit: '8kb', strict: true }), async (request, response) => { const sdkFields = typeof request.body === 'object' && request.body ? lab08SdkOnlyFields.filter((key) => Object.hasOwn(request.body, key)) : [];
    const parsed = lab08RequestSchema.safeParse(request.body); if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', sdkFields.length ? `${sdkFields.join(', ')} are Agent SDK fields and were not sent.` : 'Check mode, scenario, prompt and limits.', parsed.error)); return; }
    const settings = managedSettings(); if (closing || active.size >= settings.maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    let port: Lab08Port; try { port = parsed.data.mode === 'live' ? live(parsed.data) : createFixtureLab08Port(options.fixtureStepMs ?? 15); } catch { response.status(422).json(apiError('UNSUPPORTED_MODE', `Configure live mode and ${lab08AgentEnv} first.`)); return; }
    const controller = new AbortController(); const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 20_000, deadlineMs: parsed.data.deadlineSeconds * 1000 + 15_000, quiet: true });
    const work = (async () => { try { const result = await runLab08(parsed.data, port, randomUUID(), controller.signal, (frame) => stream.send('progress', frame)); if (!controller.signal.aborted || result.outcome === 'cancelled') stream.send('result', result); }
      catch { if (!controller.signal.aborted) stream.send('error', { message: 'The Lab 08 run could not be completed.' }); } finally { await stream.end(); active.delete(controller); } })(); active.set(controller, work); await work;
  }); router.use(apiErrorHandler); return { router, async close() { closing = true; for (const controller of active.keys()) controller.abort('shutdown'); await Promise.allSettled(active.values()); } };
}
