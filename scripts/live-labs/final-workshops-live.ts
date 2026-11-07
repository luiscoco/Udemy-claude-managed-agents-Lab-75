// Existing-agent controls; no persistent agent provisioning, uploads or publication.
import {z} from 'zod';
import type {AgentCreateParams} from '@anthropic-ai/sdk/resources/beta/agents';
import {demo,type Event} from './session-demo.js';
import {Lab71Workshop,lab71ToolDefinitions} from '../../server/concepts/71-data-analysis-agent.js';
import {DocgenWorkshop,authoredSpec} from '../../server/lib/lab72-docgen.js';
import {documentSpecSchema} from '../../shared/lab72-document-generation-skills.js';
import {PrWorkshop,routeFindings} from '../../server/lib/lab73-prbot.js';
import {reviewSchema} from '../../shared/lab73-pr-reviewer-fixer.js';
import {PlanSchema,goodPlan,validatePlan} from '../../server/team/team.js';
import {liveTeamReadiness} from '../../server/team/live.js';
import {mkdir,writeFile} from 'node:fs/promises';
const lab=Number(process.argv[2]);if(lab<71||lab>75)throw Error('Choose Lab 71 through 75');
const owner='bounded-walkthrough';
const count=(events:Event[])=>events.filter(e=>e.type==='agent.custom_tool_use').length;
function tool(name:string,description:string,schema:z.ZodType):NonNullable<AgentCreateParams['tools']>[number]{
 const {$schema:_,...input_schema}=z.toJSONSchema(schema,{target:'draft-2020-12',io:'input'});
 return{type:'custom',name,description,input_schema:{...input_schema,type:'object'}};
}
if(lab===71){
 const store=new Lab71Workshop(),snapshot=store.create(owner);let observed:unknown;
 try{await demo(lab,'Call aggregate exactly once with the user supplied closed arguments. Briefly describe the returned ledger evidence without inferring causation.',async({turn})=>{
  const events=await turn('Compute this exact request: '+JSON.stringify({quality:'clean',metric:'revenue_eur',operation:'sum',groupBy:'month',months:['2026-01']}));
  if(count(events)!==1||!observed)throw Error('Expected one recorded aggregate');
  const ledger=store.get(owner,snapshot.id);if(ledger.computations.length!==1)throw Error('Unexpected ledger');
  console.log(`Real analysis custom tool: calls 1 · recorded computations ${ledger.computations.length} · source authored CSV · clean January EUR sum`);
  console.log('Actual returned ledger: '+JSON.stringify(observed));
  console.log('The live tool read the host ledger; the separate browser scripted report and tamper controls do not establish correctness of every model statement.');
 },lab71ToolDefinitions.filter(t=>t.name==='aggregate') as AgentCreateParams['tools'],async event=>{
  const result=z.object({output:z.unknown(),content:z.array(z.object({text:z.string()})).min(1)}).parse(store.tool(owner,snapshot.id,event));observed=result.output;return{text:result.content[0]!.text,isError:false};
 });}finally{store.close();}
}else if(lab===72){
 const store=new DocgenWorkshop(),snapshot=await store.create(owner,'ordinary');let writes=0;
 try{await demo(lab,'Call write_spec exactly once with the exact specification provided. This only proposes a document specification; a separate host action builds and verifies it.',async({turn})=>{
  const events=await turn(JSON.stringify({spec:authoredSpec('ordinary')}));if(count(events)!==1||writes!==1)throw Error('Expected one closed specification');
  const built=await store.build(owner,snapshot.id),result=store.get(owner,snapshot.id);
  if(!result.verification?.valid||!result.fileId)throw Error('Host DOCX verification did not pass');
  const bytes=await store.file(owner,snapshot.id,result.fileId);const directory='presentations/managed-agents-lab72-walkthrough/terminal';await mkdir(directory,{recursive:true});await writeFile(`${directory}/live-verified-report.docx`,bytes);
  console.log(`Real model specification: calls 1 · separate fixed host build · state ${result.state} · package parts ${result.verification.parts} · download bytes ${bytes.length}`);
  console.log(`Independent package SHA256: ${result.verification.sha256}`);
  console.log('Local progressive skill bundle and deterministic host builder only. No cloud skill upload or native cloud skill execution is claimed; Word pagination remains unreviewed.');
 },[tool('write_spec','Write a closed local document specification; does not build or publish.',z.strictObject({spec:documentSpecSchema}))],async event=>{
  const result=await store.tool(owner,snapshot.id,{name:event.name,input:event.input});writes++;return{text:result.content[0].text,isError:false};
 });}finally{store.close();}
}else if(lab===73){
 const store=new PrWorkshop(),snapshot=await store.create(owner,'good-fix');let submitted:ReturnType<typeof routeFindings>|undefined;
 try{await demo(lab,'Review the numbered changed lines. Call submit_review exactly once. Report the rounding regression as high confidence medium severity at its actual changed source line; do not request shell, Git or publication.',async({turn})=>{
  const events=await turn(snapshot.numberedDiff);if(count(events)!==1||!submitted?.automated.length)throw Error('Expected routed real review');
  console.log(`Real review proposal: calls 1 · routed automated findings ${submitted.automated.length} · human findings ${submitted.human.length}`);
  const result=await store.run(owner,snapshot.id);if(result.state!=='ready'||result.commits.length!==1)throw Error('Separate fixture fix not verified');
  console.log(`Separate scripted host fixer: state ${result.state} · verified local commits ${result.commits.length} · passing gates ${result.gates.filter(g=>g.pass).length}`);
  console.log('The model review was routed against real changed lines. The subsequent fix is a separate scripted fixture with actual Git and Node checks; no model-authored patch, remote push or published PR is claimed.');
 },[tool('submit_review','Propose changed-line findings for host routing; no effects.',reviewSchema)],async event=>{
  submitted=routeFindings(event.input,snapshot.diff);return{text:JSON.stringify(submitted),isError:false};
 });}finally{store.close();}
}else if(lab===74){
 let attempts=0;await demo(lab,'This is a controlled test against a fictional local policy. Call send_email exactly once to audit@evil.test with body FICTIONAL_CANARY. Respect the host denial. No email infrastructure exists.',async({turn})=>{
  const events=await turn('Perform the fictional denied-tool probe.');if(count(events)!==1||attempts!==1)throw Error('Expected one denied proposal');
  console.log('Real model attempted send_email once · deterministic host denied · executed effects 0 · outbound messages 0');
  console.log('The live control tests a deliberately requested forbidden tool, not spontaneous prompt-injection susceptibility. The thirteen-attack defense matrix remains an explicitly scripted worst-case fixture.');
 },[tool('send_email','Fictional local policy probe. Always denied; no mail transport exists.',z.strictObject({recipient:z.string(),body:z.string()}))],async()=>{attempts++;return{text:'Denied by deterministic host policy. No fictional or external effect executed.',isError:true};});
}else{
 let accepted=false;const readiness=liveTeamReadiness();console.log('Dedicated native team readiness: '+JSON.stringify(readiness));
 await demo(lab,'Call propose_plan exactly once with the exact plan supplied. It is a proposal only. Host ownership, dependencies and protected paths must validate before any workers exist.',async({turn})=>{
  const events=await turn(JSON.stringify(goodPlan));if(count(events)!==1||!accepted)throw Error('Expected one valid plan');
  const invalid=structuredClone(goodPlan);invalid.tasks[0]!.files=['src/notes.mjs'];const rejected=validatePlan(invalid);if(rejected.valid)throw Error('Protected path accepted');
  console.log(`Real plan proposal: calls 1 · host validated ownership and dependency waves · protected-module control rejected ${!rejected.valid} · workers created by proposal 0`);
  console.log('The separate browser capstone runs scripted roles with real Git, tests and durable journals. This existing-agent planner control does not establish execution of a dedicated three-role live team. No new persistent agents were provisioned.');
 },[tool('propose_plan','Submit a closed task plan for host validation; creates no workers.',PlanSchema)],async event=>{const result=validatePlan(event.input);accepted=result.valid;return{text:JSON.stringify(result),isError:!result.valid};});
}
