// Capture Lab 19 (Session inventory and explicit branches) for its step-by-step video.
// Usage: node scripts/capture-lab19-walkthrough.mjs offline|live
// "live" creates exactly one billed session, sends one follow-up turn to it, retrieves provider events, then archives it.
import {start} from './lab_capture_common.mjs';
const c=await start(19,process.argv[2],/\/api\/c19\/(turn|sessions\/[^/]+\/branch)$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Session experiment status',{exact:true});const det=page.locator('article[aria-label="Selected conversation evidence"]');
const inv=c.h('Owned conversation inventory');const invList=inv.locator('xpath=following-sibling::ul[1]');
const hostH=det.locator('h4',{hasText:'Host-captured events'});const hostList=hostH.locator('xpath=following-sibling::ol[1]');
const pageH=det.locator('h4',{hasText:'History page'});
const pfx=t=>det.locator('p').filter({hasText:t}).first();
async function done(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel active turn')&&!/^(Waiting|Creating)/.test(document.querySelector('[aria-label="Session experiment status"]')?.textContent??''),null,{timeout});await page.waitForTimeout(1000);}
async function prompt(t){await page.getByLabel('Session prompt',{exact:true}).fill(t);}
try{
 if(c.mode==='offline'){
  await c.intro('Session inventory and explicit branches');
  await open();await btn('Reset offline fixtures').click();await page.waitForTimeout(1000);
  const ex=c.h('Session inventory and explicit branches',2);await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-mode',page.getByLabel('Experiment mode',{exact:true})],['exp-prompt',page.getByLabel('Session prompt',{exact:true})],['exp-start',btn('Start offline session')]]);
  await btn('Start offline session').click();await page.waitForTimeout(500);await done();evidence.started=await det.innerText();
  await top(det,110);await shot('started',[['started-title',pfx('Title:')],['started-events',hostList]]);
  await prompt('What is my fictional project called?');await btn('Send another turn').click();await page.waitForTimeout(500);await done();evidence.continued=await det.innerText();
  await top(det,110);await shot('continued',[['continued-title',pfx('Title:')],['continued-events',hostList]]);
  await top(pageH,110);await shot('history-page',[['page-source',pageH.locator('xpath=following-sibling::p[1]')],['page-events',pageH.locator('xpath=following-sibling::ol[1]')]]);
  // Branch from the first assistant reply: the derived session gets an explicit summary of history up to that boundary.
  await hostList.locator('input[type=radio]').nth(1).check();await prompt('Continue from the summary: suggest one next step.');
  await top(hostList,200);await shot('boundary',[['boundary-events',hostList]]);
  await top(page.getByLabel('Session prompt',{exact:true}),200);await shot('derive',[['derive-prompt',page.getByLabel('Session prompt',{exact:true})],['derive-button',btn('Derive conversation')]]);
  await btn('Derive conversation').click();await page.waitForTimeout(500);await done();evidence.derived=await det.innerText();
  await top(det,110);await shot('derived',[['derived-title',pfx('Title:')],['derived-parent',pfx('Parent:')],['derived-summary',pfx('Explicit summary handoff')]]);
  await top(inv,110);evidence.inventory=await invList.innerText();await shot('inventory',[['inventory-list',invList]]);
  // Parent history remains intact.
  await invList.locator('li button').first().click();await page.waitForTimeout(1200);evidence.parent=await det.innerText();
  await top(det,110);await shot('parent',[['parent-title',pfx('Title:')],['parent-events',hostList]]);
  await btn('Rename idle session').click();await page.waitForTimeout(800);await btn('Tag idle session').click();await page.waitForTimeout(800);evidence.renamed=await det.innerText();
  await top(det,110);await shot('renamed',[['renamed-title',pfx('Title:')],['renamed-controls',det.locator('.lab-controls')]]);
  await btn('Archive idle session').click();await page.waitForTimeout(1000);evidence.archived=await det.innerText();evidence.archive_status=await status.innerText();
  await top(status,130);await shot('archived',[['archived-status',status],['archived-title',pfx('Title:')]]);
  // A separate fixture for explicit deletion.
  await prompt('A throwaway fictional note.');await btn('Start offline session').click();await page.waitForTimeout(500);await done();
  await btn('Delete selected idle session').click();await page.waitForTimeout(1200);evidence.deleted=await status.innerText();evidence.inventory_after=await invList.innerText();
  await top(status,130);await shot('deleted',[['deleted-status',status],['deleted-inventory',invList]]);
  await c.liveDisabled();
  await c.codeTour([1,3,6,7]);
  await c.knowledge();
 }else{
  await open();const run=btn('Run live');await top(run,300);await shot('live-run',[['live-prompt',page.getByLabel('Session prompt',{exact:true})],['live-run-button',run]]);
  await run.click();await page.waitForTimeout(1000);await done(200000);evidence.live_start=await det.innerText();evidence.live_status=await status.innerText();
  if(!/Remote session: sesn_[A-Za-z0-9]/.test(evidence.live_start)||/fixture/.test(evidence.live_start))throw Error('Not live: '+evidence.live_status);
  await top(det,110);await shot('live-started',[['live-started-title',pfx('Title:')],['live-started-events',hostList]]);
  await prompt('What is my fictional project called? Answer in one sentence.');await btn('Send another turn').click();await page.waitForTimeout(500);await done(200000);
  evidence.live_continued=await det.innerText();await top(det,110);await shot('live-continued',[['live-continued-title',pfx('Title:')],['live-continued-events',hostList]]);
  await btn('Retrieve provider metadata and events').click();await page.waitForTimeout(3000);evidence.live_provider=await det.innerText();
  await top(pageH,110);await shot('live-provider',[['live-page-source',pageH.locator('xpath=following-sibling::p[1]')],['live-page-events',pageH.locator('xpath=following-sibling::ol[1]')]]);
  await btn('Archive idle session').click();await page.waitForTimeout(2500);evidence.live_archived=await det.innerText();evidence.live_archive_status=await status.innerText();
  await top(status,130);await shot('live-archived',[['live-archived-status',status],['live-archived-title',pfx('Title:')]]);
 }
}finally{await c.done();}
