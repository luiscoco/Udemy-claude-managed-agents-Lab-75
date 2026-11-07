// One bounded existing-agent live control for each local Lab 56-60 exercise.
// node --env-file=<student-clone>/.env --import tsx scripts/live-labs/operations-live.ts 56
import { z } from 'zod';
import type { AgentCreateParams } from '@anthropic-ai/sdk/resources/beta/agents';
import {demo,textOf,type Event} from './session-demo.js';
import {initialTeamState,reduceTeam} from '../../server/teams/lab56.js';
import {runWorktreeScenario} from '../../server/worktrees/lab57.js';
import {tools as catalog,searchCatalog,invokeCatalogTool} from '../../server/tool-search/lab58.js';
import {resolveReport,tasks} from '../../server/routing/lab59.js';
import {DurableStore,effectKey} from '../../server/durable/lab60.js';
import {lab60ToolSchemas} from '../../shared/lab60-durable-agents.js';

const lab=Number(process.argv[2]);
if(!Number.isInteger(lab)||lab<56||lab>60)throw Error('Choose Lab 56 through 60');
const report=(events:Event[])=>events.filter(e=>e.type==='agent.message').map(textOf).join('');
const calls=(events:Event[])=>events.filter(e=>e.type==='agent.custom_tool_use');
function definition(name:string,description:string,shape:z.ZodType):NonNullable<AgentCreateParams['tools']>[number]{
 const {$schema:_,...input_schema}=z.toJSONSchema(shape,{target:'draft-2020-12',io:'input'});
 if(input_schema.type!=='object')throw Error('Custom tool must have an object input schema');
 return {type:'custom',name,description,input_schema:{...input_schema,type:'object'}};
}
if(lab===56){
 const claimed=reduceTeam(initialTeamState(),{type:'claim',actor:'researcher',task:'research'});
 let state=claimed.state,accepted=false;
 const shape=z.strictObject({answer:z.number().int()});
 await demo(lab,'Call complete_research once with the sum requested by the user. The host checks ownership and arithmetic. Do not claim review or team shutdown.',async({turn})=>{
  const events=await turn('Complete the researcher task for 12 + 18 + 7.');
  console.log(`Real completion proposal: calls ${calls(events).length} · host accepted ${accepted} · research ${state.tasks[0]?.state}`);
  console.log(`Review remains ${state.tasks[1]?.state} · verified answer ${state.verifiedAnswer??'none'} · shutdown ${state.shutdown}`);
  console.log('One host-tool sample is not a native thread mailbox or a multi-worker execution.');
  if(calls(events).length!==1||!accepted||state.tasks[0]?.state!=='done'||state.verifiedAnswer!==null)throw Error('Team host boundary check failed');
 },[definition('complete_research','Propose completion of the already claimed researcher task. The host independently checks its arithmetic.',shape)],async event=>{
  if(event.name!=='complete_research')return{text:'Unknown tool refused.',isError:true};
  const input=shape.parse(event.input),result=reduceTeam(state,{type:'complete',actor:'researcher',task:'research',answer:input.answer});
  state=result.state;accepted=result.accepted;return{text:JSON.stringify(result),isError:!result.accepted};
 });
}else if(lab===57){
 const fixture=runWorktreeScenario('serial-integration');
 if(fixture.integration!=='passed'||!fixture.combinedTestsPassed)throw Error('Local Git baseline failed');
 console.log(`Real local Git baseline: integration ${fixture.integration} · combined tests ${fixture.combinedTestsPassed} · branches preserved ${fixture.branchesPreserved} · provider calls 0`);
 let inspected=0;
 await demo(lab,'Call inspect_worker_evidence exactly once before reporting. Return JSON only with integration and combinedTestsPassed, using the host evidence. Do not modify files or claim you ran the workers.',async({turn})=>{
  const events=await turn('Inspect the local fixture host evidence and report its integration outcome.');
  const result=z.strictObject({integration:z.literal('passed'),combinedTestsPassed:z.literal(true)}).parse(JSON.parse(report(events)));
  console.log(`Real model evidence inspection: calls ${inspected} · closed report valid true · integration ${result.integration}`);
  console.log('The host ran real Git with authored edits. The model inspected evidence; it did not author or execute these worker edits.');
  if(inspected!==1||calls(events).length!==1)throw Error('Expected one evidence inspection');
 },[definition('inspect_worker_evidence','Read host-verified worker paths, tests and integration evidence. This read-only call runs no worker.',z.strictObject({}))],async event=>{
  if(event.name!=='inspect_worker_evidence')return{text:'Unknown tool refused.',isError:true};
  z.strictObject({}).parse(event.input);inspected++;
  return{text:JSON.stringify({integration:fixture.integration,combinedTestsPassed:fixture.combinedTestsPassed,workers:fixture.workers,branchesPreserved:fixture.branchesPreserved}),isError:false};
 });
}else if(lab===58){
 const found=searchCatalog({query:'refund invoice INV-2042',variant:'good',limit:5});
 const chosen=catalog.find(t=>t.name==='billing_refund_invoice')!;
 if(!found.results.some(t=>t.name===chosen.name))throw Error('Catalog did not find refund definition');
 console.log(`Host discovery: ${found.results.length} returned definitions · selected ${chosen.name} · provider calls 0`);
 let refused=0;
 await demo(lab,'For this controlled authorization demonstration, call billing_refund_invoice exactly once using the requested invoice and integer cents. Respect a host refusal and do not retry or claim money was issued.',async({turn})=>{
  const events=await turn('Request 1250 cents for invoice INV-2042.');
  console.log(`Real discovered-tool proposal: calls ${calls(events).length} · trusted-host refusals ${refused} · fictional refund effects 0`);
  console.log('The host explicitly registered one discovered definition for this session. Search itself neither registered tools nor granted authority.');
  if(refused!==1||calls(events).length!==1)throw Error('Expected one denied catalog request');
 },[definition(chosen.name,chosen.description,chosen.schema)],async event=>{
  if(event.name!==chosen.name)return{text:'Unknown tool refused.',isError:true};
  const result=invokeCatalogTool({scenario:'unauthorized',name:chosen.name,input:event.input},'walkthrough-live');
  if(!result.accepted&&result.effect==='none')refused++;
  return{text:JSON.stringify(result),isError:!result.accepted};
 });
}else if(lab===59){
 const task=tasks[0]!;
 await demo(lab,'Return only JSON with answer as a string and confidence as a number between zero and one. No tools.',async({turn})=>{
  const events=await turn(task.question),checked=resolveReport(task.id,report(events));
  console.log(`Real answer check: closed report valid ${checked.valid} · host key correct ${checked.correct}`);
  console.log('One actual existing-agent session was observed. Seven-strategy costs, latency and rankings remain authored offline assumptions.');
  if(!checked.valid||!checked.correct)throw Error('Real arithmetic report failed host key');
 });
}else{
 const owner='walkthrough-live',store=new DurableStore('artifacts/walkthrough-lab60-live');
 const crashed=store.start(owner,'crash-after-third'),key=effectKey(crashed.jobId,'ITEM-03');
 let refused=0;
 console.log(`Persisted crash: effects ${crashed.ledger.length} · journaled ${crashed.journalKeys.length} · provider calls 0`);
 const tool=definition('record_refund_effect','Propose a fictional item refund using its exact stable business key. The host enforces policy, running state and lease.',lab60ToolSchemas.record_refund_effect);
 await demo(lab,'For this controlled host-state demonstration, call record_refund_effect exactly once with the user supplied item and exact effect key. Respect a refusal and do not retry or claim a new refund.',async({turn})=>{
  const events=await turn(`Propose recording ITEM-03 with effect key ${key}.`);
  const unchanged=store.snapshot(crashed.jobId,owner);
  console.log(`Real model proposal: calls ${calls(events).length} · host refusals ${refused} · ledger effects ${unchanged.ledger.length}`);
  if(calls(events).length!==1||refused!==1||unchanged.ledger.length!==3)throw Error('Crashed-state guard failed');
  const recovered=store.recover(crashed.jobId,owner,'journal-idempotency');
  console.log(`Host recovery: state ${recovered.state} · effects ${recovered.ledger.length} · duplicates ${recovered.duplicates} · suppressed ${recovered.suppressed.length}`);
  console.log('The local fictional ledger and business keys govern effects. No actual payment was sent; the model did not override the crashed job state.');
  if(recovered.state!=='done'||recovered.duplicates!==0||recovered.ledger.length!==5)throw Error('Idempotent host recovery failed');
 },[tool],async event=>{
  const result=store.handleTool(owner,crashed.jobId,event.id,event.name,event.input);
  if(result.is_error)refused++;
  return{text:result.content.map(b=>b.text).join(' '),isError:result.is_error};
 });
}
