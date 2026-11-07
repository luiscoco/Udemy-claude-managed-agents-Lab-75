import express from 'express';
import {randomUUID} from 'node:crypto';
import {localRequests} from './local-requests.mjs';
import {managedReadiness,runManagedTurn} from './managed-runtime.mjs';
import {cases,sections,variants,preparedRun} from './cases.mjs';
import {answerPreview} from './src/answer-preview.mjs';
import {parseRunOptions,buildLiveRequest} from './run-options.mjs';
const app=express(),runs=new Map(),triedCaseIds=new Set();let active=0;
app.use(localRequests);app.use(express.json({limit:'12kb'}));
app.get('/api/health',(_q,r)=>r.json({project:'agent-evaluation-studio',mode:process.env.PROJECT_MODE||'learner',liveAvailable:managedReadiness().liveAvailable}));
app.get('/api/cases',(_q,r)=>r.json({cases,sections,variants}));
app.get('/api/runs',(_q,r)=>r.json({runs:[...runs.values()].map(({answer,...row})=>({...row,answerPreview:answerPreview(answer)})),triedCaseIds:[...triedCaseIds]}));
app.get('/api/runs/:id',(q,r)=>{const row=runs.get(q.params.id);if(!row)return r.status(404).json({message:'Run not found.'});r.json(row);});
app.post('/api/runs',async(q,r)=>{
 const {caseId,variant,runMode,consent,mcpConsent}=q.body??{},item=cases.find(row=>row.id===caseId);
 if(!item||!Object.hasOwn(variants,variant)||!['prepared','live'].includes(runMode))return r.status(400).json({message:'Choose a valid case, variant and mode.'});
 let settings;try{settings=parseRunOptions(runMode==='prepared'?{...q.body,mcpMode:'none'}:q.body);}catch(error){return r.status(400).json({message:error.message});}
 if(runMode==='live'&&(consent!==true||settings.mcpMode!=='none'&&mcpConsent!==true))return r.status(403).json({message:'Authorize this paid run and any external MCP connection.'});
 if(runMode==='live'&&!managedReadiness().liveAvailable)return r.status(503).json({message:'Configure Managed Agents credentials, agent, environment and MANAGED_LIVE_ENABLED=true.'});
 if(active>=2)return r.status(429).json({message:'Wait for an active evaluation to finish.'});active++;
 const controller=new AbortController(),closed=()=>{if(!r.writableEnded)controller.abort();};r.once('close',closed);const started=Date.now();
 try{
  let result;
  if(runMode==='prepared')result=preparedRun(caseId,variant);
  else {
   const input=buildLiveRequest(item,variants[variant],settings,process.env.CLAUDE_MODEL||'claude-haiku-4-5');
   const reviewBudget=settings.specialistReview?Math.max(.01,Math.floor(settings.maxBudgetUsd*20)/100):0;
   result=await runManagedTurn({...input,maxBudgetUsd:settings.maxBudgetUsd-reviewBudget,signal:controller.signal});
   if(settings.specialistReview&&!result.isError){
    const review=await runManagedTurn({prompt:JSON.stringify({question:item.question,answer:result.answer,check:item.check}),
     system:'Review this Claude Managed Agents teaching answer. Identify unsupported claims and one useful improvement. You have no tools; do not claim independent source verification.',
     maxBudgetUsd:reviewBudget,eventLimit:settings.eventLimit,signal:controller.signal,title:'Evaluation independent review'});
    result.events.push({type:'review',label:'Independent Managed review session',detail:review.sessionId||'not created'},...review.events);
    result.reviewSessionId=review.sessionId;result.reviewCleanup=review.cleanup;result.reviewIncomplete=review.isError;
    result.specialistCalls=1;result.answer+='\n\n## Independent review\n\n'+(review.answer||'Review incomplete.');
    result.costUsd=result.costUsd===null||review.costUsd===null?null:result.costUsd+review.costUsd;
   }
  }
  const run={id:randomUUID(),caseId,caseTitle:item.title,variant,runMode,sourceLabel:runMode==='prepared'?'No external source (prepared fixture)':settings.sourceLabel,
   depth:settings.depth,eventLimit:settings.eventLimit,maxBudgetUsd:settings.maxBudgetUsd,createdAt:new Date().toISOString(),durationMs:Date.now()-started,...result};
  runs.set(run.id,run);triedCaseIds.add(caseId);if(runs.size>40)runs.delete(runs.keys().next().value);r.status(201).json(run);
 }catch{r.status(502).json({message:'The Managed evaluation could not complete. No automatic retry was made.'});}
 finally{active--;r.off('close',closed);}
});
const port=Number(process.env.PORT??5292);app.listen(port,'127.0.0.1',()=>console.log('Agent Evaluation Studio API http://127.0.0.1:'+port));
