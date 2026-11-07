// Capture Lab 22 (Explicit project context and memory) for its step-by-step video.
// Usage: node scripts/capture-lab22-walkthrough.mjs offline|live
// "live" runs exactly one billed text-only session with the nested context scenario.
import {start} from './lab_capture_common.mjs';
const c=await start(22,process.argv[2],/\/api\/c22\/run$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Context status',{exact:true});const res=page.locator('section[aria-label="Context result"]');
const rp=t=>res.locator('p').filter({hasText:t}).first();const msgH=res.locator('h4',{hasText:'Exact user.message sent'});const outH=res.locator('h4',{hasText:'Observed model or fixture text'});
async function done(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel active run'),null,{timeout});await page.waitForTimeout(1200);}
async function runScenario(s){await page.getByLabel('Context scenario',{exact:true}).selectOption(s);await btn('Run offline context').click();await page.waitForTimeout(800);await done();await res.waitFor();evidence[`run_${s}`]=await res.innerText();}
async function factsShot(id){await top(res,110);await shot(id,[[`${id}-source`,rp('Source:')],[`${id}-reads`,rp('Selected host reads')],[`${id}-memory`,rp('Cloud memory')]]);}
async function messageShot(id){await top(msgH,110);await shot(id,[[`${id}-message`,msgH.locator('xpath=following-sibling::pre[1]')]]);}
async function outputShot(id){await top(outH,110);await shot(id,[[`${id}-output`,outH.locator('xpath=following-sibling::pre[1]')],[`${id}-note`,outH.locator('xpath=following-sibling::p[1]')]]);}
try{
 if(c.mode==='offline'){
  await c.intro('Explicit project context and memory');
  await open();const ex=c.h('Explicit project context and memory',2);await top(ex,130);const inv=c.h('Authored file inventory');
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-inventory',inv.locator('xpath=following-sibling::ul[1]')]]);
  const q=page.getByLabel('Context scenario',{exact:true});await top(q,250);
  await shot('controls',[['controls-scenario',q],['controls-question',page.getByLabel('Context question',{exact:true})],['controls-run',btn('Run offline context')]]);
  await runScenario('nested');await factsShot('nested');await messageShot('nested-message');await outputShot('nested-output');
  await runScenario('conflict');await factsShot('conflict');await outputShot('conflict-output');
  await runScenario('disabled');await factsShot('disabled');await messageShot('disabled-message');
  await runScenario('handoff');await factsShot('handoff');await messageShot('handoff-message');
  await c.liveDisabled();
  await c.codeTour([1,3,4,5]);
  await c.knowledge();
 }else{
  await open();await page.getByLabel('Context scenario',{exact:true}).selectOption('nested');const run=btn('Run live');await top(run,300);
  await shot('live-run',[['live-scenario',page.getByLabel('Context scenario',{exact:true})],['live-run-button',run]]);
  await run.click();await page.waitForTimeout(1000);await done(200000);await res.waitFor({timeout:10000});evidence.live=await res.innerText();
  if(!/Source: managed-api/.test(evidence.live))throw Error('Not live: '+await status.innerText());
  await factsShot('live-facts');await messageShot('live-message');await outputShot('live-output');
 }
}finally{await c.done();}
