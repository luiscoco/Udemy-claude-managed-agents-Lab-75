// Bounded existing-agent controls for tenant, queue and document host boundaries.
import {z} from 'zod';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import type {AgentCreateParams} from '@anthropic-ai/sdk/resources/beta/agents';
import {demo,type Event} from './session-demo.js';
import {Lab67Workshop,lab67ToolDefinition} from '../../server/concepts/67-multi-tenant-saas.js';
import {Lab68Queue,lab68ToolDefinition} from '../../server/concepts/68-scheduled-event-driven.js';
import {Lab69HostReview,allowedDocument,checkedPatch,documentSnapshot} from '../../server/lib/lab69-host.js';
import {lab68ToolInputSchema} from '../../shared/lab68-scheduled-event-driven.js';
import {lab67SourceToolSchema} from '../../shared/lab67-multi-tenant-saas.js';
import type {Lab69Patch} from '../../shared/lab69-embedding-sdk.js';
const lab=Number(process.argv[2]);if(lab<67||lab>69)throw Error('Choose Lab 67 through 69');
const calls=(events:Event[])=>events.filter(e=>e.type==='agent.custom_tool_use').length;
function definition(name:string,description:string,shape:z.ZodType):NonNullable<AgentCreateParams['tools']>[number]{
 const {$schema:_,...input_schema}=z.toJSONSchema(shape,{target:'draft-2020-12',io:'input'});if(input_schema.type!=='object')throw Error('Object tool input required');
 return{type:'custom',name,description,input_schema:{...input_schema,type:'object'}};
}
if(lab===67){
 const store=new Lab67Workshop(),auth=store.authenticate('alice');let foreignRefused=false,reads=0;
 try{
  try{store.source(auth.token,'policy-birch');}catch{foreignRefused=true;}
  if(!foreignRefused)throw Error('Foreign source was not refused');
  console.log('Local tenant control: foreign Birch source refused for Alice/Acme · provider calls 0');
  await demo(lab,'Call read_project_policy exactly once for the requested source. The host chooses the tenant from its trusted token; tool input cannot choose another identity.',async({turn})=>{
   const events=await turn('Read policy-acme for the current authenticated project, then briefly summarize the result.');
   console.log(`Real tenant-scoped tool: calls ${calls(events)} · host-authorized Acme reads ${reads} · foreign-source control refused ${foreignRefused}`);
   console.log('The principal and token mapping are synthetic local authentication. This sample neither tests a production identity provider nor measures provider billing quotas.');
   if(calls(events)!==1||reads!==1)throw Error('Tenant tool boundary control failed');
  },[definition(lab67ToolDefinition.name,lab67ToolDefinition.description,lab67SourceToolSchema)],async event=>{
   try{const result=store.handleTool(auth.token,event);if(result.content[0].text.includes('30 days'))reads++;return{text:result.content[0].text,isError:result.is_error};}
   catch{return{text:'Host tenant source refused.',isError:true};}
  });
 }finally{await store.close();}
}else if(lab===68){
 const owner='walkthrough-live',queue=new Lab68Queue(randomBytes(32).toString('hex'),()=>Date.now(),`artifacts/walkthrough-lab68-live/${randomUUID()}.sqlite`);
 try{
  const admitted=queue.fixture(owner,'live-incident','valid');let claimRefused=false;
  console.log(`Signed fixture admission: duplicate ${admitted.duplicate} · queued jobs ${queue.snapshot(owner).jobs.length} · effects 0 · provider calls 0`);
  await demo(lab,'For this controlled host-claim check, call record_incident_triage exactly once for the queued job supplied by the user. Respect any host refusal and do not retry or claim execution.',async({turn})=>{
   const events=await turn(`Propose triage of queued job ${admitted.id} with a short fictional incident summary.`);
   console.log(`Real queued-job proposal: calls ${calls(events)} · missing-claim refusal ${claimRefused} · effects ${queue.snapshot(owner).effects.length}`);
   if(calls(events)!==1||!claimRefused||queue.snapshot(owner).effects.length!==0)throw Error('Queued proposal bypassed host claim');
   const result=await queue.worker(owner,'success');
   console.log(`Separate explicit host worker: state ${result.jobs[0].state} · effects ${result.effects.length}`);
   console.log('Admission did not execute the model proposal. A separately claimed authored host worker recorded the fictional effect; no external scheduler or webhook provider was contacted.');
   if(result.effects.length!==1)throw Error('Explicit claimed worker did not record one effect');
  },[definition(lab68ToolDefinition.name,lab68ToolDefinition.description,lab68ToolInputSchema)],async event=>{
   try{const result=queue.handleTool(owner,event);return{text:result.content[0].text,isError:result.is_error};}
   catch(error){const reason=error instanceof Error?error.message:String(error);claimRefused=reason==='Tool requires a live host claim.';return{text:JSON.stringify({denied:true,reason:reason.slice(0,200)}),isError:true};}
  });
 }finally{await queue.close();}
}else{
 const root=resolve(`artifacts/walkthrough-lab69-live/${randomUUID()}`),filename=resolve(root,'observation.md');await mkdir(root,{recursive:true});
 const original='# Observation\n\nThree fictional Aurora Finches observed.\n';await writeFile(filename,original);
 const base=documentSnapshot(randomUUID(),1,await readFile(filename,'utf8')),correlationId=randomUUID(),review=new Lab69HostReview();review.begin(correlationId);
 let proposed:Lab69Patch|undefined;
 try{
  await demo(lab,'Call propose_document_patch exactly once with a short replacement observation. A proposal cannot edit a file. Preserve three fictional Aurora Finches and state that location and time remain unknown.',async({turn})=>{
   const events=await turn('Review the explicit document context: '+base.text);
   const unchanged=(await readFile(filename,'utf8'))===original;
   console.log(`Real document proposal: calls ${calls(events)} · file unchanged before host review ${unchanged}`);
   if(calls(events)!==1||!proposed||!unchanged)throw Error('Expected a pending proposal without a file write');
   const current=documentSnapshot(base.documentId,1,await readFile(filename,'utf8'));
   const accepted=review.apply(base,current,correlationId,true),allowed=await allowedDocument(root,filename);await writeFile(allowed,accepted.replacement);
   const changed=documentSnapshot(base.documentId,2,await readFile(filename,'utf8'));let staleRefused=false;
   try{checkedPatch(base,changed,proposed,correlationId,true);}catch{staleRefused=true;}
   console.log(`Separate trusted file apply: version ${changed.version} · stale patch refused ${staleRefused}`);
   console.log('The real Node file adapter exercised trusted path, correlation and version/hash guards. This does not prove VS Code extension-host execution.');
   if(!staleRefused)throw Error('Changed-document guard did not refuse stale patch');
  },[definition('propose_document_patch','Propose replacement text for the host-supplied document. The host binds identity, version, hash and correlation; separate review is required to write.',z.strictObject({replacement:z.string().min(1).max(9000)}))],async event=>{
   if(event.name!=='propose_document_patch')return{text:'Unknown tool refused.',isError:true};
   const input=z.strictObject({replacement:z.string().min(1).max(9000)}).parse(event.input);
   proposed={correlationId,documentId:base.documentId,baseVersion:base.version,baseHash:base.hash,replacement:input.replacement};
   const pending=review.final(correlationId,proposed);return{text:JSON.stringify({pending,fileWritten:false}),isError:!pending};
  });
 }finally{review.dispose();}
}
