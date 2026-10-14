import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lab10JsonSchema, lab10Prompt, lab10ReportSchema, lab10RequestSchema, lab10SendSchema } from '../shared/lab10-structured-interrupt.js';
import { createFixtureLab10Port, createLiveLab10Port, fixtureLab10Report } from '../server/lib/lab10-port.js';
import { Lab10Error, Lab10Runs, validateLab10Text } from '../server/lib/lab10-run.js';
import { createLab10Router } from '../server/concepts/10-structured-interrupt.js';
import type { Lab10Entry } from '../server/lib/lab10-run.js';

const input=lab10RequestSchema.parse({mode:'scripted',prompt:lab10Prompt,scenario:'valid',deadlineSeconds:10});
const signal=new AbortController().signal;
async function started(scenario:typeof input.scenario='valid'){const runs=new Lab10Runs(2,0);const request={...input,scenario};const port=createFixtureLab10Port(request,0);const entry=await runs.create('alice',request,port);return{runs,entry,request,port};}
async function waitRunning(e:Lab10Entry){for(let i=0;i<100;i++){if(e.turns[0]?.state === 'running')return;await delay(2);}throw new Error('Not running');}

test('closed report schema generates exact JSON Schema and rejects invalid final text',()=>{
  assert.equal(lab10JsonSchema.additionalProperties,false);assert.deepEqual(lab10JsonSchema.required,['project','summary','risks','nextSteps']);
  assert.deepEqual(validateLab10Text(JSON.stringify(fixtureLab10Report)).report,fixtureLab10Report);
  for(const text of ['not JSON',JSON.stringify({...fixtureLab10Report,unexpected:true}),JSON.stringify({...fixtureLab10Report,nextSteps:[]}),JSON.stringify({...fixtureLab10Report,summary:3})])assert.equal(validateLab10Text(text).report,null);
  assert.equal(lab10ReportSchema.safeParse(fixtureLab10Report).success,true);
});
test('request rejects invented native output fields and send is a closed contract',()=>{
  for(const field of ['outputFormat','structured_output','result.structured_output','maxTurns'])assert.equal(lab10RequestSchema.safeParse({...input,[field]:{}}).success,false);
  assert.equal(lab10RequestSchema.safeParse({...input,mode:'live',scenario:'hang'}).success,false);
  assert.equal(lab10SendSchema.safeParse({...input,runId:crypto.randomUUID()}).success,true);
});
test('valid, corrected, invalid and exhausted outcomes require actual schema validation',async()=>{
  for(const [scenario,correctiveRound,outcome,attempts] of [['valid',true,'verified',1],['corrected',true,'verified',2],['invalid',false,'invalid',1],['exhausted',true,'exhausted',2]] as const){
    const value=await started(scenario);try{const frames:unknown[]=[];await value.runs.enqueue(value.entry,{...value.request,correctiveRound},signal,(f)=>frames.push(f)).work;
      const result=value.runs.snapshot(value.entry);assert.equal(result.turns[0]?.outcome,outcome);assert.equal(result.turns[0]?.attempts,attempts);assert.equal(result.turns[0]?.reportedUsage,null);
      assert.equal(!!result.turns[0]?.report,outcome === 'verified');assert.equal(value.port.calls.filter((c)=>c === 'send').length,attempts);assert.equal(result.state,'idle');assert.ok(frames.length>2);
    }finally{await value.runs.close();}}
});
test('interrupt observes idle, retains the same session and accepts another turn',async()=>{
  const value=await started('hang');try{const work=value.runs.enqueue(value.entry,value.request,signal,()=>{}).work;await waitRunning(value.entry);await delay(5);
    const before=value.entry.session.id;const stopped=await value.runs.stop(value.entry,false);await work;
    assert.equal(stopped.interruption,'idle-confirmed');assert.equal(stopped.state,'idle');assert.equal(value.entry.turns[0]?.outcome,'interrupted');assert.equal(value.port.calls.includes('archive'),false);
    await value.runs.enqueue(value.entry,input,signal,()=>{}).work;assert.equal(value.entry.session.id,before);assert.equal(value.entry.turns[1]?.outcome,'verified');
    const closed=await value.runs.end(value.entry);assert.equal(closed.state,'closed');assert.throws(()=>value.runs.enqueue(value.entry,input,signal,()=>{}),/closed/);
    const repeat=await value.runs.end(value.entry);assert.equal(repeat.state,'closed');assert.equal(value.port.calls.filter((c)=>c === 'archive').length,1);
  }finally{await value.runs.close();}
});
test('interrupt acknowledgment without observed idle remains unconfirmed and blocks reuse',async()=>{
  const value=await started('interrupt-unconfirmed');try{const work=value.runs.enqueue(value.entry,value.request,signal,()=>{}).work;await waitRunning(value.entry);await delay(5);
    const stopped=await value.runs.stop(value.entry,false);await work;assert.equal(stopped.interruption,'unconfirmed');assert.equal(stopped.state,'cleanup-pending');
    assert.throws(()=>value.runs.enqueue(value.entry,input,signal,()=>{}),/cleanup/);const aborted=await value.runs.stop(value.entry,true);assert.equal(aborted.cleanup,'pending');assert.equal(value.port.calls.includes('archive'),false);
  }finally{await value.runs.close();}
});
test('local abort initiates remote cleanup and send queue has a hard bound',async()=>{
  const value=await started('hang');try{const controller=new AbortController();const a=value.runs.enqueue(value.entry,value.request,controller.signal,()=>{});await waitRunning(value.entry);
    const b=value.runs.enqueue(value.entry,input,signal,()=>{});const c=value.runs.enqueue(value.entry,input,signal,()=>{});
    assert.equal(value.runs.snapshot(value.entry).queueDepth,2);assert.throws(()=>value.runs.enqueue(value.entry,input,signal,()=>{}),/queue is full/);
    controller.abort();await Promise.all([a.work,b.work,c.work]);for(let i=0;i<30 && value.entry.state !== 'closed';i++)await delay(5);
    assert.equal(value.entry.state,'closed');assert.equal(value.port.calls.includes('interrupt'),true);assert.equal(value.port.calls.filter((c)=>c === 'send').length,1);
  }finally{await value.runs.close();}
});
test('run lookup enforces owner, unknown IDs, capacity and expiry',async()=>{
  let now=0;const runs=new Lab10Runs(1,0,()=>now);const e=await runs.create('alice',input,createFixtureLab10Port(input,0));
  try{assert.throws(()=>runs.read(e.runId,'bob'),(error:unknown)=>error instanceof Lab10Error && error.status === 403);assert.throws(()=>runs.read(crypto.randomUUID(),'alice'),/Unknown/);
    await assert.rejects(runs.create('alice',input,createFixtureLab10Port(input,0)),/Close an existing/);now=16*60_000;await runs.sweep();assert.equal(e.state,'closed');
  }finally{await runs.close();}
});
test('deadline interrupts and cleans up without accepting a report',async()=>{
  const value=await started('hang');try{await value.runs.enqueue(value.entry,{...value.request,deadlineSeconds:1},signal,()=>{}).work;
    assert.equal(value.entry.turns[0]?.outcome,'deadline');assert.equal(value.entry.turns[0]?.report,null);assert.equal(value.entry.state,'closed');
  }finally{await value.runs.close();}
});
test('shutdown waits for in-flight creation and archives the returned idle session',async()=>{
  const runs=new Lab10Runs(1,0);const fixture=createFixtureLab10Port(input,0);let release!:()=>void;const gate=new Promise<void>((resolve)=>{release=resolve;});
  const pending=runs.create('alice',input,{...fixture,async create(){await gate;return fixture.create();}});const closing=runs.close();release();const entry=await pending;await closing;
  assert.equal(entry.state,'closed');assert.equal(fixture.calls.includes('archive'),true);assert.throws(()=>runs.enqueue(entry,input,signal,()=>{}),/closed/);
});
test('installed SDK creates text-only override, sends interrupt alone, polls idle and archives',async()=>{
  const env={MANAGED_LIVE_ENABLED:'true',ANTHROPIC_API_KEY:'test-only',MANAGED_AGENT_ID:'agent_test',MANAGED_ENVIRONMENT_ID:'env_test'};
  const log:Array<{path:string;body:any}>=[];let status='running';let resolved:any;const base={id:'agent_test',version:1,model:{id:'base-model'},system:'Base.',tools:[],mcp_servers:[],skills:[],multiagent:null};
  const sdk=new Anthropic({apiKey:'offline-only',maxRetries:0,fetch:async(url,init)=>{const path=new URL(String(url)).pathname;const body=typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;log.push({path,body});
    if(path.startsWith('/v1/agents/'))return Response.json(base);if(path === '/v1/sessions')resolved={...base,...body.agent};
    if(body?.events?.[0]?.type === 'user.interrupt')status='idle';
    return Response.json({id:'sesn_test',status,environment_id:'env_test',agent:resolved,budget:{max_list_cost:{amount:'50',currency:'USD'}}});
  }});
  const request={...input,mode:'live' as const};const runs=new Lab10Runs(1,0);const e=await runs.create('alice',request,createLiveLab10Port(request,sdk,env));
  try{const stopped=await runs.stop(e,false);assert.equal(stopped.interruption,'idle-confirmed');await runs.end(e);
    const created=log.find((c)=>c.path === '/v1/sessions')!.body;assert.equal('outputFormat' in created,false);assert.deepEqual([created.agent.tools,created.agent.mcp_servers,created.agent.skills],[[],[],[]]);
    assert.match(created.agent.system,/JSON object/);assert.deepEqual(log.find((c)=>c.body?.events)?.body.events,[{type:'user.interrupt'}]);assert(log.some((c)=>c.path.endsWith('/archive')));
  }finally{await runs.close();}
});
test('HTTP schemas and report stream reject injection and foreign control requests',async()=>{
  const lab=createLab10Router();const app=express();app.use('/api/c10',lab.router);const server=app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert(address && typeof address !== 'string');const root=`http://127.0.0.1:${address.port}/api/c10`;
  const post=(path:string,body:unknown,owner='alice')=>fetch(`${root}/${path}`,{method:'POST',headers:{'Content-Type':'application/json','X-Lab-Owner':owner},body:JSON.stringify(body)});
  try{assert.equal((await fetch(`${root}/schemas`)).status,200);assert.equal((await post('structured',{...input,outputFormat:{}})).status,400);
    const response=await post('structured',input);assert.equal(response.status,200);const text=await response.text();assert.match(text,/"outcome":"verified"/);
    const id=/"runId":"([^"]+)"/.exec(text)![1]!;assert.equal((await post('interrupt',{runId:id},'bob')).status,403);
    assert.equal((await post('interrupt',{runId:crypto.randomUUID()})).status,404);const end=await post('end',{runId:id});assert.equal(end.status,200);
    assert.equal((await post('send',{...input,runId:id})).status,409);
    const disconnected=new AbortController();const hanging=await fetch(`${root}/run`,{method:'POST',headers:{'Content-Type':'application/json','X-Lab-Owner':'alice'},body:JSON.stringify({...input,scenario:'hang'}),signal:disconnected.signal});
    const reader=hanging.body!.getReader();let wire='';for(let i=0;i<10 && !/"runId":"([^"]+)"/.test(wire);i++){const chunk=await reader.read();if(chunk.done)break;wire+=new TextDecoder().decode(chunk.value);}
    const disconnectedId=/"runId":"([^"]+)"/.exec(wire)![1]!;disconnected.abort();
    const disconnectedEntry=lab.runs.read(disconnectedId,'alice');for(let i=0;i<100 && disconnectedEntry.state !== 'closed';i++)await delay(5);
    assert.equal(disconnectedEntry.state,'closed');assert.equal(disconnectedEntry.turns[0]?.outcome,'aborted');assert.equal(disconnectedEntry.cleanup,'simulated');
  }finally{await lab.close();server.closeAllConnections();await new Promise<void>((resolve)=>server.close(()=>resolve()));}
});
test('live creation failures report safe connection and access diagnostics before streaming',async()=>{
  for(const [error,status,expected] of [
    [new Anthropic.APIConnectionError({cause:new Error('secret-provider-detail')}),503,/could not reach Anthropic/],
    [new Anthropic.PermissionDeniedError(403,{error:{message:'secret-provider-detail'}},'secret-provider-detail',new Headers()),422,/inaccessible/],
  ] as const){
    const lab=createLab10Router({live:()=>({...createFixtureLab10Port(input,0),async create(){throw error;}})});
    const app=express();app.use('/api/c10',lab.router);const server=app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert(address && typeof address !== 'string');
    try{const response=await fetch(`http://127.0.0.1:${address.port}/api/c10/structured`,{method:'POST',headers:{'Content-Type':'application/json','X-Lab-Owner':'alice'},body:JSON.stringify({...input,mode:'live'})});
      assert.equal(response.status,status);const body=await response.text();assert.match(body,expected);assert.doesNotMatch(body,/secret-provider-detail/);assert.equal(lab.runs.entries.size,0);
    }finally{await lab.close();server.closeAllConnections();await new Promise<void>((resolve)=>server.close(()=>resolve()));}
  }
});
