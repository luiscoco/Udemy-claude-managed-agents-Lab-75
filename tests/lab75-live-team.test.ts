import assert from 'node:assert/strict';
import { test } from 'node:test';
import type Anthropic from '@anthropic-ai/sdk';
import { liveTeam, liveTeamReadiness, liveInventory } from '../server/team/live';
import { goodPlan, type RoleContext } from '../server/team/team';
import express from 'express';
import { once } from 'node:events';
import { createLab75Router } from '../server/concepts/75-autonomous-engineering-team';
const env = { MANAGED_LIVE_ENABLED: 'true', LAB75_ANTHROPIC_API_KEY: 'offline', CLAUDE_MANAGED_ENVIRONMENT_ID: 'env_fixture',
  LAB75_PLANNER_AGENT_ID: 'agent_planner', LAB75_PLANNER_AGENT_VERSION: '1', LAB75_DEVELOPER_AGENT_ID: 'agent_developer', LAB75_DEVELOPER_AGENT_VERSION: '2', LAB75_REVIEWER_AGENT_ID: 'agent_reviewer', LAB75_REVIEWER_AGENT_VERSION: '3' };
test('isolated key readiness never accepts shared credentials or exposes values', () => {
  const result = liveTeamReadiness({ ANTHROPIC_API_KEY: 'offline', MANAGED_LIVE_ENABLED: 'true' }); assert.equal(result.ready, false); assert.ok(result.missing.includes('LAB75_ANTHROPIC_API_KEY')); assert.equal(result.providerCalls, 0);
  assert.equal(liveTeamReadiness(env).ready, true); assert.throws(() => liveTeam({}));
  for (const tool of liveInventory('planner')) assert.equal(tool.input_schema.additionalProperties, false);
  assert.equal(liveInventory('planner').some(tool => tool.name === 'write_file'), false);
});
test('wrong pinned role inventory prevents session creation and never sends a prompt', async () => {
  let created = 0;
  const sdk = { beta: { agents: { async retrieve() { return { archived_at: null, multiagent: null, mcp_servers: [], skills: [], tools: [{ type: 'bash' }] }; } }, sessions: { async create() { created++; throw Error(); } } } } as unknown as Anthropic;
  const context: RoleContext = { role: 'planner', root: '.', round: 1, feedback: [], signal: new AbortController().signal, tool: async () => null, record: async () => {} };
  await assert.rejects(liveTeam(env, sdk).plan(context)); assert.equal(created, 0);
});
test('HTTP facts and plan probes never create work; schemas and owner checks run before live setup', async () => {
  const app = express(), instance = createLab75Router(undefined, {}); app.use('/api/c75', instance.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); const address = server.address(); assert.ok(address && typeof address !== 'string'); const root = `http://127.0.0.1:${address.port}/api/c75`;
  const headers = { 'X-Lab-Owner': 'owner', 'Content-Type': 'application/json' };
  try {
    assert.equal((await fetch(`${root}/facts`)).status, 403); const facts = await (await fetch(`${root}/facts`, { headers })).json() as { live: { ready: boolean; providerCalls: number } };
    assert.equal(facts.live.ready, false); assert.equal(facts.live.providerCalls, 0); assert.doesNotMatch(JSON.stringify(facts), /team-holdouts|a'\.repeat/);
    assert.equal((await fetch(`${root}/plan/validate`, { method: 'POST', headers, body: JSON.stringify({ preset: 'cycle' }) })).status, 200);
    for (const body of [{ mode: 'scripted', scenario: 'happy-rework', maxParallel: 4, budgetCents: 30 }, { mode: 'live', scenario: 'happy-rework', maxParallel: 1, budgetCents: 300 }, { command: 'git push' }])
      assert.equal((await fetch(`${root}/runs`, { method: 'POST', headers, body: JSON.stringify(body) })).status, 400);
    const policy = await (await fetch(`${root}/policy`, { method: 'POST', headers, body: JSON.stringify({ role: 'developer', tool: 'write_file', path: '.env', taskId: 'T1' }) })).json() as { allowed: boolean; executed: boolean }; assert.equal(policy.allowed, false); assert.equal(policy.executed, false);
  } finally { await instance.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
test('injected Managed boundary verifies pins, streams before send, correlates report and records cleanup/cost', async () => {
  const calls: string[] = [], records: { type: string; data: unknown }[] = []; let params: unknown; let sent = false, answered = false;
  const agent = { id: 'agent_planner', version: 1, archived_at: null, multiagent: null, mcp_servers: [], skills: [], tools: liveInventory('planner') };
  const session = { id: 'sesn_fixture_team', agent, status: 'idle', environment_id: 'env_fixture', resources: [], vault_ids: [], budget: { max_list_cost: { amount: '30', currency: 'USD' } }, usage: { list_cost: { amount: '1', currency: 'USD' } } };
  const at = '2026-10-16T00:00:00Z';
  const sdk = { beta: { agents: { async retrieve() { calls.push('agent'); return agent; } }, sessions: {
    async create(input: unknown) { calls.push('create'); params = input; return session; }, async retrieve() { calls.push('status'); return session; }, async archive() { calls.push('archive'); return session; },
    events: { async stream() { calls.push('open'); return { controller: new AbortController(), async *[Symbol.asyncIterator]() {
      assert.equal(sent, true); yield { type: 'session.status_running', id: 'sevt_running', processed_at: at };
      yield { type: 'agent.custom_tool_use', id: 'sevt_report', name: 'submit_report', input: goodPlan, processed_at: at };
      yield { type: 'session.status_idle', id: 'sevt_requires', stop_details: null, stop_reason: { type: 'requires_action', event_ids: ['sevt_report'] }, processed_at: at };
      assert.equal(answered, true); yield { type: 'session.status_idle', id: 'sevt_end', stop_details: null, stop_reason: { type: 'end_turn' }, processed_at: at };
    } }; }, async send(_id: string, input: { events: { type: string; custom_tool_use_id?: string }[] }) { if (input.events[0]?.type === 'user.message') { calls.push('send'); sent = true; }
      else if (input.events[0]?.type === 'user.custom_tool_result') { assert.equal(input.events[0].custom_tool_use_id, 'sevt_report'); calls.push('result'); answered = true; } } },
  } } } as unknown as Anthropic;
  const context: RoleContext = { role: 'planner', root: '.', round: 1, feedback: [], signal: new AbortController().signal, tool: async () => { throw Error('Unexpected file effect'); }, record: async (type, data) => { records.push({ type, data }); } };
  const result = await liveTeam(env, sdk).plan(context); assert.deepEqual(result.report, goodPlan); assert.equal(result.costCents, 1); assert.equal(result.source, 'managed-api');
  assert.ok(calls.indexOf('open') < calls.indexOf('send')); assert.ok(calls.includes('archive')); assert.ok(records.some(record => record.type === 'remote-session')); assert.ok(records.some(record => record.type === 'result-send-confirmed'));
  assert.deepEqual((params as { vault_ids: unknown[] }).vault_ids, []); assert.equal((params as { budget: { max_list_cost: { amount: string } } }).budget.max_list_cost.amount, '30');
});
