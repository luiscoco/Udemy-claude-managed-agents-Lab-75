import { setTimeout as delay } from 'node:timers/promises';
import type { Sandbox } from './lab03-sandbox.js';
import { PathRejected, resolveContainerPath } from './lab03-sandbox.js';
import { lab07ToolNames, lab07ToolShapes } from '../../shared/lab07-hooks.js';
import type { Lab07Audit, Lab07Policy, Lab07ToolName } from '../../shared/lab07-hooks.js';

const allowed = new Set(['/workspace/draft.md', '/workspace/protected.md', '/workspace/proposed.md']);
function guard(raw: unknown) {
  const target = resolveContainerPath(raw);
  if (target.root !== 'workspace' || !allowed.has(target.path)) throw new PathRejected(`Lab 07 refuses ${target.path}; use its named /workspace fixtures.`);
  return target.path;
}
const json = (value: unknown) => JSON.stringify(value).slice(0, 4000);
const issues = (error: { issues: readonly { path: PropertyKey[]; message: string }[] }) => error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');

export async function executePolicy(input: { id: string; name: string; raw: unknown; policy: Lab07Policy; sandbox: Sandbox;
  timeoutMs: number; signal: AbortSignal; forceException?: boolean }): Promise<Lab07Audit> {
  const base = { id: input.id, tool: input.name.slice(0, 80), policy: input.policy, originalInput: json(input.raw) };
  if (!lab07ToolNames.includes(input.name as Lab07ToolName)) return { ...base, effectiveInput: null, decision: 'deny', reason: 'Unknown custom tool.', validation: 'rejected', handlerRan: false,
    outcome: 'denied', before: null, after: null, result: { isError: true, text: 'Unknown custom tool; nothing ran.' } };
  const shape = lab07ToolShapes[input.name as Lab07ToolName]; const parsed = shape.safeParse(input.raw);
  if (!parsed.success) return { ...base, effectiveInput: null, decision: 'deny', reason: issues(parsed.error), validation: 'rejected', handlerRan: false,
    outcome: 'denied', before: null, after: null, result: { isError: true, text: `Invalid input: ${issues(parsed.error)}. Nothing ran.` } };
  let effective: Record<string, unknown> = { ...parsed.data }; let decision: Lab07Audit['decision'] = 'allow'; let validation: Lab07Audit['validation'] = 'passed';
  let reason = 'Audit-only policy allows valid calls inside the named fixture.';
  let originalPath: string;
  try { originalPath = guard(effective.path); }
  catch (error) { const reason = error instanceof Error ? error.message : 'Path rejected.'; return { ...base, effectiveInput: json(effective), decision: 'deny', reason,
    validation: 'rejected', handlerRan: false, outcome: 'denied', before: null, after: null, result: { isError: true, text: `${reason} Nothing ran.` } }; }
  if (input.policy === 'deny-write' && input.name !== 'read_file' && originalPath === '/workspace/protected.md')
    return { ...base, effectiveInput: json(effective), decision: 'deny', reason: 'Protected-file writes are denied before execution.', validation, handlerRan: false,
      outcome: 'denied', before: await input.sandbox.readText('workspace/protected.md'), after: await input.sandbox.readText('workspace/protected.md'),
      result: { isError: true, text: 'Host policy denied the protected-file change; nothing ran.' } };
  if (input.policy === 'rewrite-input' && input.name !== 'read_file' && originalPath === '/workspace/proposed.md') {
    effective = { ...effective, path: '/workspace/draft.md' }; decision = 'rewrite'; validation = 'revalidated';
    reason = 'Host rewrote proposed.md to the allowed draft.md fixture, then revalidated the full effective input.';
    const checked = shape.safeParse(effective); if (!checked.success) throw new Error('Rewritten input failed revalidation.'); effective = checked.data;
  }
  const path = guard(effective.path); const relative = `workspace/${path.split('/').at(-1)}`; const before = await input.sandbox.readText(relative).catch(() => null);
  try {
    const work = async () => {
      if (input.forceException) throw new Error('Authored handler exception.');
      if (input.name === 'read_file') return await input.sandbox.readText(relative);
      if (input.name === 'write_file') { await input.sandbox.writeText(relative, String(effective.content)); return `Wrote ${path}.`; }
      const current = await input.sandbox.readText(relative); const oldText = String(effective.oldText);
      if (!current.includes(oldText)) throw new Error('oldText was not found; no edit was applied.');
      await input.sandbox.writeText(relative, current.replace(oldText, String(effective.newText))); return `Edited ${path}.`;
    };
    const result = await Promise.race([work(), delay(input.timeoutMs, undefined, { signal: input.signal }).then(() => { throw new Error('Handler deadline exceeded.'); })]);
    const after = await input.sandbox.readText(relative).catch(() => null);
    return { ...base, effectiveInput: json(effective), decision, reason, validation, handlerRan: true, outcome: 'executed', before, after,
      result: { isError: false, text: result } };
  } catch (error) {
    const after = await input.sandbox.readText(relative).catch(() => null); return { ...base, effectiveInput: json(effective), decision, reason, validation,
      handlerRan: true, outcome: 'failed', before, after, result: { isError: true, text: error instanceof Error ? error.message : 'Handler failed.' } };
  }
}

