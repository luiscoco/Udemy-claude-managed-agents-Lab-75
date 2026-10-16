import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lab09Question, lab09RequestSchema, lab09Variants } from '../shared/lab09-system-prompts.js';
import { composeLab09, lab09ProjectContext } from '../server/lib/lab09-composer.js';
import { createFixtureLab09Port, createLiveLab09Port, lab09SessionParams } from '../server/lib/lab09-port.js';
import { runLab09 } from '../server/lib/lab09-run.js';
import { createLab09Router } from '../server/concepts/09-system-prompts.js';

const input = { mode: 'scripted' as const, variant: 'base' as const, prompt: lab09Question, deadlineSeconds: 10 };
const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test', MANAGED_AGENT_VERSION: '3' };
test('host composer exactly preserves, replaces and appends to base instructions', () => {
  const base = 'Base.'; assert.equal(composeLab09(input, base).overrideIncluded, false);
  assert.equal(composeLab09({ ...input, variant: 'custom', customSystem: 'Replacement.' }, base).configuredSystem, 'Replacement.');
  assert.equal(composeLab09({ ...input, variant: 'base-plus-append', append: 'Append.' }, base).configuredSystem, 'Base.\n\nAppend.');
  const context = composeLab09({ ...input, variant: 'base-plus-project-context' }, base);
  assert.equal(context.configuredSystem, `Base.\n\nExplicit host-selected project context (fictional/CLAUDE.md; aurora-finch-v1):\n${lab09ProjectContext.text}`);
  assert.equal(context.contextSource, 'authored-host-selection'); assert.equal(composeLab09(input, null).configuredSystem, null);
  assert.throws(() => composeLab09(input, 'x'.repeat(5001)), /bounds/);
});
test('strict contract rejects presets, untrusted project text and privileged event injection', () => {
  for (const key of ['systemPrompt', 'settings', 'claude_code', 'SYSTEM_PROMPT_DYNAMIC_BOUNDARY', 'projectText', 'projectPath', 'system.message'])
    assert.equal(lab09RequestSchema.safeParse({ ...input, [key]: 'injected' }).success, false);
  assert.equal(lab09RequestSchema.safeParse({ ...input, contextId: '../../CLAUDE.md' }).success, false);
  assert.equal(lab09RequestSchema.safeParse({ ...input, mode: 'live', scenario: 'cancel' }).success, false);
});
test('parameter builder pins agent version, preserves model and clears inherited capabilities', () => {
  for (const variant of lab09Variants) { const params = lab09SessionParams({ ...input, variant }, { id: 'agent_test', version: 3, system: 'Base.' }, env);
    const agent = params.agent; assert(agent && typeof agent !== 'string' && agent.type === 'agent_with_overrides');
    assert.equal(agent.id, 'agent_test'); assert.equal(agent.version, 3); assert.equal(Object.hasOwn(agent, 'model'), false);
    assert.deepEqual([agent.tools, agent.mcp_servers, agent.skills], [[], [], []]); assert.equal(Object.hasOwn(agent, 'system'), variant !== 'base'); }
});
test('comparison fixtures use fresh sessions and identical question with no invented usage', async () => {
  const ids = new Set<string>();
  for (const variant of lab09Variants) { const request = { ...input, variant }; const result = await runLab09(request, createFixtureLab09Port(request, 0), new AbortController().signal, () => {}, 10);
    assert.equal(result.outcome.kind, 'completed'); assert.equal(result.reportedUsage, null); assert.equal(result.requested.prompt, lab09Question); ids.add(result.sessionId!);
    assert.equal(result.effective?.system, result.composition?.configuredSystem); assert.equal(result.cleanup, 'simulated'); assert.match(result.messages[0]!.text, /Authored fixture/); }
  assert.equal(ids.size, 4);
});
test('cancellation and deadline use the shared interrupt and cleanup boundary', async () => {
  const controller = new AbortController(); const request = { ...input, scenario: 'cancel' as const }; const fixture = createFixtureLab09Port(request, 0); let interrupted = false;
  const port = { ...fixture, async interrupt(id: string) { interrupted = true; await fixture.interrupt(id); } };
  const pending = runLab09(request, port, controller.signal, () => {}, 10); await delay(30); controller.abort(); const result = await pending;
  assert.equal(result.outcome.kind, 'cancelled'); assert.equal(interrupted, true); assert.equal(result.interruption, 'simulated');
  const deadline = { ...input, scenario: 'deadline' as const, deadlineSeconds: 1 };
  assert.equal((await runLab09(deadline, createFixtureLab09Port(deadline, 0), new AbortController().signal, () => {}, 10)).outcome.kind, 'deadline');
});

test('real SDK transport observes exact overrides, version pin, stream ordering and measured usage', async () => {
  for (const variant of lab09Variants) { const log: Array<{path:string; method:string; body:any}> = [];
    const base = { id: 'agent_test', version: 3, model: { id: 'account-base-model' }, system: 'Base.', tools: [{type:'custom',name:'unwanted'}], mcp_servers: [{name:'unwanted'}], skills: [{id:'unwanted'}], multiagent: null };
    let resolved = structuredClone(base);
    const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
      const path = new URL(String(url)).pathname; const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined; log.push({path,method:init?.method ?? 'GET',body});
      if (path.startsWith('/v1/agents/')) return Response.json(base);
      if (path === '/v1/sessions' && init?.method === 'POST') resolved = { ...base, ...body.agent, model: base.model, system: Object.hasOwn(body.agent,'system') ? body.agent.system : base.system };
      if (path.endsWith('/events/stream')) { const at = '2026-01-01T00:00:00Z'; const span = {type:'span.model_request_end',id:'span1',processed_at:at,model_request_start_id:'start1',is_error:false,model_usage:{input_tokens:9,output_tokens:4,cache_creation_input_tokens:0,cache_read_input_tokens:0}};
        const events = [{type:'agent.message',id:'m1',processed_at:at,content:[{type:'text',text:'Observed answer'}]},span,span,{type:'session.status_idle',id:'idle1',processed_at:at,stop_details:null,stop_reason:{type:'end_turn'}}];
        return new Response(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''),{headers:{'Content-Type':'text/event-stream'}}); }
      return Response.json({id:'sesn_test',status:'idle',environment_id:'env_test',agent:resolved,budget:{type:'limit',max_list_cost:{amount:'50',currency:'USD'}}});
    } });
    const request = {...input,variant,mode:'live' as const}; const result = await runLab09(request, createLiveLab09Port(request,sdk,env),new AbortController().signal,()=>{},10);
    assert.equal(result.outcome.kind,'completed'); assert.equal(result.effective?.model,'account-base-model'); assert.equal(result.effective?.system,result.composition?.configuredSystem);
    assert.equal(result.reportedUsage?.requests,1); assert.equal(result.reportedUsage?.inputTokens,9); assert.equal(result.cleanup,'archived');
    const create = log.find((item)=>item.path === '/v1/sessions')!.body; assert.equal(create.agent.version,3); assert.equal(Object.hasOwn(create.agent,'system'),variant !== 'base');
    assert.deepEqual([create.agent.tools,create.agent.mcp_servers,create.agent.skills],[[],[],[]]);
    assert(log.findIndex((item)=>item.path.endsWith('/events/stream')) < log.findIndex((item)=>item.body?.events?.[0]?.type === 'user.message'));
    assert.equal(log.some((item)=>item.path.startsWith('/v1/agents/') && item.method !== 'GET'),false); assert.equal(base.tools.length,1);
  }
});
test('HTTP context is authored and validation rejects injection before provider access', async () => {
  let calls = 0; const lab = createLab09Router((request) => { calls++; return createFixtureLab09Port(request, 0); }, 0);
  const app = express(); app.use('/api/c9',lab.router); const server = app.listen(0,'127.0.0.1'); await once(server,'listening'); const address=server.address(); assert(address && typeof address !== 'string'); const root=`http://127.0.0.1:${address.port}/api/c9`;
  try { const context = await (await fetch(`${root}/context`)).json() as {automaticallyLoaded:boolean}; assert.equal(context.automaticallyLoaded,false);
    const post = (body:unknown) => fetch(`${root}/query`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await post({...input,mode:'live',projectText:'injected'})).status,400); assert.equal(calls,0);
    const response=await post({...input,variant:'base-plus-project-context'}); assert.equal(response.status,200); assert.match(await response.text(),/offline capture|offline observation|offline capture/i);
  } finally { await lab.close(); server.closeAllConnections(); await new Promise<void>((resolve)=>server.close(()=>resolve())); }
});

test('resolved mismatch archives the created session before create rejects and reports pending cleanup', async () => {
  for (const archiveFails of [false, true]) {
    let archived = 0;
    const agent = { id: 'agent_test', version: 3, model: { id: 'base-model' }, system: 'Base.', multiagent: null };
    const sdk = { beta: { agents: { retrieve: async () => agent }, sessions: {
      create: async () => ({ id: 'sesn_mismatch', status: 'idle', agent: { ...agent, model: { id: 'unexpected' }, tools: [], mcp_servers: [], skills: [] } }),
      archive: async () => { archived++; if (archiveFails) throw new Error('Authored transport failure'); },
    } } } as unknown as Anthropic;
    const port = createLiveLab09Port({ ...input, mode: 'live' }, sdk, env);
    await assert.rejects(port.create(), archiveFails ? /cleanup pending/ : /cleanup archived/); assert.equal(archived, 1);
  }
});
