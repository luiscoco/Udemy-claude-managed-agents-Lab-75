// One existing-agent live control per Lab 63-65. All effects and notifications are fictional/local.
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import type {AgentCreateParams} from '@anthropic-ai/sdk/resources/beta/agents';
import {demo,textOf,type Event} from './session-demo.js';
import {SafeDatabaseStore,lab63ToolShapes} from '../../server/database/lab63.js';
import {createLab64Runner} from '../../server/concepts/64-browser-playwright-mcp.js';
import {Lab65ApprovalStore,lab65ToolDefinition} from '../../server/concepts/65-human-approval.js';
const lab=Number(process.argv[2]);if(![63,64,65].includes(lab))throw Error('Choose Lab 63 through 65');
const calls=(events:Event[])=>events.filter(e=>e.type==='agent.custom_tool_use').length;
const report=(events:Event[])=>events.filter(e=>e.type==='agent.message').map(textOf).join('');
function definition(name:string,description:string,shape:z.ZodType):NonNullable<AgentCreateParams['tools']>[number]{
 const {$schema:_,...input_schema}=z.toJSONSchema(shape,{target:'draft-2020-12',io:'input'});
 if(input_schema.type!=='object')throw Error('Object tool schema required');
 return {type:'custom',name,description,input_schema:{...input_schema,type:'object'}};
}
if(lab===63){
 const owner='walkthrough-live',store=new SafeDatabaseStore(`artifacts/walkthrough-lab63-live/${randomUUID()}`);
 try{
  const session=store.create(owner);
  const foreign=store.handleTool(session.sessionId,owner,'sevt_local_control','read_order',{orderId:'O-B1'});
  if(!foreign.is_error)throw Error('Foreign tenant read was not refused');
  console.log('Local SQLite control: foreign tenant denied · provider calls 0');
  await demo(lab,'Call propose_cancel once for the requested fictional order. A proposal is not a commit. Respect the host result and do not claim the order was cancelled.',async({turn})=>{
   const events=await turn('Propose cancelling order O-A1 because the fictional customer requested cancellation.');
   const before=store.snapshot(session.sessionId,owner),proposal=before.proposals[0];
   console.log(`Real database proposal: calls ${calls(events)} · pending ${before.proposals.length} · order ${before.rows[0]?.status}`);
   console.log(`Connections query-only: read ${before.readQueryOnly} · host write ${before.writeQueryOnly}`);
   if(calls(events)!==1||!proposal||before.rows[0]?.status!=='open'||proposal.status!=='pending')throw Error('Proposal changed database state unexpectedly');
   const decided=store.decision(session.sessionId,owner,proposal.id,'approve');
   console.log(`Separate host decision: ${decided.outcome} · changed rows ${decided.changedRows} · order ${decided.rows[0]?.status}`);
   console.log('The model proposed; the separate host transaction committed. This disposable SQLite exercise is not a production database authorization.');
   if(decided.changedRows!==1||decided.rows[0]?.status!=='cancelled'||!decided.writeQueryOnly)throw Error('Host database transaction failed');
  },[definition('propose_cancel','Propose cancellation for one host-tenant order. A separate host reviewer must decide; this tool never commits cancellation.',lab63ToolShapes.propose_cancel)],async event=>{
   const result=store.handleTool(session.sessionId,owner,event.id,event.name,event.input);
   return{text:result.content.map(b=>b.text).join(' '),isError:result.is_error};
  });
 }finally{store.close();}
}else if(lab===64){
 const owner='walkthrough-live',runner=createLab64Runner();let inspected=0;
 let host:Awaited<ReturnType<typeof runner.run>>|undefined;
 try{
  await demo(lab,'Call inspect_local_fixture once. Return JSON only with product, price and verified using the host result. This host adapter is a separate connection from the cloud Managed session.',async({turn})=>{
   const events=await turn('Inspect the fictional local field-kit product and report the verified product and price.');
   const result=z.strictObject({product:z.string(),price:z.string(),verified:z.boolean()}).parse(JSON.parse(report(events)));
   if(!host||!host.verified||calls(events)!==1||result.product!==host.product||result.price!==host.price||result.verified!==true)throw Error('Real browser report differs from host DOM evidence');
   console.log(`Real host-browser adapter: model calls ${calls(events)} · Playwright MCP calls ${host.calls} · verified ${host.verified}`);
   console.log(`Host DOM product ${host.product} · ${host.price}`);
   console.log('The host drove its own real local MCP browser and checked the DOM. The cloud session did not connect to host localhost or a remote browser MCP server.');
  },[definition('inspect_local_fixture','Inspect the host-owned fictional field-kit page through bounded local Playwright MCP and return verified DOM evidence. Read-only; no external site.',z.strictObject({}))],async event=>{
   if(event.name!=='inspect_local_fixture'||inspected++)return{text:'Unknown or repeated inspection refused.',isError:true};
   z.strictObject({}).parse(event.input);host=await runner.run('inspect-product',owner);
   if(host.proofId){const png=runner.proof(host.proofId,owner);if(png)await writeFile('presentations/managed-agents-lab64-walkthrough/terminal/live-proof.png',png);}
   return{text:JSON.stringify(host),isError:!host.verified};
  });
 }finally{await runner.close();}
}else{
 const owner='walkthrough-live';
 const noSend:typeof fetch=async()=>{throw Error('External notification is not part of this local demonstration');};
 const store=new Lab65ApprovalStore(`artifacts/walkthrough-lab65-live/${randomUUID()}.sqlite`,()=>Date.now(),{},noSend);
 try{
  const input_schema={...lab65ToolDefinition.input_schema,type:'object' as const};
  await demo(lab,'Call propose_case_archive once for the requested fictional case. The host alone creates an immutable pending proposal. Do not claim the case was archived or select a reviewer.',async({turn})=>{
   const events=await turn('Propose archiving fictional case CASE-2042 because the requested investigation is complete.');
   const pending=store.snapshot(owner),proposal=pending.proposals[0];
   console.log(`Real archive proposal: calls ${calls(events)} · proposals ${pending.proposals.length} · effects ${pending.effects.length}`);
   if(calls(events)!==1||!proposal||proposal.state!=='pending'||pending.effects.length!==0)throw Error('Expected pending immutable proposal only');
   await store.notify(owner,proposal.id,'local');
   const token=store.reviewerSession(owner),approved=store.decide(owner,token,proposal.id,'approve');
   let duplicateRefused=false;try{store.decide(owner,token,proposal.id,'approve');}catch{duplicateRefused=true;}
   console.log(`Separate trusted reviewer: effects ${approved.effects.length} · duplicate decision refused ${duplicateRefused}`);
   console.log('Notification channel local · external messages sent 0. The reviewer token remained outside model context; no Slack, Teams or email provider was contacted.');
   if(approved.effects.length!==1||!duplicateRefused||store.snapshot(owner).effects.length!==1)throw Error('Reviewer idempotency check failed');
  },[{...lab65ToolDefinition,input_schema}],async event=>{
   const result=store.handleTool(owner,event);return{text:result.content.map(b=>b.text).join(' '),isError:result.is_error};
  });
 }finally{store.close();}
}
