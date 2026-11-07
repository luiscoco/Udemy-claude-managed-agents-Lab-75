// Capture Lab 18 (Cloud sandbox and host boundaries) for its step-by-step video.
// Usage: node scripts/capture-lab18-walkthrough.mjs offline|live
// "live" reads the live environment metadata (no session), then runs exactly one billed pwd diagnostic session.
import {start} from './lab_capture_common.mjs';
const c=await start(18,process.argv[2],/\/api\/c18\/run$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Sandbox experiment status',{exact:true});const plat=page.locator('div[aria-label="Configured platform"]');
const avail=page.locator('article[aria-label="Environment availability"]');const ev=page.locator('div[aria-label="Sandbox evidence"]');
const remoteH=c.h('Remote command evidence');
async function done(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel active run'),null,{timeout});await page.waitForTimeout(1000);}
async function hostRun(scenario,id){await page.getByLabel('Offline policy scenario',{exact:true}).selectOption(scenario);await btn('Run offline host test').click();await page.waitForTimeout(800);await done();
 evidence[id]=await ev.innerText();await top(ev,110);await shot(id,[[`${id}-host`,ev.locator('p').nth(0)],[`${id}-effect`,ev.locator('p').nth(1)],[`${id}-remote`,remoteH.locator('xpath=following-sibling::p[1]')]]);}
try{
 if(c.mode==='offline'){
  await c.intro('Cloud sandbox and host boundaries');
  await open();const ex=c.h('Cloud sandbox and host boundaries',2);await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',page.getByLabel('Offline policy scenario',{exact:true})],['exp-buttons',btn('Run offline host test').locator('..')]]);
  await plat.waitFor();await top(plat,110);evidence.platform=await plat.innerText();
  await shot('platform',[['plat-env',plat.locator('p').nth(0)],['plat-mount',plat.locator('p').nth(1)],['plat-note',plat.locator('p').nth(2)]]);
  await btn('Check offline availability').click();await avail.waitFor();await page.waitForTimeout(800);evidence.availability=await avail.innerText();
  await top(avail,110);await shot('availability',[['avail-facts',avail.locator('p').nth(0)],['avail-reason',avail.locator('p').nth(1)]]);
  await hostRun('allowed-mount','allowed');await hostRun('outside-mount','outside');await hostRun('blocked-network','network');await hostRun('missing-environment','missing-env');
  await c.liveDisabled();
  await c.codeTour([1,3,4,5]);
  await c.knowledge();
 }else{
  await open();await btn('Inspect live environment').click();await avail.waitFor();await page.waitForTimeout(1000);evidence.live_availability=await avail.innerText();
  if(!/Ready: true/.test(evidence.live_availability))throw Error('Live env not ready: '+evidence.live_availability);
  await top(avail,110);await shot('live-availability',[['live-avail-facts',avail.locator('p').nth(0)],['live-avail-reason',avail.locator('p').nth(1)]]);
  const run=btn('Run live');await top(run,300);await shot('live-run',[['live-run-button',run]]);
  await run.click();await page.waitForTimeout(1500);await done(200000);await ev.waitFor({timeout:30000});
  evidence.live=await ev.innerText();if(!/Source: managed-api/.test(evidence.live))throw Error('Not live: '+await status.innerText());
  await top(remoteH,110);
  await shot('live-remote',[['live-remote-facts',remoteH.locator('xpath=following-sibling::p[1]')],['live-remote-uses',remoteH.locator('xpath=following-sibling::*[2]')],['live-remote-message',ev.locator('p').last()]]);
 }
}finally{await c.done();}
