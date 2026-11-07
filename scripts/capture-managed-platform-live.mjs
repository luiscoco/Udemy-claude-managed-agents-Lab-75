/** Explicitly authorized real Lab 01 runs. Never fabricates fixture results as live evidence.
 * node --env-file-if-exists=.env --import tsx scripts/capture-managed-platform-live.mjs --execute-live
 */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createManagedClient,managedSettings,managedResourceIds,managedErrorMessage} from '../server/lib/managed-config.ts';
import {lab01ResultSchema} from '../shared/lab01-events.ts';
const dir=path.resolve('presentations/managed-agents-platform-walkthrough/live');await mkdir(dir,{recursive:true});
const evidence={capturedAt:new Date().toISOString(),origin:'http://127.0.0.1:5174',viewport:{width:1920,height:1080},browserZoom:1,mode:'live',runs:[],shots:[],status:'preflight',errors:[]};
const save=()=>writeFile(path.join(dir,'capture-evidence.json'),JSON.stringify(evidence,null,2));
let browser,context,client;
try{
 const local=managedSettings();const current=await fetch('http://127.0.0.1:3076/api/managed/setup').then(r=>r.json());
 evidence.readiness={local:{liveReady:local.liveReady,missing:local.missing,invalid:local.invalid},backend:current};await save();
 if(!local.liveReady||!current.liveReady){evidence.status='awaiting-local-configuration';await save();console.log('Live capture cannot start: configure the missing local settings and restart the backend. No provider session created.');process.exitCode=2;}
 else{
  if(!process.argv.includes('--execute-live'))throw Error('Pass --execute-live only for the user-authorized recording.');
  if(Number(local.budgetCents)>50||Number(current.budgetCents)>50)throw Error('For this short recording, set MANAGED_BUDGET_CENTS to 50 or less before running.');
  client=createManagedClient();const ids=managedResourceIds();
  const agent=await client.beta.agents.retrieve(ids.agentId);await client.beta.environments.retrieve(ids.environmentId);
  if(agent.archived_at||agent.tools.length||agent.mcp_servers.length||agent.skills.length||agent.multiagent)throw Error('Lab 01 requires an active text-only agent without tools, skills, MCP servers or orchestration.');
  evidence.providerAccessVerified=true;evidence.sessionBudgetCents=current.budgetCents;
  browser=await chromium.launch({channel:'msedge',headless:true});
  context=await browser.newContext({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',forcedColors:'none',colorScheme:'light',recordVideo:{dir:path.join(dir,'recordings'),size:evidence.viewport}});
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',()=>evidence.errors.push('Browser application error; review local browser logs.'));
  async function shot(id,anchor,targets){
   await anchor.scrollIntoViewIfNeeded();await anchor.evaluate(el=>window.scrollTo(0,Math.max(0,el.getBoundingClientRect().top+scrollY-120)));await page.waitForTimeout(200);
   const cues=[];for(const [id,loc] of targets){const b=await loc.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);const b=r.getBoundingClientRect();return {text:el.innerText,rect:[b.x,b.y,b.width,b.height]}});const [x,y,w,h]=b.rect;if(x<4||y<95||x+w>1916||y+h>1072)throw Error('Live text target is not fully visible: '+id);cues.push({id,...b});}
   await page.screenshot({path:path.join(dir,id+'.png')});evidence.shots.push({id,cues});await save();
  }
  for(const [index,prompt] of [
   'Give me three bullet points about Claude Managed Agents sessions.',
   'In two short sentences, explain why an agent message alone does not prove that a Managed Agents session turn completed. Mention the lifecycle event and stop reason to check.'
  ].entries()){
   const n=index+1;await page.goto(evidence.origin+'/?lesson=1',{waitUntil:'networkidle'});await page.getByRole('tab',{name:'Run the exercise',exact:true}).click();await page.getByLabel('Prompt',{exact:true}).fill(prompt);
   const button=page.getByRole('button',{name:'Run live',exact:true});await button.scrollIntoViewIfNeeded();
   await page.getByText('Live setup is ready.',{exact:true}).waitFor();
   await shot(`live-${n}-ready`,button,[[`live-${n}-button`,button]]);
   const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/c1/query')&&r.request().method()==='POST',{timeout:20000});
   await button.click();const response=await responsePromise;
   if(response.request().postDataJSON().mode!=='live')throw Error('The browser did not send live mode.');
   if(!response.ok())throw Error('Live endpoint rejected the request; inspect setup before a manual retry.');
   const run={number:n,prompt,source:'managed-api',sessionIds:[],result:null};evidence.runs.push(run);await save();
   // Keep the response for the actual UI run, not a second hidden provider execution.
   const body=await response.text();
   for(const block of body.split(/\r?\n\r?\n/)){
    const name=block.match(/^event:\s*(.+)$/m)?.[1]?.trim();const data=block.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!data)continue;
    let value;try{value=JSON.parse(data)}catch{continue}
    if(name==='progress'&&value.kind==='session')run.sessionIds.push(value.session.id);
    if(name==='result')run.result=lab01ResultSchema.parse(value);
   }
   await save();
   if(!run.result||run.result.source!=='managed-api'||run.result.mode!=='live'||!run.result.sessionId)throw Error('No validated live result returned.');
   const outcome=page.getByRole('group',{name:'Turn outcome',exact:true});await outcome.waitFor({timeout:15000});
   const answer=page.locator('.agent-response');await shot(`live-${n}-answer`,answer,[[`live-${n}-answer`,answer.locator('h3')]]);
   await shot(`live-${n}-outcome`,page.getByRole('heading',{name:'3. Lifecycle and span events',exact:true}),[[`live-${n}-outcome`,outcome.locator('p').first()]]);
   if(run.result.outcome.kind!=='completed'||run.result.outcome.stopReason!=='end_turn'||!run.result.messages.length)throw Error('The live run did not complete normally. Preserve its real result; do not label it successful.');
   console.log(`Live run ${n}: completed/end_turn; ${run.result.eventCount} events; cleanup ${run.result.cleanup}.`);
  }
  evidence.status='captured';await save();
 }
}catch(error){evidence.status='needs-review';evidence.errors.push(error instanceof Error&&error.message.startsWith('Live')?error.message:managedErrorMessage(error));await save();console.error(evidence.errors.at(-1));process.exitCode=1;}
finally{
 // Only sessions created by these two recorded requests may be inspected/cleaned.
 if(client)for(const run of evidence.runs)for(const id of new Set([...run.sessionIds,...(run.result?.sessionId?[run.result.sessionId]:[])])){
  try{let s=await client.beta.sessions.retrieve(id,{}, {timeout:3000});if(s.status!=='idle'&&s.status!=='terminated'){await client.beta.sessions.events.send(id,{events:[{type:'user.interrupt'}]},{timeout:3000});for(let i=0;i<10;i++){await delay(500);s=await client.beta.sessions.retrieve(id,{}, {timeout:3000});if(s.status==='idle'||s.status==='terminated')break;}}
   if(s.status==='idle'&&!s.archived_at)s=await client.beta.sessions.archive(id,{}, {timeout:3000});
   (run.cleanupVerification??=[]).push({sessionId:id,status:s.status,archived:!!s.archived_at});if(s.status!=='terminated'&&!s.archived_at){evidence.status='needs-review';process.exitCode=1;}
  }catch{(run.cleanupVerification??=[]).push({sessionId:id,confirmed:false});evidence.status='needs-review';process.exitCode=1;}
 }
 await context?.close();await browser?.close();await save();
}
