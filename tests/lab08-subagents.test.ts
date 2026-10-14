import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import { createFixtureLab08Port, lab08MultiagentConfig } from '../server/lib/lab08-port.js';
import { runLab08 } from '../server/lib/lab08-run.js';
import { createLab08Router } from '../server/concepts/08-subagents.js';
import { lab08Prompt, lab08RequestSchema } from '../shared/lab08-subagents.js';
import type { Lab08Request, Lab08Scenario } from '../shared/lab08-subagents.js';

const request = (scenario: Lab08Scenario = 'normal'): Lab08Request => ({ mode: 'scripted', prompt: lab08Prompt, scenario, deadlineSeconds: 10 });

test('pinned SDK multiagent configuration uses predefined agents and disables dynamic paths', () => {
  const config = lab08MultiagentConfig(['agent_research', 'agent_review', 'agent_calc']);
  assert.deepEqual(config, { type: 'multiagent_20261001', advisor: { type: 'disabled' }, subagents: { type: 'enabled', inline_agents: { type: 'disabled' },
    predefined_agents: [{ type: 'agent', id: 'agent_research' }, { type: 'agent', id: 'agent_review' }, { type: 'agent', id: 'agent_calc' }] }, workflows: { type: 'disabled' } });
});

test('strict request rejects Agent SDK delegation fields and fixture-only live scenarios', () => {
  assert.equal(lab08RequestSchema.safeParse(request()).success, true);
  for (const key of ['agents', 'Agent', 'parent_tool_use_id']) assert.equal(lab08RequestSchema.safeParse({ ...request(), [key]: {} }).success, false);
  assert.equal(lab08RequestSchema.safeParse({ ...request('hang'), mode: 'live' }).success, false);
});

test('fixture correlates independent threads and verifies denied write and arithmetic effects', async () => {
  const input = lab08RequestSchema.parse(request()); const frames: unknown[] = []; const result = await runLab08(input, createFixtureLab08Port(0), randomUUID(), new AbortController().signal, (frame) => frames.push(frame));
  assert.equal(result.threads.length, 4); assert.deepEqual(result.states, ['delegated', 'report-received', 'verified']);
  assert.equal(new Set(result.threads.map((item) => item.threadId)).size, 4); assert.equal(result.effects.find((e) => e.role === 'reviewer')?.handlerRan, false);
  assert.match(result.effects.find((e) => e.role === 'calculator')!.effect, /42/); assert.equal(result.outcome, 'completed'); assert.ok(frames.length >= 10);
});

test('wrong-role and duplicate scenarios record host decisions without claiming parallelism', async () => {
  const wrong = await runLab08(lab08RequestSchema.parse(request('wrong-role')), createFixtureLab08Port(0), randomUUID(), new AbortController().signal, () => {});
  assert.equal(wrong.effects.find((e) => e.id === 'sevt_wrong_role')?.decision, 'denied');
  const duplicate = await runLab08(lab08RequestSchema.parse(request('duplicate-events')), createFixtureLab08Port(0), randomUUID(), new AbortController().signal, () => {});
  assert.equal(duplicate.duplicatesIgnored, 2); assert.match(duplicate.message, /Thread history is not filesystem isolation/);
});

test('cancellation stops hanging child activity through the interrupt boundary', async () => {
  const controller = new AbortController(); const pending = runLab08(lab08RequestSchema.parse(request('hang')), createFixtureLab08Port(0), randomUUID(), controller.signal, () => {});
  await delay(20); controller.abort('test'); const result = await pending; assert.equal(result.outcome, 'cancelled'); assert.equal(result.interruption, 'simulated'); assert.equal(result.threads[0]?.status, 'stopped');
});

function resultFrom(text: string) { for (const block of text.split('\n\n')) if (/^event: result$/m.test(block)) return JSON.parse(block.split('\n').filter((line) => line.startsWith('data: ')).map((line) => line.slice(6)).join('\n')) as { outcome:string; threads:unknown[] }; return null; }
test('HTTP route exposes roster, rejects SDK fields and streams the delegation result', async () => {
  const lab = createLab08Router({ fixtureStepMs: 0 }); const app = express(); app.use('/api/c8', lab.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string'); const root = `http://127.0.0.1:${address.port}/api/c8`;
  try { const agents = await fetch(`${root}/agents`); assert.equal(agents.status, 200); assert.equal((await agents.json() as { agents:unknown[] }).agents.length, 3);
    const invalid = await fetch(`${root}/query`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...request(), Agent:{} }) }); assert.equal(invalid.status, 400); assert.match(await invalid.text(), /Agent SDK fields/);
    const response = await fetch(`${root}/query`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(request('cross-posted-call')) }); assert.equal(response.status, 200);
    const result = resultFrom(await response.text()); assert.equal(result?.outcome, 'completed'); assert.equal(result?.threads.length, 4);
  } finally { await lab.close(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});
