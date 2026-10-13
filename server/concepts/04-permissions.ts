import { Router, json } from 'express';
import { lab04DecisionSchema, lab04RequestSchema, lab04SdkOnlyFields } from '../../shared/lab04-permissions.js';
import type { Lab04Request } from '../../shared/lab04-permissions.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { ApprovalRegistry } from '../lib/lab04-approvals.js';
import { createFixtureLab04Port, createLiveLab04Port } from '../lib/lab04-port.js';
import type { Lab04Port } from '../lib/lab04-port.js';
import { runLab04 } from '../lib/lab04-run.js';
import { createSandbox, hostAllowCheck } from '../lib/lab03-sandbox.js';
import type { Sandbox } from '../lib/lab03-sandbox.js';
import { openSse } from '../sse.js';

const cleanupWaitMs = 10_000;
export type Lab04LivePortFactory = (input: Lab04Request, sandbox: Sandbox) => Lab04Port;
const sdkOnlyIn = (body: unknown) => typeof body === 'object' && body !== null
  ? lab04SdkOnlyFields.filter((key) => Object.hasOwn(body, key)) : [];
const sdkOnlyMessage = (fields: readonly string[]) => `${fields.join(', ')} ${fields.length === 1 ? 'is an Agent SDK option' : 'are Agent SDK options'}. `
  + 'Managed Agents pauses always_ask calls and the host answers with user.tool_confirmation (allow, or deny with a deny_message); '
  + 'a confirmation cannot change the input. Nothing was translated or sent.';

/**
 * /api/c4: POST /query runs one session turn (SSE) and turns each requires_action pause into a pending
 * approval; POST /decide resolves one approval. Decisions are bound to their run by runId + decisionToken.
 */
export function createLab04Router(livePort: Lab04LivePortFactory = createLiveLab04Port, fixtureStepMs = 80,
  options: { registry?: ApprovalRegistry; sandboxBase?: string } = {}) {
  const router = Router();
  const registry = options.registry ?? new ApprovalRegistry();
  const active = new Map<AbortController, Promise<void>>();
  let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '';
    const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return;
    }
    next();
  });
  router.post('/decide', json({ limit: '1kb', strict: true }), (request, response) => {
    const sdkOnly = sdkOnlyIn(request.body);
    const parsed = lab04DecisionSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json(apiError('INVALID_REQUEST', sdkOnly.length ? sdkOnlyMessage(sdkOnly)
        : 'Send runId, toolUseId, decisionToken, decision (allow or deny) and an optional denyMessage.', parsed.error)); return;
    }
    // The host validates an allow with the same guards it uses everywhere; a deny needs no validation.
    const result = registry.decide(parsed.data, ({ tool, input }) => { const check = hostAllowCheck(tool, input); return check.ok ? null : check.reason; });
    if (result.status === 200) {
      response.json({ ok: true, toolUseId: parsed.data.toolUseId, tool: result.tool, decision: result.outcome.decision,
        decidedBy: result.outcome.decidedBy, denyMessage: result.outcome.denyMessage }); return;
    }
    const code = result.status === 404 ? 'NOT_FOUND' : result.status === 409 ? 'CONFLICT' : 'INVALID_REQUEST';
    response.status(result.status).json(apiError(code, result.message));
  });
  router.post('/query', json({ limit: '8kb', strict: true }), async (request, response) => {
    // Validation comes first: nothing below may touch a provider or the disk for an invalid request.
    const sdkOnly = sdkOnlyIn(request.body);
    const parsed = lab04RequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json(apiError('INVALID_REQUEST', sdkOnly.length ? sdkOnlyMessage(sdkOnly)
        : 'Check mode, prompt, scenario, approval seconds (5–120), budget cents and deadline bounds.', parsed.error)); return;
    }
    const settings = managedSettings();
    if (closing || active.size >= settings.maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server MANAGED_DEADLINE_MS policy.')); return; }
    const controller = new AbortController();
    active.set(controller, Promise.resolve()); // reserve capacity before any await
    let sandbox: Sandbox, port: Lab04Port;
    try { sandbox = await createSandbox(options.sandboxBase); }
    catch { active.delete(controller); response.status(500).json(apiError('INTERNAL', 'The lab sandbox could not be created.')); return; }
    try { port = parsed.data.mode === 'live' ? livePort(parsed.data, sandbox) : createFixtureLab04Port(parsed.data, sandbox, fixtureStepMs); }
    catch {
      active.delete(controller); await sandbox.dispose().catch(() => {});
      response.status(422).json(apiError('UNSUPPORTED_MODE', 'Configure the server API key, agent ID, environment ID, valid limits and MANAGED_LIVE_ENABLED=true first.')); return;
    }
    const run = registry.openRun();
    const stream = openSse(request, response, { controller, heartbeatMs: 5_000, idleMs: 20_000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + cleanupWaitMs + 20_000, quiet: true });
    const work = (async () => {
      try {
        const result = await runLab04(parsed.data, port, sandbox, registry, run, controller.signal, (frame) => { stream.send('progress', frame); }, cleanupWaitMs);
        if (!controller.signal.aborted) stream.send('result', result);
      } catch { if (!controller.signal.aborted) stream.send('error', { message: 'The query could not be completed.' }); }
      finally {
        registry.releaseRun(run.runId);
        await stream.end(); active.delete(controller);
        await sandbox.dispose().catch(() => {});
      }
    })();
    active.set(controller, work);
    await work;
  });
  router.use(apiErrorHandler);
  return { router, registry, async close() {
    closing = true;
    for (const controller of active.keys()) controller.abort('shutdown');
    await Promise.allSettled(active.values());
  } };
}
