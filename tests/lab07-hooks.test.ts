import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import { createSandbox } from '../server/lib/lab03-sandbox.js';
import { executePolicy } from '../server/lib/lab07-policy.js';
import { createFixtureLab07Port, lab07ToolMismatch } from '../server/lib/lab07-port.js';
import { runLab07 } from '../server/lib/lab07-run.js';
import { createLab07Router } from '../server/concepts/07-hooks.js';
import { lab07Prompt, lab07RequestSchema, lab07Tools } from '../shared/lab07-hooks.js';
import type { Lab07Policy, Lab07Request } from '../shared/lab07-hooks.js';

async function fixture() { const sandbox = await createSandbox(); await sandbox.writeText('workspace/draft.md', '# Draft\n\nStatus: draft\n');
  await sandbox.writeText('workspace/protected.md', '# Protected\n\nlocked\n'); return sandbox; }
const signal = new AbortController().signal;

test('dedicated agent template contains exactly the three generated custom tools', async () => {
  const template = JSON.parse(await readFile('managed/lab07-agent.json', 'utf8')) as { tools: unknown[]; mcp_servers: unknown[]; skills: unknown[] };
  assert.deepEqual(template.tools, JSON.parse(JSON.stringify(lab07Tools))); assert.deepEqual([template.mcp_servers, template.skills], [[], []]);
  assert.equal(lab07ToolMismatch(template.tools as never), null); assert.match(lab07ToolMismatch(template.tools.slice(1) as never)!, /do not exactly match/);
});

test('strict request rejects Agent SDK hook fields and live-only fixture scenarios', () => {
  const base = { mode: 'scripted', policy: 'audit-only', scenario: 'normal', prompt: lab07Prompt, deadlineSeconds: 10 };
  assert.equal(lab07RequestSchema.safeParse(base).success, true);
  for (const key of ['hooks', 'PreToolUse', 'PostToolUse', 'updatedInput']) assert.equal(lab07RequestSchema.safeParse({ ...base, [key]: {} }).success, false);
  assert.equal(lab07RequestSchema.safeParse({ ...base, mode: 'live', scenario: 'hang' }).success, false);
});

test('pipeline distinguishes executed, denied, rewritten, failed and path-rejected calls by actual file effect', async () => {
  const sandbox = await fixture();
  try {
    const run = (id: string, name: string, raw: unknown, policy: Lab07Policy, forceException = false) => executePolicy({ id, name, raw, policy, sandbox, timeoutMs: 1000, signal, forceException });
    const safe = await run('sevt_1', 'edit_file', { path: '/workspace/draft.md', oldText: 'draft', newText: 'reviewed' }, 'audit-only');
    assert.deepEqual([safe.decision, safe.validation, safe.outcome, safe.handlerRan], ['allow', 'passed', 'executed', true]);
    assert.match(await sandbox.readText('workspace/draft.md'), /reviewed/);
    const denied = await run('sevt_2', 'edit_file', { path: '/workspace/protected.md', oldText: 'locked', newText: 'changed' }, 'deny-write');
    assert.deepEqual([denied.decision, denied.outcome, denied.handlerRan, denied.before === denied.after], ['deny', 'denied', false, true]);
    assert.match(await sandbox.readText('workspace/protected.md'), /locked/);
    const rewritten = await run('sevt_3', 'write_file', { path: '/workspace/proposed.md', content: 'rewritten' }, 'rewrite-input');
    assert.deepEqual([rewritten.decision, rewritten.validation, rewritten.outcome], ['rewrite', 'revalidated', 'executed']);
    assert.match(rewritten.effectiveInput!, /draft\.md/); assert.equal(await sandbox.readText('workspace/draft.md'), 'rewritten');
    await assert.rejects(sandbox.readText('workspace/proposed.md'));
    const failed = await run('sevt_4', 'write_file', { path: '/workspace/draft.md', content: 'must not land' }, 'audit-only', true);
    assert.deepEqual([failed.decision, failed.outcome, failed.handlerRan, failed.before === failed.after], ['allow', 'failed', true, true]);
    const escaped = await run('sevt_5', 'write_file', { path: '/workspace/../secret.md', content: 'x' }, 'audit-only');
    assert.deepEqual([escaped.decision, escaped.outcome, escaped.handlerRan], ['deny', 'denied', false]); assert.match(escaped.reason, /traversal/i);
    const invalid = await run('sevt_6', 'edit_file', { path: '/workspace/draft.md', oldText: 3, newText: 'x' }, 'audit-only');
    assert.deepEqual([invalid.validation, invalid.handlerRan], ['rejected', false]);
  } finally { await sandbox.dispose(); }
});

async function run(policy: Lab07Policy, scenario: Lab07Request['scenario'] = 'normal') {
  const request: Lab07Request = { mode: 'scripted', policy, scenario, prompt: lab07Prompt, deadlineSeconds: 10, handlerTimeoutMs: 1000 };
  const sandbox = await fixture(); const port = createFixtureLab07Port(lab07RequestSchema.parse(request), 0); const frames: unknown[] = [];
  const result = await runLab07(request, port, sandbox, randomUUID(), signal, (frame) => frames.push(frame), 20);
  return { sandbox, port, result, frames };
}

test('runner sends one result per sevt ID and repeated events never execute twice', async () => {
  const normal = await run('deny-write'); try { assert.equal(normal.result.audits.length, 1); assert.equal(normal.result.resultsSent, 1);
    assert.equal(normal.result.audits[0]!.outcome, 'denied'); assert.deepEqual(normal.port.calls.filter((c) => c.startsWith('respond')), ['respond:sevt_lab07_call_1']);
  } finally { await normal.sandbox.dispose(); }
  const repeated = await run('audit-only', 'repeated-call'); try { assert.equal(repeated.result.audits.length, 1); assert.equal(repeated.result.resultsSent, 1);
    assert.equal(repeated.result.outcome.kind, 'completed');
  } finally { await repeated.sandbox.dispose(); }
});

test('handler exception is audited as failed and leaves the file unchanged', async () => {
  const value = await run('audit-only', 'handler-exception'); try { const audit = value.result.audits[0]!;
    assert.deepEqual([audit.decision, audit.outcome, audit.handlerRan, audit.before === audit.after], ['allow', 'failed', true, true]);
    assert.match(audit.result.text, /Authored handler exception/); assert.match(await value.sandbox.readText('workspace/draft.md'), /Status: draft/);
  } finally { await value.sandbox.dispose(); }
});

test('cancellation interrupts a hanging fixture and retains the audited file evidence', async () => {
  const request: Lab07Request = { mode: 'scripted', policy: 'audit-only', scenario: 'hang', prompt: lab07Prompt, deadlineSeconds: 10, handlerTimeoutMs: 1000 };
  const sandbox = await fixture(); const port = createFixtureLab07Port(lab07RequestSchema.parse(request), 0); const controller = new AbortController();
  try { const pending = runLab07(request, port, sandbox, randomUUID(), controller.signal, () => {}, 20);
    for (let i = 0; i < 40 && !port.calls.some((call) => call.startsWith('respond:')); i++) await delay(10);
    controller.abort('test'); const result = await pending; assert.equal(result.outcome.kind, 'cancelled'); assert.equal(port.calls.includes('interrupt'), true);
    assert.equal(result.audits.length, 1); assert.match(await sandbox.readText('workspace/draft.md'), /reviewed/);
  } finally { await sandbox.dispose(); }
});

function sseResult(text: string) {
  for (const block of text.split('\n\n')) if (/^event: result$/m.test(block)) {
    const data = block.split('\n').filter((line) => line.startsWith('data: ')).map((line) => line.slice(6)).join('\n'); return JSON.parse(data) as { runId: string; outcome: { kind: string } };
  }
  return null;
}

test('HTTP route rejects SDK hooks, streams a run and returns actual file evidence', async () => {
  const lab = createLab07Router({ fixtureStepMs: 0 }); const app = express(); app.use('/api/c7', lab.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string'); const root = `http://127.0.0.1:${address.port}/api/c7`;
  const post = (body: unknown) => fetch(`${root}/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const invalid = await post({ mode: 'scripted', policy: 'audit-only', scenario: 'normal', prompt: lab07Prompt, deadlineSeconds: 10, hooks: {} });
    assert.equal(invalid.status, 400); assert.match((await invalid.json() as { error: { message: string } }).error.message, /Agent SDK hook fields/);
    const response = await post({ mode: 'scripted', policy: 'rewrite-input', scenario: 'normal', prompt: lab07Prompt, deadlineSeconds: 10 });
    assert.equal(response.status, 200); const result = sseResult(await response.text()); assert.equal(result?.outcome.kind, 'completed');
    const file = await fetch(`${root}/file?runId=${result!.runId}&name=draft.md`); assert.equal(file.status, 200); assert.match(await file.text(), /rewritten through policy/);
    assert.equal((await fetch(`${root}/file?runId=${result!.runId}&name=proposed.md`)).status, 404);
  } finally { await lab.close(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});

