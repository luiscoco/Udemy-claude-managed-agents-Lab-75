// Capture Lab 17 (Host snapshots and file restoration) for its step-by-step video.
// Usage: node scripts/capture-lab17-walkthrough.mjs offline|live
// "live" creates exactly one billed text-only session (its first read-notes turn runs automatically),
// takes a host snapshot, sends one edit-notes turn, restores the tracked files, then closes the session.
import {start} from './lab_capture_common.mjs';
const c=await start(17,process.argv[2],/\/api\/c17\/(session|send|oneshot)$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Snapshot experiment status',{exact:true});const ev=page.locator('div[aria-label="Snapshot evidence"]');
const head=ev.locator('p').first();const card=p=>page.locator(`article[aria-label="${p}"]`);
const snaps=c.h('Host snapshots');const conv=c.h('Conversation history');const plan=page.locator('article[aria-label="Restore plan"]');
async function idle(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel active turn')&&/State: (idle|prepared|closed)/.test(document.querySelector('div[aria-label="Snapshot evidence"]')?.textContent??''),null,{timeout});await page.waitForTimeout(1000);}
async function turn(action,text){await page.getByLabel('Host action',{exact:true}).selectOption(action);await page.getByLabel('Host text or new status').fill(text);await btn('Send turn and run host handler').click();await page.waitForTimeout(500);await idle();}
async function filesShot(id){const grid=page.locator('.provenance-grid').first();await top(grid,110);evidence[id]=await ev.innerText();
 const cards=await grid.locator('article h4').allInnerTexts();await shot(id,cards.map((t,i)=>[`${id}-file${i+1}`,grid.locator('article').nth(i)]));}
async function snapshotAndRestore(prefix){
 await btn('Dry-run restore').click();await plan.waitFor();await page.waitForTimeout(800);evidence[`${prefix}plan`]=await plan.innerText();
 await top(plan,110);await shot(`${prefix}plan`,[[`${prefix}plan-id`,plan.locator('p')],[`${prefix}plan-changes`,plan.locator('ul, p').last()]]);
 await btn('Confirm restore').click();await page.waitForTimeout(1500);evidence[`${prefix}restored`]=await ev.innerText();evidence[`${prefix}restore_status`]=await status.innerText();
 await top(status,130);await shot(`${prefix}restore-status`,[[`${prefix}restore-status-text`,status],[`${prefix}restore-head`,head]]);
}
try{
 if(c.mode==='offline'){
  await c.intro('Host snapshots and file restoration');
  await open();const ex=c.h('Restore host files, keep the conversation');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-start',btn('Start offline fixture session')],['exp-snapshot',btn('Take host snapshot')]]);
  await btn('Start offline fixture session').click();await head.waitFor();await idle();
  await top(head,130);await shot('session',[['session-head',head]]);
  await filesShot('files-before');
  await btn('Take host snapshot').click();await page.waitForTimeout(1500);await top(snaps,110);evidence.snapshot=await snaps.locator('xpath=following-sibling::ul[1]').innerText();
  await shot('snapshot',[['snapshot-list',snaps.locator('xpath=following-sibling::ul[1]')]]);
  await turn('edit-notes','reviewed');await turn('create-draft','First draft of the Aurora Finch summary.');await turn('create-untracked','scratch');
  const fs=page.locator('fieldset').filter({hasText:'Bounded host handler'});await top(fs,130);
  await shot('handler',[['handler-action',page.getByLabel('Host action',{exact:true})],['handler-text',page.getByLabel('Host text or new status')],['handler-send',btn('Send turn and run host handler')]]);
  await filesShot('files-changed');
  await top(conv,110);evidence.history_before=await conv.locator('xpath=following-sibling::ol[1]').innerText();
  await shot('history',[['history-list',conv.locator('xpath=following-sibling::ol[1]')]]);
  await page.getByLabel('Snapshot',{exact:true}).selectOption({index:1});
  await snapshotAndRestore('');
  await filesShot('files-restored');
  await top(conv,110);evidence.history_after=await conv.locator('xpath=following-sibling::ol[1]').innerText();
  await shot('history-after',[['history-after-list',conv.locator('xpath=following-sibling::ol[1]')]]);
  await btn('Close session').click();await page.waitForTimeout(1500);
  await c.liveDisabled();
  await c.codeTour([1,3,6,7]);
  await c.knowledge();
 }else{
  await open();const run=btn('Run live');await top(run,300);await shot('live-run',[['live-run-button',run]]);
  await run.click();await page.waitForTimeout(1500);await idle(200000);
  evidence.live_start=await ev.innerText();if(!/Source: managed-api/.test(evidence.live_start))throw Error('Not live: '+await status.innerText());
  await top(head,130);await shot('live-session',[['live-head',head]]);
  await btn('Take host snapshot').click();await page.waitForTimeout(1500);
  await turn('edit-notes','reviewed');evidence.live_edit=await ev.innerText();
  await filesShot('live-files-changed');
  await top(conv,110);evidence.live_history=await conv.locator('xpath=following-sibling::ol[1]').innerText();
  await shot('live-history',[['live-history-list',conv.locator('xpath=following-sibling::ol[1]')]]);
  await page.getByLabel('Snapshot',{exact:true}).selectOption({index:1});
  await snapshotAndRestore('live-');
  await filesShot('live-files-restored');
  await top(conv,110);evidence.live_history_after=await conv.locator('xpath=following-sibling::ol[1]').innerText();
  await shot('live-history-after',[['live-history-after-list',conv.locator('xpath=following-sibling::ol[1]')]]);
  await btn('Close session').click();await page.waitForTimeout(3000);evidence.live_close=await ev.innerText();
  await top(head,130);await shot('live-close',[['live-close-head',head]]);
 }
}finally{await c.done();}
