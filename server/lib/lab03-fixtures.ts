import { copyFile, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { writableRoots } from '../../shared/lab03-tools.js';
import type { Confirmation, Lab03ParsedRequest, Lab03Preset, Lab03Toolset, PolicyType, ToolName } from '../../shared/lab03-tools.js';
import { checkBash, PathRejected, resolveContainerPath } from './lab03-sandbox.js';
import type { Sandbox } from './lab03-sandbox.js';
import type { StreamEvent } from './session-events.js';

/**
 * Authored offline agent. Each preset has a fixed plan of tool calls; the simulator evaluates
 * every call against the session toolset exactly as the documented server rules describe.
 * The plan never adapts, so these runs illustrate permissions, not Claude's behaviour.
 */
export interface PlannedCall { tool: ToolName; input: Record<string, unknown> }
const notes = { tool: 'read', input: { file_path: '/mnt/session/uploads/notes.md' } } as const;
const copy = { tool: 'bash', input: { command: 'cp /mnt/session/uploads/draft.md /mnt/session/outputs/draft.md' } } as const;
const edit = { tool: 'edit', input: { file_path: '/mnt/session/outputs/draft.md', old_string: 'Status: draft', new_string: 'Status: reviewed' } } as const;
const overwrite = { tool: 'write', input: { file_path: '/mnt/session/outputs/draft.md', content: '# Draft\n\nStatus: overwritten\n' } } as const;
export const fixturePlans: Readonly<Record<Lab03Preset, readonly PlannedCall[]>> = Object.freeze({
  'read-only': [notes, { tool: 'glob', input: { pattern: '*.md', path: '/mnt/session/uploads' } },
    { tool: 'grep', input: { pattern: 'TODO', path: '/mnt/session/uploads' } }],
  'unavailable-write': [notes, overwrite],
  'denied-write': [{ tool: 'read', input: { file_path: '/mnt/session/uploads/draft.md' } }, overwrite],
  'permitted-edit': [notes, copy, { tool: 'bash', input: { command: 'cat /mnt/session/uploads/../../../etc/passwd' } }, edit,
    { tool: 'edit', input: { file_path: '/mnt/session/outputs/../../../etc/hosts', old_string: 'localhost', new_string: 'example' } }],
  'auto': [notes, copy, edit, { tool: 'write', input: { file_path: '/etc/profile', content: 'export PATH=/tmp' } }],
});

/** Authored stand-in for the server's auto evaluation. It is not the real classifier. */
export function authoredAutoEvaluation(call: PlannedCall): { type: 'allow' } | { type: 'deny'; reason_code: string } | { type: 'ask'; reason_code: string } {
  const target = call.input.file_path ?? call.input.path;
  if (target === undefined) return { type: 'ask', reason_code: 'indeterminate' };
  try { resolveContainerPath(target); return { type: 'allow' }; }
  catch { return { type: 'deny', reason_code: 'high_risk' }; }
}

const at = '2026-01-01T00:00:00Z';
const running = (id: string): StreamEvent => ({ type: 'session.status_running', id, processed_at: at });
const result = (id: string, toolUseId: string, isError: boolean, text: string): StreamEvent =>
  ({ type: 'agent.tool_result', id, tool_use_id: toolUseId, processed_at: at, is_error: isError, content: [{ type: 'text', text }] });

async function hostFor(sandbox: Sandbox, target: unknown, write: boolean) {
  const mapped = await sandbox.containerToHost(target);
  if (write && !writableRoots.includes(mapped.root)) throw new PathRejected(`EROFS: ${mapped.path} is on a read-only mount.`);
  return mapped;
}
const pattern = (glob: string) => new RegExp(`^${glob.split('/').pop()!.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);

/** Applies one permitted call to the host sandbox through the same guards the host uses. */
export async function executeOnSandbox(sandbox: Sandbox, call: PlannedCall): Promise<{ isError: boolean; text: string }> {
  try {
    const input = call.input;
    switch (call.tool) {
      case 'read': {
        const { host } = await hostFor(sandbox, input.file_path, false);
        if ((await stat(host)).size > 65536) return { isError: true, text: 'File is larger than the lab limit.' };
        return { isError: false, text: await readFile(host, 'utf8') };
      }
      case 'glob': case 'grep': {
        const { host, path: dir } = await hostFor(sandbox, input.path ?? '/workspace', false);
        const names = (await readdir(host)).sort();
        if (call.tool === 'glob') {
          const match = pattern(String(input.pattern ?? '*'));
          return { isError: false, text: names.filter((name) => match.test(name)).map((name) => `${dir}/${name}`).join('\n') || 'No files matched.' };
        }
        const lines: string[] = [];
        for (const name of names) {
          const text = await readFile(path.join(host, name), 'utf8').catch(() => '');
          text.split('\n').forEach((line, index) => { if (line.includes(String(input.pattern))) lines.push(`${dir}/${name}:${index + 1}:${line}`); });
        }
        return { isError: false, text: lines.join('\n') || 'No matches.' };
      }
      case 'write': {
        if (typeof input.content !== 'string') return { isError: true, text: 'write needs string content.' };
        const { host } = await hostFor(sandbox, input.file_path, true);
        await writeFile(host, input.content, 'utf8');
        return { isError: false, text: `Wrote ${input.file_path}.` };
      }
      case 'edit': {
        const { host } = await hostFor(sandbox, input.file_path, true);
        const before = await readFile(host, 'utf8').catch(() => null);
        if (before === null) return { isError: true, text: `${input.file_path} does not exist.` };
        if (typeof input.old_string !== 'string' || typeof input.new_string !== 'string' || !before.includes(input.old_string))
          return { isError: true, text: 'old_string was not found in the file.' };
        await writeFile(host, before.replace(input.old_string, input.new_string), 'utf8');
        return { isError: false, text: `Edited ${input.file_path}.` };
      }
      case 'bash': {
        const check = checkBash(input.command);
        if (!check.allowed) return { isError: true, text: `Authored fixture only simulates allowlisted commands. ${check.reason}` };
        const [verb, ...args] = String(input.command).trim().split(/\s+/);
        if (verb === 'ls') return { isError: false, text: (await readdir((await hostFor(sandbox, args[0], false)).host)).sort().join('\n') };
        if (verb === 'cat') return { isError: false, text: await readFile((await hostFor(sandbox, args[0], false)).host, 'utf8') };
        await copyFile((await hostFor(sandbox, args[0], false)).host, (await hostFor(sandbox, args[1], true)).host);
        return { isError: false, text: '' };
      }
    }
  } catch (error) {
    return { isError: true, text: error instanceof PathRejected ? error.message : 'The fixture could not complete this call.' };
  }
}

export interface PlanFixtureOptions {
  /** Keep the agent working after the first call so cancel and deadline can be observed. */
  hang?: boolean;
  /** After a host deny, emit an authored agent.message that acknowledges the deny_message. */
  acknowledgeDenials?: boolean;
}
export type PlanFixture = ReturnType<typeof createPlanFixture>;

/** One authored session for a preset: see createPlanFixture. */
export function createToolFixture(input: Lab03ParsedRequest, toolset: Lab03Toolset, sandbox: Sandbox, stepMs = 80) {
  return createPlanFixture(fixturePlans[input.preset], toolset, sandbox, stepMs, { hang: input.scenario === 'hang' });
}

/** One authored session: the stream waits for user.message, then pauses for each confirmation it needs. */
export function createPlanFixture(plan: readonly PlannedCall[], toolset: Lab03Toolset, sandbox: Sandbox, stepMs = 80,
  options: PlanFixtureOptions = {}) {
  let markSent!: () => void;
  const sent = new Promise<void>((resolve) => { markSent = resolve; });
  const answers = new Map<string, Confirmation>();
  const waiters = new Map<string, (answer: Confirmation) => void>();
  const policies = new Map<string, PolicyType>(toolset.configs.flatMap((c) => c.enabled ? [[c.name, c.permission_policy.type] as const] : []));
  function answerFor(id: string, signal: AbortSignal) {
    return new Promise<Confirmation>((resolve, reject) => {
      const known = answers.get(id); if (known) { resolve(known); return; }
      const onAbort = () => { waiters.delete(id); reject(signal.reason); };
      signal.addEventListener('abort', onAbort, { once: true });
      waiters.set(id, (answer) => { signal.removeEventListener('abort', onAbort); resolve(answer); });
    });
  }
  async function* events(signal: AbortSignal): AsyncGenerator<StreamEvent> {
    const step = async () => { if (stepMs > 0) await delay(stepMs, undefined, { signal }); signal.throwIfAborted(); };
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => reject(signal.reason);
      signal.addEventListener('abort', onAbort, { once: true });
      void sent.then(() => { signal.removeEventListener('abort', onAbort); resolve(); });
    });
    await step(); yield running('sevt_run_0');
    const summary: string[] = [];
    let index = 0;
    for (const call of plan) {
      index++;
      const useId = `sevt_tool_${index}`, resultId = `sevt_result_${index}`;
      const policy = policies.get(call.tool);
      const use = (permission: 'allow' | 'ask' | 'deny', evaluation?: object): StreamEvent =>
        ({ type: 'agent.tool_use', id: useId, name: call.tool, input: call.input, processed_at: at,
          evaluated_permission: permission, ...(evaluation ? { evaluation } : {}) } as StreamEvent);
      await step();
      let permitted: boolean | 'host-deny' = false, denyMessage = '';
      if (!policy) {
        yield use('deny');
        await step(); yield result(resultId, useId, true, `Authored fixture: ${call.tool} is not enabled in this session.`);
        summary.push(`${call.tool}: unavailable`); continue;
      }
      const auto = policy === 'auto' ? authoredAutoEvaluation(call) : null;
      if (policy === 'always_allow' || auto?.type === 'allow') {
        yield use('allow', auto ? { type: 'auto', evaluated_permission: auto } : { type: 'always_allow' });
        permitted = true;
      } else if (auto?.type === 'deny') {
        yield use('deny', { type: 'auto', evaluated_permission: auto });
        await step(); yield result(resultId, useId, true, `Permission to use ${call.tool} has been denied.`);
        summary.push(`${call.tool}: denied by auto (${auto.reason_code})`); continue;
      } else {
        yield use('ask', auto ? { type: 'auto', evaluated_permission: auto } : { type: 'always_ask' });
        await step();
        yield { type: 'session.status_idle', id: `sevt_idle_ask_${index}`, processed_at: at, stop_details: null,
          stop_reason: { type: 'requires_action', event_ids: [useId] } };
        const answer = await answerFor(useId, signal);
        await step(); yield running(`sevt_run_${index}`);
        if (answer.result === 'allow') permitted = true;
        else { permitted = 'host-deny'; denyMessage = answer.denyMessage ?? 'Denied by the host.'; }
      }
      await step();
      if (permitted === true) {
        const outcome = await executeOnSandbox(sandbox, call);
        yield result(resultId, useId, outcome.isError, outcome.text.slice(0, 4000));
        summary.push(`${call.tool}: ${outcome.isError ? 'ran with an error' : 'ran'}`);
      } else {
        yield result(resultId, useId, true, denyMessage);
        summary.push(`${call.tool}: denied by host`);
        if (options.acknowledgeDenials) {
          await step();
          yield { type: 'agent.message', id: `sevt_ack_${index}`, processed_at: at, content: [{ type: 'text',
            text: `Authored fixture (not Claude): the host denied ${call.tool} with "${denyMessage}". I will not retry this call.` }] };
        }
      }
      if (options.hang) await delay(3_600_000, undefined, { signal });
    }
    await step();
    yield { type: 'agent.message', id: 'sevt_msg_1', processed_at: at,
      content: [{ type: 'text', text: `Authored fixture summary (not Claude output):\n- ${summary.join('\n- ')}` }] };
    await step();
    yield { type: 'session.status_idle', id: 'sevt_idle_end', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } };
  }
  return {
    events, markSent: () => markSent(),
    confirm(confirmations: readonly Confirmation[]) {
      for (const answer of confirmations) { answers.set(answer.toolUseId, answer); waiters.get(answer.toolUseId)?.(answer); waiters.delete(answer.toolUseId); }
    },
  };
}
