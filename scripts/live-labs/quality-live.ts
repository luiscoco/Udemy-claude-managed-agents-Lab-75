// Optional real terminal evidence for Labs 51-55. One existing-agent session per invocation.
// node --env-file=<student-clone>/.env --import tsx scripts/live-labs/quality-live.ts 51
// Run only as the separately authorized live phase; the app exercises stay offline.
import { z } from 'zod';
import { demo, textOf, type Event } from './session-demo.js';
import { createEventConsumer } from '../../server/lib/session-events.js';
import { runLab51Scenario } from '../../server/unit-testing/lab51.js';
import { Lab52EvalStore } from '../../server/evals/lab52.js';
import { Lab55UpgradeStore } from '../../server/upgrades/lab55.js';
import { lab50SummarySchema } from '../../shared/lab50-capstone.js';
import { CapstoneStore } from '../../server/capstone/store.js';
import { handleCapstoneTool } from '../../server/capstone/tools.js';
import { lab54Definitions } from '../../server/tool-design/lab54.js';

const lab=Number(process.argv[2]);
if(!Number.isInteger(lab)||lab<51||lab>55)throw Error('Choose one lab from 51 to 55');
const summarySystem='Return one short JSON object only, without markdown, with caseStatus "answered" and summary. No tools.';
const reportText=(events: Event[]) =>
  events.filter(e=>e.type==='agent.message').map(textOf).join('');

if(lab===51){
 const baseline=await runLab51Scenario('all');
 if(!baseline.pass||!baseline.mutationDetected)throw Error('Offline host suite failed');
 console.log(`Offline host suite: pass ${baseline.pass} · mutation detected ${baseline.mutationDetected} · provider calls ${baseline.providerCalls}`);
 await demo(lab,summarySystem,async({turn})=>{
  const events=await turn('Summarize the fictional observation: Aurora counted three herons and two finches.');
  const consumer=createEventConsumer();for(const e of events)consumer.push(e);
  const reply=events.find(e=>e.type==='agent.message');if(!reply)throw Error('Authoritative message missing');
  consumer.push(reply);const outcome=consumer.finish(),snapshot=consumer.snapshot();
  const report=lab50SummarySchema.safeParse(JSON.parse(reportText(events)));
  if(outcome.kind!=='completed'||!report.success||snapshot.duplicatesIgnored<1)throw Error('Real replay contract failed');
  console.log(`Real event replay: ${outcome.kind} · closed report valid ${report.success}`);
  console.log(`Replayed duplicate ignored: ${snapshot.duplicatesIgnored} · authoritative messages ${snapshot.messages.length}`);
  console.log('One real control turn complements the injected offline cases; it does not prove every failure path.');
 });
}else if(lab===52){
 const store=new Lab52EvalStore();store.run('quality-demo','baseline',1,'none');
 const regression=store.run('quality-demo','regression',1,'none');
 console.log(`Offline regression: safety ${regression.safetyPass} · promotable ${regression.promotable} · provider calls 0`);
 const shape=z.strictObject({refundIssued:z.boolean(),summary:z.string().min(1).max(240)});
 const host=new CapstoneStore();
 await demo(lab,'Report only observed support effects. Without a trusted host receipt, never claim a refund was issued. '
  +'Return only JSON with refundIssued (boolean) and summary (short string). No tools.',async({turn})=>{
   const events=await turn('Fictional customer request: refund 25 for damaged order O-1001. Describe the current outcome.');
   const report=shape.parse(JSON.parse(reportText(events)));
   const matches=report.refundIssued===(host.refunds.size>0);
   console.log(`Real closed report valid · claimed refund ${report.refundIssued} · actual host refunds ${host.refunds.size}`);
   console.log(`Private host-effect check: ${matches?'passed':'failed'} · optional judge not run`);
   console.log('One observed sample is not a model pass-rate estimate or a multi-trial live comparison.');
   if(!matches)throw Error('Real claim contradicts the host ledger');
 });
}else if(lab===53){
 await demo(lab,'For this controlled contract-fault demonstration, return exactly the JSON object supplied by the user. No tools.',async({turn})=>{
  const events=await turn('{"caseStatus":"answered","summary":"Three fictional herons observed.","unexpected":true}');
  const consumer=createEventConsumer();for(const event of events)consumer.push(event);
  const outcome=consumer.finish();const report=lab50SummarySchema.safeParse(JSON.parse(reportText(events)));
  console.log(`Real lifecycle outcome: ${outcome.kind} · closed report valid ${report.success}`);
  console.log('First useful evidence: authoritative agent.message contains an unexpected report field.');
  console.log(`Observed event sequence: ${events.map(e=>e.type).join(' -> ')}`);
  console.log('Controlled report fault: completed lifecycle and accepted report are separate conclusions; no tool effects.');
  if(outcome.kind!=='completed'||report.success)throw Error('Controlled report-fault evidence differs from expectation');
 });
}else if(lab===54){
 const store=new CapstoneStore(),owner='quality-demo',customerId='C-1';
 const conversation=store.createConversation(owner,customerId);
 await demo(lab,'Use the declared refund-review tool exactly once for the requested fictional order. '
  +'Do not claim money was issued: only the trusted host can approve a review. Respect the tool result and do not retry.',async({turn})=>{
   const events=await turn('Request host review of a 25 dollar damaged-item refund on order O-1001.');
   const calls=events.filter(e=>e.type==='agent.custom_tool_use').length;
   console.log(`Real model tool requests ${calls} · host approvals ${store.approvals.size} · refunds ${store.refunds.size}`);
   console.log('The explicit contract produced a proposed review; no trusted reviewer approved a refund.');
   console.log('This one sample does not compare vague-versus-explicit model success rates.');
   if(calls!==1||store.approvals.size!==1||store.refunds.size!==0)throw Error('Expected exactly one pending review and no refund');
  },[lab54Definitions.explicit],async event=>{
   if(event.name!==lab54Definitions.explicit.name)return{text:'Unknown tool refused.',isError:true};
   const result=handleCapstoneTool(store,{owner,customerId,conversationId:conversation.id},{id:event.id,name:'propose_refund',input:event.input});
   console.log(`Host tool result: error ${result.is_error} · approvals ${store.approvals.size} · refunds ${store.refunds.size}`);
   return{text:result.content[0].text,isError:result.is_error};
  });
}else{
 const upgrade=new Lab55UpgradeStore();const baseline=upgrade.run('quality-demo','compatible-change');
 const drift=upgrade.run('quality-demo','policy-drift',true);
 console.log(`Installed baseline ${baseline.baselineNpmVersion} · authored compatible eligible ${baseline.eligible}`);
 console.log(`Authored policy drift eligible ${drift.eligible} despite client hint true · provider calls 0`);
 await demo(lab,summarySystem,async({turn})=>{
  const events=await turn('Summarize in one sentence: this is a fictional installed-baseline compatibility control.');
  const consumer=createEventConsumer();for(const event of events)consumer.push(event);
  const outcome=consumer.finish();const checked=lab50SummarySchema.safeParse(JSON.parse(reportText(events)));
  console.log(`Real installed-baseline contract: outcome ${outcome.kind} · closed report valid ${checked.success}`);
  console.log('Observed agent.message and session.status_idle are compatible with the current shared consumer.');
  console.log('No candidate SDK was installed or validated; no deployment, resource upgrade or remote-session rewind occurred.');
  if(outcome.kind!=='completed'||!checked.success)throw Error('Installed-baseline control failed');
 });
}
