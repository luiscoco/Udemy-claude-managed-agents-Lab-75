// Capture Lab 20 (Lifecycle events and host interceptors) for its step-by-step video.
// Usage: node scripts/capture-lab20-walkthrough.mjs offline|live
// "live" runs exactly one billed passing-policy session with the Lab 07 custom-tool agent.
import {start} from './lab_capture_common.mjs';
const c=await start(20,process.argv[2],/\/api\/c20\/run$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lifecycle experiment status',{exact:true});const res=page.locator('article[aria-label="Lifecycle result"]');
const provH=res.locator('h3',{hasText:'Provider event projection'});const auditH=res.locator('h3',{hasText:'Host audit'});
async function done(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel active run'),null,{timeout});await page.waitForTimeout(1000);}
async function runScenario(s){await page.getByLabel('Offline lifecycle scenario',{exact:true}).selectOption(s);await btn('Run offline lifecycle').click();await page.waitForTimeout(500);await done();evidence[`run_${s}`]=await res.innerText();}
async function headShot(id){await top(res,110);await shot(id,[[`${id}-facts`,res.locator('p').nth(0)],[`${id}-draft`,res.locator('p').nth(1)]]);}
async function eventsShot(id){await top(provH,110);await shot(id,[[`${id}-provider`,provH.locator('xpath=following-sibling::ol[1] | following-sibling::p[2]').first()]]);}
async function auditShot(id){await top(auditH,110);await shot(id,[[`${id}-audit`,auditH.locator('xpath=following-sibling::ol[1]')],[`${id}-note`,auditH.locator('xpath=following-sibling::p[1]')]]);}
try{
 if(c.mode==='offline'){
  await c.intro('Lifecycle events and host interceptors');
  await open();const ex=c.h('Lifecycle events and host interceptors',2);await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',page.getByLabel('Offline lifecycle scenario',{exact:true})],['exp-prompt',page.getByLabel('Lifecycle prompt',{exact:true})]]);
  await runScenario('passing-policy');await headShot('passing');await eventsShot('passing-events');await auditShot('passing-audit');
  await btn('Inspect draft.md').click();const pre=page.getByLabel('Inspected file contents',{exact:true});await pre.waitFor();await top(pre,200);await shot('passing-draft',[['passing-draft-file',pre]]);
  await runScenario('denied-pre-execution');await headShot('denied');await auditShot('denied-audit');
  await runScenario('tool-failure');await auditShot('failure-audit');
  await runScenario('interceptor-exception');await auditShot('exception-audit');
  await runScenario('deadline');await headShot('deadline');
  await runScenario('final-validation-failure');await headShot('validation');await auditShot('validation-audit');
  await c.liveDisabled();
  await c.codeTour([1,3,4,6]);
  await c.knowledge();
 }else{
  await open();const run=btn('Run live');await top(run,300);await shot('live-run',[['live-prompt',page.getByLabel('Lifecycle prompt',{exact:true})],['live-run-button',run]]);
  await run.click();await page.waitForTimeout(1000);await done(200000);await res.waitFor({timeout:10000});evidence.live=await res.innerText();
  if(!/Source: managed-api/.test(evidence.live))throw Error('Not live: '+await status.innerText());
  await headShot('live-head');await eventsShot('live-events');await auditShot('live-audit');
 }
}finally{await c.done();}
