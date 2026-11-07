// Capture Lab 11 (Managed skills and progressive loading) for its step-by-step video.
// Usage: node scripts/capture-lab11-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" runs exactly one billed fresh session with the pinned v1 skill
// (requires `npm run skills:upload -- v1` and live mode in the backend).
import {start} from './lab_capture_common.mjs';
const c=await start(11,process.argv[2],/\/api\/c11\/(new-session|invoke)/);const {page,btn,top,shot,open,evidence}=c;
const status=page.locator('p[role="status"]').last();
const article=label=>page.locator(`article[aria-label="${label} result"]`).last();
async function settle(n,timeout=90000){await page.waitForFunction(k=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel experiment')&&document.querySelectorAll('article.report-turn').length>=k,n,{timeout});await page.waitForTimeout(1000);}
async function articleShots(id,label){const a=article(label);await top(a,110);evidence[`${id}_text`]=(await a.innerText()).slice(0,3000);
 await shot(id,[[`${id}-header`,a.locator('h4')],[`${id}-attachment`,a.locator('p').filter({hasText:'Configured attachment'})],[`${id}-reads`,a.locator('h5 + ul, h5 + p').first()]]);}
try{
 if(c.mode==='offline'){
  await c.intro('Managed skills and progressive loading');
  await open();const ex=c.h('Inspect skill metadata and progressive loading');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-question',page.getByLabel('User question',{exact:true})],['exp-variant',page.getByLabel('Skill variant',{exact:true})],['exp-scenario',page.getByLabel('Offline loading scenario',{exact:true})]]);
  const bundle=c.h('Authored bundle and configured pins');await top(bundle,110);
  const pins=page.locator('p').filter({hasText:'Configured pins:'});await pins.waitFor();evidence.pins_offline=await pins.innerText();
  await shot('bundle',[['bundle-readonly',bundle.locator('xpath=following-sibling::p[1]')],['bundle-pins',pins],['bundle-files',page.locator('section ul').filter({hasText:'SKILL.md'}).first()]]);
  await btn('Preview authored instructions').click();const preview=page.locator('pre').filter({hasText:'name: format-observation'}).first();await preview.waitFor();
  await top(page.getByRole('button',{name:'Preview authored instructions'}),110);
  await shot('preview',[['preview-code',preview],['preview-status',status]]);
  // With pinned skill: successful reads, then metadata only, then failed read.
  for(const [scenario,id] of [['reads','reads'],['metadata-only','metadata'],['failed-read','failed']]){
   await page.getByLabel('Offline loading scenario',{exact:true}).selectOption(scenario);const n=await page.locator('article.report-turn').count();
   await btn('Run offline skill experiment').click();await settle(n+1);await articleShots(id,'With pinned skill');
  }
  const answer=article('With pinned skill').locator('.agent-message').first();
  await btn('Clear comparisons').click();await page.getByLabel('Offline loading scenario',{exact:true}).selectOption('reads');
  await btn('Compare all offline variants').click();await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel experiment'),null,{timeout:120000});await page.waitForTimeout(1000);
  evidence.compare_status=await status.innerText();evidence.compare_articles=await page.locator('article.report-turn h4').allInnerTexts();
  const first=page.locator('article.report-turn').first();await top(first,110);
  await shot('compare-without',[['without-header',first.locator('h4')],['without-attachment',first.locator('p').filter({hasText:'Configured attachment'})],['without-reads',first.locator('h5 + ul, h5 + p').first()]]);
  const last=page.locator('article.report-turn').last();await top(last,110);evidence.compare_last=(await last.innerText()).slice(0,3000);
  await shot('compare-revised',[['revised-header',last.locator('h4')],['revised-attachment',last.locator('p').filter({hasText:'Configured attachment'})],['revised-answer',last.locator('.agent-message').first()]]);
  await c.liveDisabled();
  await c.codeTour([1,3,4,7]);
  await c.knowledge();
 }else{
  await open();await btn('Refresh pin metadata').click();await page.waitForTimeout(1500);
  const ready=page.locator('p').filter({hasText:'Base live setup:'});await ready.waitFor();evidence.live_ready=await ready.innerText();
  if(!/selected skill pin is ready/.test(evidence.live_ready))throw Error('Pin not ready: '+evidence.live_ready);
  await top(ready,250);await shot('live-ready',[['live-pin-ready',ready],['live-pins',page.locator('p').filter({hasText:'Configured pins:'})]]);
  const q=page.getByLabel('User question',{exact:true});await top(q,200);await shot('live-question',[['live-question-text',q],['live-variant',page.getByLabel('Skill variant',{exact:true})]]);
  const run=btn('Run live');await top(run,400);await shot('live-run',[['live-run-button',run]]);
  await run.click();await settle(1,200000);
  const a=article('With pinned skill');evidence.live_text=await a.innerText();if(!/Source: managed-api/.test(evidence.live_text))throw Error('Not live: '+evidence.live_text.slice(0,400));
  await top(a,110);
  await shot('live-session',[['live-header',a.locator('h4')],['live-source',a.locator('p').filter({hasText:'Source:'}).first()],['live-attachment',a.locator('p').filter({hasText:'Configured attachment'})],['live-resolved',a.locator('p').filter({hasText:'Resolved version'}).first()]]);
  const reads=a.locator('h5 + ul, h5 + p').first();await top(a.locator('h5'),110);
  await shot('live-reads',[['live-reads-list',reads],['live-evidence-note',reads.locator('xpath=following-sibling::p[1]')]]);
  const msg=a.locator('.agent-message').first();await top(msg,110);await shot('live-answer',[['live-answer-text',msg]]);
  const usage=a.locator('p').filter({hasText:'Interruption:'});await top(usage,400);await shot('live-usage',[['live-usage-text',usage]]);
 }
}finally{await c.done();}
