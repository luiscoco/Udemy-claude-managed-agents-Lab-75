import test from 'node:test';
import assert from 'node:assert/strict';
import {managedReadiness,runManagedTurn,shutdownManagedTurns} from '../managed-runtime.mjs';
const env={ANTHROPIC_API_KEY:'fixture-never-sent',CLAUDE_MANAGED_AGENT_ID:'agent_fixture',CLAUDE_MANAGED_ENVIRONMENT_ID:'env_fixture',MANAGED_LIVE_ENABLED:'true'};
function fixture(stop='end_turn',failCleanup=false){
 const calls=[];let input;
 const client={beta:{sessions:{
  create:async body=>{input=body;calls.push('create');return{id:'sesn_fixture'};},
  events:{stream:async()=>{calls.push('stream');return{controller:new AbortController(),async *[Symbol.asyncIterator](){
   yield{type:'event_start',event:{id:'preview',type:'agent.message'}};
   for(let n=0;n<1000;n++)yield{type:'event_delta',event_id:'preview',delta:{type:'content_delta'}};
   yield{id:'e1',type:'span.model_request_start'};yield{id:'e2',type:'agent.message',content:[{type:'text',text:'Grounded answer.'}]};
   yield{id:'e2',type:'agent.message',content:[{type:'text',text:'Grounded answer.'}]};
   yield{id:'e3',type:'agent.message',session_thread_id:'subthread',content:[{type:'text',text:'Separate thread'}]};
   yield{id:'e4',type:'agent.mcp_tool_use'};yield{id:'e5',type:'session.status_idle',stop_reason:{type:stop}};
  }};},send:async(_id,body)=>{calls.push(body.events[0].type);}},
  retrieve:async()=>{if(failCleanup)throw Error('unavailable');return{status:'idle',usage:{input_tokens:100,output_tokens:20,list_cost:{amount:'2',currency:'USD'}}};},
  archive:async()=>{calls.push('archive');}
 }}};
 return{client,calls,get input(){return input;}};
}
test('Managed readiness requires credentials, agent, environment and explicit live flag',()=>{
 assert.equal(managedReadiness(env).liveAvailable,true);assert.equal(managedReadiness({...env,MANAGED_LIVE_ENABLED:'false'}).liveAvailable,false);
 assert.equal(managedReadiness({...env,CLAUDE_MANAGED_AGENT_ID:''}).liveAvailable,false);
});
test('Managed session overrides, stream-before-send, deduplication, usage and archive are real protocol operations',async()=>{
 const fake=fixture();const result=await runManagedTurn({prompt:'Explain events',system:'Patient tutor',maxBudgetUsd:.2,eventLimit:10},{client:fake.client,env});
 assert.deepEqual(fake.calls,['create','stream','user.message','archive']);
 assert.equal(fake.input.agent.type,'agent_with_overrides');assert.equal(fake.input.agent.id,'agent_fixture');assert.deepEqual(fake.input.agent.tools,[]);assert.deepEqual(fake.input.agent.mcp_servers,[]);assert.deepEqual(fake.input.agent.skills,[]);
 assert.deepEqual(fake.input.budget,{type:'limit',max_list_cost:{amount:'20',currency:'USD'}});
 assert.equal(result.answer,'Grounded answer.\n');assert.equal(result.isError,false);assert.equal(result.subtype,'end_turn');assert.equal(result.cleanup,'archived');assert.equal(result.modelCalls,1);assert.equal(result.costUsd,.02);assert.equal(result.mcpToolCalls,1);
});
test('budget pauses retain partial text, interrupt and never claim completion',async()=>{
 const fake=fixture('budget_reached');const result=await runManagedTurn({prompt:'Explain events',system:'Tutor'},{client:fake.client,env});
 assert.equal(result.isError,true);assert.equal(result.subtype,'budget_reached');assert.ok(result.answer);assert.ok(fake.calls.includes('user.interrupt'));assert.equal(result.cleanup,'archived');
});
test('unconfirmed cleanup retains session identity and unknown cost',async()=>{
 const fake=fixture('end_turn',true);const result=await runManagedTurn({prompt:'Explain events',system:'Tutor'},{client:fake.client,env});
 assert.equal(result.cleanup,'pending');assert.equal(result.sessionId,'sesn_fixture');assert.equal(result.costUsd,null);
});
test('local cancellation interrupts the remote session and still archives after confirmed idle',async()=>{
 const fake=fixture();fake.client.beta.sessions.events.stream=async(_id,_params,{signal})=>({controller:new AbortController(),async *[Symbol.asyncIterator](){
  await new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));
 }});
 const result=await runManagedTurn({prompt:'Explain events',system:'Tutor'},{client:fake.client,env,deadlineMs:20});
 assert.equal(result.subtype,'host_cancelled_or_deadline');assert.equal(result.isError,true);assert.ok(fake.calls.includes('user.interrupt'));assert.equal(result.cleanup,'archived');
});
test('project shutdown drains active remote turns before the launcher exits',async()=>{
 const fake=fixture();let streaming=false;
 fake.client.beta.sessions.events.stream=async(_id,_params,{signal})=>({controller:new AbortController(),async *[Symbol.asyncIterator](){
  streaming=true;await new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('stopped')),{once:true}));
 }});
 const work=runManagedTurn({prompt:'Explain events',system:'Tutor'},{client:fake.client,env});
 for(let n=0;!streaming&&n<100;n++)await new Promise(resolve=>setTimeout(resolve,1));
 assert.equal(streaming,true);await shutdownManagedTurns();const result=await work;
 assert.equal(result.subtype,'host_cancelled_or_deadline');assert.equal(result.cleanup,'archived');assert.ok(fake.calls.includes('user.interrupt'));
});
