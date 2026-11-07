// Capture Lab 12 (Multiple messages in one session) for its step-by-step video.
// Usage: node scripts/capture-lab12-walkthrough.mjs offline|live
// "live" creates exactly one billed session, queues the two-message script into it, then closes and archives it.
import {start} from './lab_capture_common.mjs';
const c=await start(12,process.argv[2],/\/api\/c12\/(session|send|script|new-model-session)$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.locator('section[aria-labelledby="c12-heading"] p[role="status"]');const q=page.locator('div[aria-label="Queue evidence"]');
const cmds=q.locator('article.report-turn');const stateP=q.locator('p').filter({hasText:'State:'});
async function until(fn,arg,timeout=90000){await page.waitForFunction(fn,arg,{timeout});await page.waitForTimeout(800);}
const states=()=>page.evaluate(()=>[...document.querySelectorAll('div[aria-label="Queue evidence"] article h4')].map(h=>h.textContent));
async function finished(n,timeout){await until(k=>{const h=[...document.querySelectorAll('div[aria-label="Queue evidence"] article h4')];return h.length>=k&&h.every(x=>!/^(admitted|submitting|accepted):/.test(x.textContent))&&/State: idle/.test(document.querySelector('div[aria-label="Queue evidence"]')?.textContent??'');},n,timeout);}
async function cmdShot(id,i,note){const a=cmds.nth(i);await top(a,110);evidence[`${id}_text`]=await a.innerText();
 await shot(id,[[`${id}-state`,a.locator('h4')],[`${id}-text`,a.locator('p').first()],[`${id}-ids`,a.locator('p').filter({hasText:'Local command:'})],[`${id}-times`,a.locator('p').filter({hasText:'Admitted:'})],...(note?[[`${id}-output`,a.locator('pre').or(a.locator('p').filter({hasText:'Agent event IDs'})).first()]]:[])]);}
try{
 if(c.mode==='offline'){
  await c.intro('Multiple messages in one session');
  await open();const ex=c.h('Admit messages, then inspect their turns');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-create',btn('Create offline session')],['exp-message',page.getByLabel('Message',{exact:true})]]);
  await btn('Create offline session').click();await stateP.waitFor();await page.waitForTimeout(800);evidence.session=await q.innerText();
  await top(q,110);await shot('session',[['session-mode',q.locator('p').first()],['session-state',stateP],['session-config',q.locator('p').filter({hasText:'Model:'})]]);
  // One normal message: local command ID and provider user event ID are different.
  await btn('Queue message').click();await finished(1);await cmdShot('one',0,true);
  // Slow first message, then a follow-up queued while busy.
  await page.getByLabel('Offline scenario',{exact:true}).selectOption('slow');await btn('Queue two-message script').click();
  await finished(3,120000);evidence.order_states=await states();
  await cmdShot('slow',1,false);await cmdShot('followup',2,true);
  // Oversized input is rejected before admission.
  await page.getByLabel('Offline scenario',{exact:true}).selectOption('normal');const msg=page.getByLabel('Message',{exact:true});
  await msg.fill('Aurora Finch '.repeat(84));await btn('Queue message').click();await page.waitForTimeout(1500);evidence.oversized=await status.innerText();
  await top(status,130);await shot('oversized',[['oversized-text',msg],['oversized-count',page.locator('p.muted').filter({hasText:'characters /'})],['oversized-status',status]]);
  await msg.fill('Describe the fictional Aurora Finch notebook in one sentence.');
  // Idle tools update.
  const det=page.locator('summary').filter({hasText:'Idle configuration and explicit context handoff'});await det.click();
  await page.getByLabel('Tool preset',{exact:true}).selectOption('read-only');await btn('Apply idle tools/MCP update').click();
  await until(()=>/Tools: read-only/.test(document.querySelector('div[aria-label="Queue evidence"]')?.textContent??''),null,30000);
  await top(det,120);await shot('tools',[['tools-rule',det.locator('xpath=following-sibling::p[1]')],['tools-preset',page.getByLabel('Tool preset',{exact:true})],['tools-apply',btn('Apply idle tools/MCP update')]]);
  await top(status,130);await shot('tools-status',[['tools-status-text',status],['tools-config',q.locator('p').filter({hasText:'Model:'})]]);
  await btn('Close queue and clean up').click();await until(()=>/State: closed/.test(document.querySelector('div[aria-label="Queue evidence"]')?.textContent??''),null,30000);
  evidence.close=await q.innerText();await top(q,110);
  await shot('close',[['close-state',stateP],['close-cleanup',q.locator('p').filter({hasText:'Cleanup:'})]]);
  // Close pending work: a hanging turn plus a waiting follow-up.
  await open();await btn('Create offline session').click();await stateP.waitFor();
  await page.getByLabel('Offline scenario',{exact:true}).selectOption('hang');await btn('Queue two-message script').click();
  await until(()=>/State: running/.test(document.querySelector('div[aria-label="Queue evidence"]')?.textContent??''),null,30000);await page.waitForTimeout(1500);
  await btn('Close queue and clean up').click();await until(()=>/State: (closed|cleanup-pending)/.test(document.querySelector('div[aria-label="Queue evidence"]')?.textContent??''),null,60000);
  evidence.hang_close=await q.innerText();await top(stateP,130);
  await shot('hang-close',[['hang-state',stateP],['hang-interrupt',q.locator('p').filter({hasText:'Interruption:'})],['hang-first',cmds.nth(0).locator('h4')],['hang-second',cmds.nth(1).locator('h4')]]);
  await c.liveDisabled();
  await c.codeTour([1,3,4,5]);
  await c.knowledge();
 }else{
  await open();const run=btn('Run live');await top(run,300);await shot('live-run',[['live-run-button',run]]);
  await run.click();await stateP.waitFor({timeout:60000});await until(()=>/State: idle/.test(document.querySelector('div[aria-label="Queue evidence"]')?.textContent??''),null,60000);
  evidence.live_session=await q.innerText();if(!/managed-api/.test(evidence.live_session))throw Error('Not live');
  await top(q,110);await shot('live-session',[['live-mode',q.locator('p').first()],['live-state',stateP],['live-config',q.locator('p').filter({hasText:'Model:'})]]);
  await btn('Queue two-message script').click();await finished(2,200000);evidence.live_states=await states();
  await cmdShot('live1',0,true);await cmdShot('live2',1,true);
  await btn('Close queue and clean up').click();await until(()=>/State: closed/.test(document.querySelector('div[aria-label="Queue evidence"]')?.textContent??''),null,90000);
  evidence.live_close=await q.innerText();await top(q,110);
  await shot('live-close',[['live-close-state',stateP],['live-close-cleanup',q.locator('p').filter({hasText:'Cleanup:'})]]);
 }
}finally{await c.done();}
