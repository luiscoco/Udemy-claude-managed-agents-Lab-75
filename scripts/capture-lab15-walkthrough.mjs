// Capture Lab 15 (Usage and session budgets) for its step-by-step video.
// Usage: node scripts/capture-lab15-walkthrough.mjs offline|live
// "live" runs exactly one billed budgeted text-only session turn, retrieves its usage, then closes it.
import {start} from './lab_capture_common.mjs';
const c=await start(15,process.argv[2],/\/api\/c15\/(run|send|budget)$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Usage experiment status',{exact:true});const ev=page.locator('div[aria-label="Usage evidence"]');
const p=t=>ev.locator('p').filter({hasText:t}).first();const readings=ev.locator(':scope > article');
async function settle(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel experiment')&&/State: (idle|budget-paused|closed|terminated|pending)/.test(document.querySelector('div[aria-label="Usage evidence"]')?.textContent??''),null,{timeout});await page.waitForTimeout(1000);}
async function startOffline(scenario){await open();await page.getByLabel('Offline scenario',{exact:true}).selectOption(scenario);await btn('Start offline usage experiment').click();await page.waitForTimeout(500);await settle();evidence[`run_${scenario}`]=await ev.innerText();}
async function boundaries(id){await top(ev,110);await shot(id,[[`${id}-state`,p('State:')],[`${id}-cap`,p('Cap:')],[`${id}-outcome`,p('Outcome:')]]);}
async function readingShot(id,i,extra=[]){const r=readings.nth(i);await top(r,110);await shot(id,[[`${id}-scope`,r.locator('h4')],[`${id}-tokens`,r.locator('p').filter({hasText:/^Input:/})],[`${id}-cost`,r.locator('p').filter({hasText:/^Active time/})],...extra.map(([k,t])=>[`${id}-${k}`,r.locator('p').filter({hasText:t})])]);}
try{
 if(c.mode==='offline'){
  await c.intro('Usage and session budgets');
  await open();const ex=c.h('Read usage and bound session spending');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-budget',page.getByLabel('Creation budget (US cents)')],['exp-turns',page.getByLabel('Host turn limit')],['exp-tools',page.locator('fieldset p').filter({hasText:'Tool calls allowed: 0'})]]);
  await startOffline('normal');await boundaries('normal');
  evidence.normal_readings=await readings.allInnerTexts();await readingShot('normal-reading',0,[['delta','Comparable change']]);
  await btn('Retrieve session usage').click();await page.waitForTimeout(2000);evidence.retrieved=await ev.innerText();evidence.retrieved_readings=await readings.allInnerTexts();
  await readingShot('retrieved',(await readings.count())-1,[['delta','Comparable change']]);
  await btn('Close usage session').click();await page.waitForTimeout(1500);
  await startOffline('repeated-usage');await top(p('Duplicate usage events'),300);
  await shot('repeated',[['repeated-dupes',p('Duplicate usage events')],['repeated-scope',readings.first().locator('h4')]]);
  await btn('Close usage session').click();await page.waitForTimeout(1500);
  await startOffline('child-activity');evidence.child_readings=await readings.allInnerTexts();
  await top(p('Duplicate usage events'),130);await shot('child',[['child-note',p('Duplicate usage events')]]);
  const ti=(await readings.locator('h4').allInnerTexts()).findIndex(t=>/^thread/.test(t));await readingShot('child-thread',ti,[['identity','Observed:']]);
  await btn('Close usage session').click();await page.waitForTimeout(1500);
  await startOffline('budget-reached');await boundaries('budget');
  const raise=page.locator('summary').filter({hasText:'Explicit budget raise and resume'});await raise.click();
  await page.getByLabel('I understand raising the cap can resume billed work').check();await top(raise,120);
  await shot('raise',[['raise-rule',raise.locator('xpath=following-sibling::p[1]')],['raise-cap',page.getByLabel('New cap (US cents)')],['raise-ack',page.getByText('I understand raising the cap can resume billed work')],['raise-button',btn('Raise budget and resume')]]);
  await btn('Raise budget and resume').click();await page.waitForTimeout(800);await settle();evidence.raised=await ev.innerText();await boundaries('raised');
  await btn('Close usage session').click();await page.waitForTimeout(1500);
  await c.liveDisabled();
  await c.codeTour([1,3,5,6]);
  await c.knowledge();
 }else{
  await open();const run=btn('Run live');await top(page.getByLabel('Creation budget (US cents)'),250);
  await shot('live-limits',[['live-budget',page.getByLabel('Creation budget (US cents)')],['live-turns',page.getByLabel('Host turn limit')],['live-tools',page.locator('fieldset p').filter({hasText:'Tool calls allowed: 0'})]]);
  await top(run,400);await shot('live-run',[['live-run-button',run]]);
  await run.click();await page.waitForTimeout(1000);await settle(240000);
  evidence.live=await ev.innerText();if(!/Source: managed-api/.test(evidence.live))throw Error('Not live: '+evidence.live.slice(0,300)+' / '+await status.innerText());
  await top(ev,110);await shot('live-session',[['live-state',p('State:')],['live-cap',p('Cap:')],['live-outcome',p('Outcome:')],['live-response',ev.locator('pre').first()]]);
  await readingShot('live-stream',0);
  await btn('Retrieve session usage').click();await page.waitForTimeout(3000);evidence.live_retrieved=await ev.innerText();evidence.live_readings=await readings.allInnerTexts();
  const n=await readings.count();await readingShot('live-retrieved',n-1,[['delta','Comparable change']]);
  await btn('Close usage session').click();await page.waitForTimeout(3000);evidence.live_close=await ev.innerText();
  await top(ev,110);await shot('live-close',[['live-close-state',p('State:')],['live-close-cleanup',p('Cleanup:')]]);
 }
}finally{await c.done();}
