import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lab20ResultSchema } from '../../shared/lab20-hooks-in-depth.js';
import type { Lab20HostAudit, Lab20ProviderEvent, Lab20Result, Lab20Run } from '../../shared/lab20-hooks-in-depth.js';
import { lab07RequestSchema } from '../../shared/lab07-hooks.js';
import type { Lab07Frame } from '../../shared/lab07-hooks.js';
import { createSandbox } from './lab03-sandbox.js';
import type { Sandbox } from './lab03-sandbox.js';
import { createFixtureLab07Port, createLiveLab07Port } from './lab07-port.js';
import type { Lab07Port } from './lab07-port.js';
import { runLab07 } from './lab07-run.js';
import type { StreamEvent } from './session-events.js';

export type Lab20PortFactory = (request: ReturnType<typeof lab07RequestSchema.parse>) => Lab07Port;
const short = (value: string) => value.slice(0, 400);
const finalReport = z.strictObject({ result: z.literal('approved'), evidence: z.string().min(1).max(200) });
function frameIdentity(frame: Lab07Frame) {
  if (!('raw' in frame) || typeof frame.raw !== 'string') return { threadId: null, eventId: null };
  try {
    const raw: unknown = JSON.parse(frame.raw);
    if (!raw || typeof raw !== 'object') return { threadId: null, eventId: null };
    const value = raw as { session_thread_id?: unknown; id?: unknown };
    return { threadId: typeof value.session_thread_id === 'string' ? value.session_thread_id.slice(0, 200) : null,
      eventId: typeof value.id === 'string' ? value.id.slice(0, 200) : null };
  } catch { return { threadId: null, eventId: null }; }
}
function customDetail(frame: Lab07Frame) {
  if (!('raw' in frame) || typeof frame.raw !== 'string') return 'Content unavailable in projected frame.';
  try {
    const event: unknown = JSON.parse(frame.raw);
    if (!event || typeof event !== 'object') return 'Content unavailable in projected frame.';
    const value = event as { name?: unknown; input?: unknown; is_error?: unknown; custom_tool_use_id?: unknown };
    if (value.name) return short(`${String(value.name)} ${JSON.stringify(value.input ?? {})}`);
    return short(`custom tool result for ${String(value.custom_tool_use_id ?? 'unknown')}; is_error=${String(value.is_error ?? 'unknown')}`);
  } catch { return 'Content unavailable in projected frame.'; }
}
export async function runLab20(input: Lab20Run, signal: AbortSignal,
  emit: (entry: Lab20ProviderEvent | Lab20HostAudit) => void = () => {}, portFactory?: Lab20PortFactory,
  runId = randomUUID()): Promise<{ result: Lab20Result; sandbox: Sandbox }> {
  const sandbox = await createSandbox();
  try {
    await sandbox.writeText('workspace/draft.md', '# Draft\n\nStatus: draft\n');
    await sandbox.writeText('workspace/protected.md', '# Protected\n\nlocked\n');
    const providerEvents: Lab20ProviderEvent[] = [], hostAudit: Lab20HostAudit[] = [];
    let sessionId: string | null = null;
    const correlation = (eventId: string | null = null) => ({ runId, sessionId, threadId: null, eventId });
    const audit = (entry: Lab20HostAudit) => { if (hostAudit.length < 80) { hostAudit.push(entry); emit(entry); } };
    const provider = (entry: Lab20ProviderEvent) => { if (providerEvents.length < 80) { providerEvents.push(entry); emit(entry); } };
    const boundary = (phase: 'create' | 'send' | 'cleanup', outcome: 'started' | 'completed' | 'failed' | 'skipped', detail: string) =>
      audit({ ...correlation(), kind: 'boundary', phase, outcome, detail: short(detail) });
    const finish = async (outcome: Lab20Result['outcome'], cleanup: Lab20Result['cleanup'], note: string,
      virtualTicks: number | null = null) => ({ sandbox, result: lab20ResultSchema.parse({ runId, mode: input.mode,
        source: input.mode === 'live' ? 'managed-api' : 'authored-fixture', scenario: input.scenario, sessionId,
        outcome, providerEvents, hostAudit, files: await sandbox.list(), virtualTicks, cleanup, note }) });
    // A host audit interceptor is itself part of the safety boundary. Its failure stops the call before a port exists.
    if (input.scenario === 'interceptor-exception') {
      try { throw new Error('Authored pre-execution interceptor exception.'); }
      catch { audit({ ...correlation(), kind: 'interceptor', phase: 'pre-execution', outcome: 'failed',
        detail: 'Instrumentation failed closed before session creation or tool execution.' }); }
      boundary('create', 'skipped', 'No Managed or fixture port was created.');
      audit({ ...correlation(), kind: 'handler', phase: 'before', outcome: 'skipped', detail: 'No custom handler ran.' });
      boundary('cleanup', 'completed', 'Disposable host fixture remains available until reset.');
      return finish('host-instrumentation-error', 'not-needed', 'An interceptor exception is a host instrumentation failure, not a provider or tool error.');
    }
    if (input.scenario === 'deadline') {
      // Virtual time is fixture-only: no wall-clock wait, port, or provider call.
      boundary('create', 'skipped', 'Virtual fixture uses no session.');
      boundary('send', 'skipped', 'Virtual clock advanced to its deadline without a provider send.');
      audit({ ...correlation(), kind: 'interceptor', phase: 'pre-execution', outcome: 'deny', detail: 'Deadline expired before execution.' });
      boundary('cleanup', 'completed', 'Virtual fixture cleanup completed.');
      return finish('deadline', 'simulated', 'Authored virtual ticks model the deadline; they are not a provider timing measurement.', 5);
    }
    // Establish the audit sink before making a provider port. If this throws, no session or handler can start.
    audit({ ...correlation(), kind: 'interceptor', phase: 'pre-execution', outcome: 'passed',
      detail: 'Host audit sink accepted the preflight record; tool input still needs its own policy check.' });
    const request = lab07RequestSchema.parse({ mode: input.mode,
      policy: input.scenario === 'denied-pre-execution' ? 'deny-write' : 'audit-only', scenario: 'normal',
      prompt: input.prompt, deadlineSeconds: input.deadlineSeconds, handlerTimeoutMs: 5000, budgetCents: input.budgetCents });
    boundary('create', 'started', 'Shared tool-session runner will create one bounded session.');
    const defaultPort = () => input.mode === 'live' ? createLiveLab07Port(request) : createFixtureLab07Port(request);
    const base = portFactory ? portFactory(request) : defaultPort();
    const port: Lab07Port = input.scenario === 'tool-failure' ? { ...base, async open(id, activeSignal) {
      const stream = await base.open(id, activeSignal);
      return (async function* (): AsyncGenerator<StreamEvent> {
        for await (const event of stream) {
          if (event.type === 'agent.custom_tool_use' && event.name === 'edit_file')
            yield { ...event, input: { path: '/workspace/draft.md', oldText: 'absent fragment', newText: 'Status: reviewed' } } as StreamEvent;
          else yield event;
        }
      })();
    } } : base;
    const frames: Lab07Frame[] = [];
    const result = await runLab07(request, port, sandbox, runId, signal, frame => {
      if (frames.length < 100) frames.push(frame);
      if (frame.kind === 'session') { sessionId = frame.session.id; boundary('create', 'completed', 'Session identity observed from the runner.'); }
      const identity = frameIdentity(frame);
      if (frame.kind === 'lifecycle') provider({ ...correlation(frame.id), threadId: identity.threadId, kind: 'lifecycle', type: frame.type, detail: short(frame.detail) });
      else if (frame.kind === 'span') provider({ ...correlation(frame.id), threadId: identity.threadId, kind: 'model-span', type: frame.type, detail: short(frame.detail) });
      else if (frame.kind === 'tool_use') provider({ ...correlation(frame.id), threadId: identity.threadId, kind: 'tool-request', type: frame.name, detail: short(frame.input) });
      else if (frame.kind === 'tool_result') provider({ ...correlation(frame.id), threadId: identity.threadId, kind: 'tool-result', type: 'agent.tool_result', detail: short(frame.text) });
      else if (frame.kind === 'message') provider({ ...correlation(frame.eventId), threadId: identity.threadId, kind: 'message', type: 'agent.message', detail: short(frame.text) });
      else if (frame.kind === 'other' && frame.type === 'agent.custom_tool_use') provider({ ...correlation(identity.eventId), threadId: identity.threadId,
        kind: 'tool-request', type: frame.type, detail: customDetail(frame) });
      else if (frame.kind === 'other' && frame.type === 'user.custom_tool_result') provider({ ...correlation(identity.eventId), threadId: identity.threadId,
        kind: 'tool-result', type: frame.type, detail: customDetail(frame) });
      else if (frame.kind === 'other' && frame.type.includes('thread')) provider({ ...correlation(identity.eventId), threadId: identity.threadId, kind: 'thread', type: frame.type, detail: 'Observed thread event.' });
      else if (frame.kind === 'audit') {
        const eventId = frame.audit.id;
        audit({ ...correlation(eventId), kind: 'interceptor', phase: 'pre-execution',
          outcome: frame.audit.decision === 'deny' ? 'deny' : 'allow', detail: short(frame.audit.reason) });
        audit({ ...correlation(eventId), kind: 'handler', phase: 'before', outcome: frame.audit.handlerRan ? 'ran' : 'skipped',
          detail: frame.audit.handlerRan ? 'Host custom handler was invoked.' : 'Pre-execution policy prevented the handler.' });
        audit({ ...correlation(eventId), kind: 'handler', phase: 'after',
          outcome: frame.audit.outcome === 'failed' ? 'failed' : frame.audit.handlerRan ? 'ran' : 'skipped', detail: short(frame.audit.result.text) });
        audit({ ...correlation(eventId), kind: 'interceptor', phase: 'post-execution',
          outcome: frame.audit.outcome === 'executed' ? 'passed' : 'rejected', detail: short(`Effect evidence: ${frame.audit.outcome}.`) });
      }
    });
    sessionId = result.sessionId;
    boundary('send', result.outcome.kind === 'completed' ? 'completed' : 'failed', `Runner outcome: ${result.outcome.kind}.`);
    for (const confirmation of frames.filter(frame => frame.kind === 'confirmation'))
      audit({ ...correlation(confirmation.toolUseId), kind: 'approval', phase: 'confirmation', outcome: confirmation.result,
        detail: short(confirmation.reason) });
    if (!frames.some(frame => frame.kind === 'confirmation')) audit({ ...correlation(), kind: 'approval', phase: 'confirmation',
      outcome: 'not-required', detail: 'This custom-tool path returned a result; no always_ask confirmation was observed.' });
    for (const [phase, present] of [['model-span', providerEvents.some(event => event.kind === 'model-span')],
      ['child-thread', providerEvents.some(event => event.kind === 'thread')]] as const)
      audit({ ...correlation(), kind: 'coverage', phase, outcome: present ? 'observed' : 'not-observed',
        detail: present ? 'Matching event observed.' : 'No matching event observed; no event was inferred.' });
    let outcome: Lab20Result['outcome'];
    if (result.outcome.kind !== 'completed') outcome = result.outcome.kind === 'deadline' ? 'deadline'
      : result.outcome.kind === 'error' ? 'provider-error' : 'incomplete';
    else if (result.audits.some(entry => entry.outcome === 'denied')) outcome = 'host-policy-denial';
    else if (result.audits.some(entry => entry.outcome === 'failed')) outcome = 'tool-error';
    else if (input.scenario === 'final-validation-failure') {
      const answer = frames.filter(frame => frame.kind === 'message').at(-1);
      let valid = false;
      if (answer?.kind === 'message') {
        try { valid = finalReport.safeParse(JSON.parse(answer.text)).success; } catch { valid = false; }
      }
      outcome = valid ? 'verified' : 'final-validation-error';
    } else {
      const draft = await sandbox.readText('workspace/draft.md');
      outcome = result.audits.some(entry => entry.outcome === 'executed' && entry.before !== entry.after)
        && draft.includes('Status: reviewed') ? 'verified' : 'incomplete';
    }
    audit({ ...correlation(), kind: 'interceptor', phase: 'final-validation',
      outcome: outcome === 'verified' ? 'passed' : 'rejected', detail: short(`Application verifier classified ${outcome}; agent text alone is not proof.`) });
    boundary('cleanup', result.cleanup === 'pending' ? 'failed' : 'completed', `Runner cleanup: ${result.cleanup}.`);
    return finish(outcome, result.cleanup, outcome === 'final-validation-error'
      ? 'A completed turn failed the closed application report check. No unbounded corrective turn was started.'
      : 'Provider frames and host audit are separate. A post-execution observation cannot prevent an effect.');
  } catch (error) { await sandbox.dispose(); throw error; }
}
