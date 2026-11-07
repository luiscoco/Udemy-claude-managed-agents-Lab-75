// Capture Lab 14 (Models and supported effort) for its step-by-step video.
// Usage: node scripts/capture-lab14-walkthrough.mjs offline|live
// "live" runs exactly one billed fresh session (claude-sonnet-5-5, low effort, no fallback).
import {start} from './lab_capture_common.mjs';
const c=await start(14,process.argv[2],/\/api\/c14\/run$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Model experiment status',{exact:true});const ev=page.locator('div[aria-label="Model experiment evidence"]');
const table=page.locator('table').filter({hasText:'Configuration'});
async function done(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel experiment')&&!/^Running/.test(document.querySelector('[aria-label="Model experiment status"]')?.textContent??''),null,{timeout});await page.waitForTimeout(1000);}
async function runOffline(effort,scenario='normal'){await page.getByLabel('Effort',{exact:true}).selectOption(effort);await page.getByLabel('Offline scenario').selectOption(scenario);await btn('Run offline model experiment').click();await page.waitForTimeout(500);await done();}
const attempt=n=>ev.locator('article').nth(n-1);
try{
 if(c.mode==='offline'){
  await c.intro('Models and supported effort');
  await open();const ex=c.h('Compare models and supported effort');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-model',page.getByLabel('Model',{exact:true})],['exp-effort',page.getByLabel('Effort',{exact:true})],['exp-budget',page.getByLabel('Primary budget (US cents)')]]);
  const cat=c.h('Server-owned capability catalog');await top(cat,110);
  await shot('catalog',[['catalog-sdk',cat.locator('xpath=following-sibling::p[1]')],['catalog-models',cat.locator('xpath=following-sibling::ul[1]')]]);
  for(const e of ['low','medium','high'])await runOffline(e);
  evidence.effort_status=await status.innerText();
  await top(attempt(1),110);evidence.high=await ev.innerText();
  await shot('high',[['high-head',attempt(1).locator('h4')],['high-config',attempt(1).locator('p').filter({hasText:'Requested:'})],['high-usage',attempt(1).locator('p').filter({hasText:'Reported usage:'})]]);
  await top(c.h('Effort comparisons'),110);evidence.table=await table.innerText();
  await shot('comparisons',[['cmp-note',c.h('Effort comparisons').locator('xpath=following-sibling::p[1]')],['cmp-table',table]]);
  // Reject incompatible values before anything is sent.
  await page.getByLabel('Model',{exact:true}).selectOption('claude-sonnet-4-6');await page.getByLabel('Effort',{exact:true}).selectOption('xhigh');
  await btn('Run offline model experiment').click();await page.waitForTimeout(800);evidence.invalid=await status.innerText();
  await top(page.getByLabel('Model',{exact:true}),200);
  await shot('invalid',[['invalid-model',page.getByLabel('Model',{exact:true})],['invalid-effort',page.getByLabel('Effort',{exact:true})]]);
  await top(status,300);await shot('invalid-status',[['invalid-status-text',status]]);
  await page.getByLabel('Model',{exact:true}).selectOption('claude-sonnet-5-5');
  // Fallback: an unavailable primary allows one budgeted fallback; uncertain work blocks it.
  await page.getByLabel('Allow one host fallback after reconciled failure').check();
  const fb=page.locator('p').filter({hasText:'Fallback model:'});await top(fb,250);
  await shot('fallback',[['fallback-check',page.getByText('Allow one host fallback after reconciled failure')],['fallback-policy',fb]]);
  await runOffline('medium','primary-unavailable');evidence.unavailable=await ev.innerText();
  await top(ev,140);await shot('unavailable',[['unavail-decision',ev.locator('p').first()],['unavail-a1',attempt(1).locator('h4')],['unavail-a2',attempt(2).locator('h4')]]);
  await runOffline('medium','uncertain');evidence.uncertain=await ev.innerText();
  await top(ev,140);await shot('uncertain',[['uncertain-decision',ev.locator('p').first()],['uncertain-a1',attempt(1).locator('h4')],['uncertain-a1-detail',attempt(1).locator('p').filter({hasText:'Creation:'})]]);
  await btn('Close and reconcile experiment').click().catch(()=>{});await page.waitForTimeout(1500);
  await c.liveDisabled();
  await c.codeTour([1,3,5,7]);
  await c.knowledge();
 }else{
  await open();await page.getByLabel('Effort',{exact:true}).selectOption('low');
  await top(page.getByLabel('Model',{exact:true}),200);
  await shot('live-config',[['live-model',page.getByLabel('Model',{exact:true})],['live-effort',page.getByLabel('Effort',{exact:true})],['live-budget',page.getByLabel('Primary budget (US cents)')]]);
  const cat=c.h('Server-owned capability catalog');await top(cat,110);
  await shot('live-catalog',[['live-catalog-models',cat.locator('xpath=following-sibling::ul[1]')]]);
  const run=btn('Run live');await top(run,300);await shot('live-run',[['live-run-button',run]]);
  await run.click();await page.waitForTimeout(1000);await done(320000);
  evidence.live=await ev.innerText();if(!/Source: managed-api/.test(evidence.live))throw Error('Not live: '+evidence.live.slice(0,300)+' / '+await status.innerText());
  const a=attempt(1);await top(ev,140);
  await shot('live-session',[['live-head',a.locator('h4')],['live-session-id',a.locator('p').filter({hasText:'Creation:'})],['live-resolved',a.locator('p').filter({hasText:'Requested:'})]]);
  const msg=a.locator('.agent-message').first();await top(msg,110);await shot('live-answer',[['live-answer-text',msg]]);
  const usage=a.locator('p').filter({hasText:'Reported usage:'});await top(usage,400);
  await shot('live-usage',[['live-usage-text',usage],['live-elapsed',a.locator('p').filter({hasText:'Host elapsed time'})]]);
  await btn('Close and reconcile experiment').click().catch(()=>{});await page.waitForTimeout(2000);
 }
}finally{await c.done();}
