// Capture Lab 21 (Host commands and prompt expansion) for its step-by-step video.
// Usage: node scripts/capture-lab21-walkthrough.mjs offline|live
// "live" prepares a live command session, runs exactly one model command (one billed session turn), inspects history, then closes it.
import {start} from './lab_capture_common.mjs';
const c=await start(21,process.argv[2],/\/api\/c21\/(session|run)$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Command status',{exact:true});const sess=status.locator('xpath=following-sibling::p[1]');
const res=page.locator('section[aria-label="Command result"]');
const rp=t=>res.locator('p').filter({hasText:t}).first();
async function idle(){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Run host command'&&b.disabled&&document.querySelector('[aria-label="Command status"]')),null,{timeout:200000}).catch(()=>{});await page.waitForTimeout(1500);}
async function runCmd(name){await page.getByLabel('Host command',{exact:true}).selectOption(name);await btn('Run host command').click();await page.waitForTimeout(800);
 await page.waitForFunction(()=>!/Preparing|Running/.test(document.querySelector('[aria-label="Command status"]')?.textContent??'')&&[...document.querySelectorAll('button')].find(b=>b.textContent==='Run host command')?.disabled===false,null,{timeout:200000});await page.waitForTimeout(1000);}
async function resultShot(id,extra=[]){await top(res,110);evidence[id]=await res.innerText();await shot(id,[[`${id}-kind`,res.locator('h3')],[`${id}-expanded`,rp('Expanded user.message')],[`${id}-count`,rp('Session message count')],...extra]);}
try{
 if(c.mode==='offline'){
  await c.intro('Host commands and prompt expansion');
  await open();const ex=c.h('Host commands and prompt expansion',2);await top(ex,130);
  const reg=c.h('Command registry');
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-registry',reg.locator('xpath=following-sibling::ul[1]')]]);
  await btn('Prepare offline session').click();await page.waitForTimeout(1500);evidence.prepared=await sess.innerText();
  await top(status,200);await shot('prepared',[['prepared-status',status],['prepared-session',sess]]);
  const cmd=page.getByLabel('Host command',{exact:true});await top(cmd,200);
  await shot('controls',[['controls-command',cmd],['controls-species',page.getByLabel('Species',{exact:true})],['controls-count',page.getByLabel('Count',{exact:true})],['controls-location',page.getByLabel('Location',{exact:true})]]);
  await runCmd('observation');await resultShot('observation',[['observation-outcome',rp('Outcome:')]]);
  await runCmd('checklist');await resultShot('checklist',[['checklist-outcome',rp('Outcome:')]]);
  await btn('Try invalid args').click();await page.waitForTimeout(1500);evidence.invalid=await status.innerText();
  await top(status,200);await shot('invalid',[['invalid-status',status],['invalid-session',sess]]);
  await btn('Try unknown command').click();await page.waitForTimeout(1500);evidence.unknown=await status.innerText();
  await top(status,200);await shot('unknown',[['unknown-status',status],['unknown-session',sess]]);
  await btn('Inspect local history').click();await page.waitForTimeout(1500);await resultShot('inspect',[['inspect-history',rp('Local history:')]]);
  await btn('Reset local history').click();await page.waitForTimeout(1500);await resultShot('reset',[['reset-history',rp('Local history:')]]);
  await btn('Close command session').click();await page.waitForTimeout(2000);evidence.closed=await status.innerText();
  await top(status,200);await shot('closed',[['closed-status',status],['closed-session',sess]]);
  await c.liveDisabled();
  await c.codeTour([1,3,5,6]);
  await c.knowledge();
 }else{
  await open();const run=btn('Run live');await top(run,300);await shot('live-run',[['live-run-button',run]]);
  await run.click();await page.waitForTimeout(2000);evidence.live_prepared=await sess.innerText();
  await top(status,200);await shot('live-prepared',[['live-prepared-status',status],['live-prepared-session',sess]]);
  await runCmd('observation');evidence.live=await res.innerText();
  if(!/Outcome: idle|Outcome: completed/.test(evidence.live))throw Error('Live command did not complete: '+evidence.live+' / '+await status.innerText());
  await resultShot('live-observation',[['live-observation-outcome',rp('Outcome:')]]);
  await btn('Inspect local history').click();await page.waitForTimeout(1500);await resultShot('live-inspect',[['live-inspect-history',rp('Local history:')]]);
  await btn('Close command session').click();await page.waitForTimeout(3000);evidence.live_closed=await status.innerText();
  await top(status,200);await shot('live-closed',[['live-closed-status',status],['live-closed-session',sess]]);
 }
}finally{await c.done();}
