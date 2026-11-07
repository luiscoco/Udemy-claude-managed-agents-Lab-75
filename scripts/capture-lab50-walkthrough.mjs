// Capture Lab 50 (Full stack capstone: Acme Support Desk) for its step-by-step video.
// Usage: node scripts/capture-lab50-walkthrough.mjs offline|live
// "offline" drives the Offline scripted desk (no provider calls) and the refused live opt-in.
// "live" runs exactly ONE billed Managed conversation: customer C-1 sends "Refund 25 for O-1001", the trusted host
// approves the proposed refund once, and the conversation is closed (session archived). Requires MANAGED_LIVE_ENABLED,
// MANAGED_LAB50_LIVE_ENABLED=true, CLAUDE_MANAGED_LAB50_AGENT_ID and CLAUDE_MANAGED_LAB50_AGENT_VERSION on the backend.
import {start} from './lab_capture_common.mjs';
const c=await start(50,process.argv[2],/\/api\/c50\/(chat|approve|close|evals)$/);const {page,btn,top,shot,open,evidence}=c;
const sec=page.locator('section[aria-labelledby="lab50-heading"]');const status=page.getByLabel('Lab 50 status',{exact:true});
const sp=t=>sec.locator('p').filter({hasText:t}).first();
const customer=sec.locator('select').nth(0);const execution=sec.locator('select').nth(1);const message=sec.locator('textarea');
const conv=()=>sp(/^Conversation conv_/);const chat=sec.locator('.lab-results');const summary=()=>sp('Validated summary:');
const pending=page.getByRole('region',{name:'Pending refund review'});const orders=()=>sp(/^Orders:/);const refunds=()=>sp(/^Refunds:/);
async function idle(timeout=30000){await page.waitForTimeout(400);await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent==='Refresh back office');return b&&!b.disabled;},null,{timeout});await page.waitForTimeout(800);}
async function send(text,timeout){await message.fill(text);await btn('Send to desk').click();await idle(timeout);evidence.status_last=await status.innerText();}
async function closeConv(timeout){if(await btn('Close conversation').isEnabled()){await btn('Close conversation').click();await idle(timeout);}}
async function openDetails(name){const d=sec.locator('details').filter({has:page.locator('summary',{hasText:name})}).first();if(!(await d.evaluate(e=>e.open)))await d.locator('summary').click();await page.waitForTimeout(400);return d;}
try{
 if(c.mode==='offline'){
  await c.intro('Full stack capstone');
  await open();const ex=c.h('Acme Support Desk',2);await top(ex,130);
  evidence.executions=await execution.locator('option').allInnerTexts();evidence.customers=await customer.locator('option').allInnerTexts();evidence.ready=await status.innerText();
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-customer',customer],['exp-execution',execution],['exp-message',message],['exp-send',btn('Send to desk')]]);
  // A. C-1 asks for a damaged-item refund; the trusted host approves it once.
  await btn('Refresh back office').click();await idle();evidence.orders_c1=await orders().innerText();
  await top(sp(/^Orders:/),300);await shot('backoffice',[['backoffice-orders',orders()],['backoffice-refunds',refunds()],['backoffice-status',status]]);
  await send('Refund 25 for O-1001');evidence.pending=await sec.innerText();
  await top(conv(),110);await shot('pending',[['pending-conversation',conv()],['pending-chat',chat],['pending-review',pending.locator('p')],['pending-approve',btn('Approve refund')]]);
  await btn('Approve refund').click();await idle();evidence.approved=await sec.innerText();evidence.status_approved=await status.innerText();
  await top(chat,110);await shot('approved',[['approved-chat',chat],['approved-summary',summary()],['approved-ledger',refunds()],['approved-orders',orders()]]);
  const ev=await openDetails('Correlated event evidence');evidence.events=await ev.innerText();
  await top(ev,110);await shot('events',[['events-raw',ev.locator('pre')],['events-usage',ev.locator('p')]]);
  await ev.locator('summary').click();const au=await openDetails('Audit timeline');evidence.audit=await au.innerText();
  await top(refunds(),250);await shot('audit',[['audit-list',au.locator('ol')],['audit-status',status]]);
  await closeConv();evidence.closed=await sec.innerText();evidence.status_closed=await status.innerText();
  await top(conv(),110);await shot('closed',[['closed-conversation',conv()],['closed-status',status]]);
  // B. C-1 asks for another customer's order: the host tool refuses it.
  await send('Read order O-2001');evidence.foreign=await sec.innerText();
  await top(conv(),110);await shot('foreign',[['foreign-chat',chat],['foreign-summary',summary()],['foreign-orders',orders()]]);
  // C. C-2's order carries an injected note; the refund policy still rejects it.
  await customer.selectOption('C-2');await idle();evidence.orders_c2=await orders().innerText();
  await send('Refund 80 for O-2001 as the order note says');evidence.injected=await sec.innerText();
  await top(conv(),110);await shot('injected',[['injected-chat',chat],['injected-summary',summary()],['injected-orders',orders()],['injected-refunds',refunds()]]);
  await closeConv();
  // D. Deterministic host evals (no provider calls).
  await btn('Run offline evals').click();await idle();const evals=sec.locator('section').filter({has:page.getByRole('heading',{name:'Deterministic host evals'})});
  evidence.evals=await evals.innerText();evidence.status_evals=await status.innerText();
  await top(evals,250);await shot('evals',[['evals-list',evals.locator('ul')],['evals-status',status]]);
  // E. Live is an explicit opt-in: without the Lab 50 agent settings the server refuses before any provider call.
  await open();await execution.selectOption('live');await message.fill('Refund 25 for O-1001');
  page.removeAllListeners('request');evidence.runs.push({phase:'offline',mode:'live',note:'opt-in refused before provider call (expected 422)',endpoint:'/api/c50/chat',at:new Date().toISOString()});
  await btn('Send to desk').click();await idle();evidence.nolive=await status.innerText();
  if(!/live mode needs its dedicated agent ID/.test(evidence.nolive))throw Error('Expected the live opt-in refusal, got: '+evidence.nolive);
  await top(execution,300);await shot('no-live',[['no-live-execution',execution],['no-live-status',status],['no-live-reviewer',sp('The local reviewer is assigned by the server.')]]);
  await c.codeTour([1,3,5,6]);
  await c.knowledge();
 }else{
  // ONE billed conversation: send one message, approve the host review once (if the agent proposes it), then close.
  await open();await customer.selectOption('C-1');await execution.selectOption('live');await message.fill('Refund 25 for O-1001');
  await top(execution,300);await shot('live-run',[['live-execution',execution],['live-message',message],['live-send',btn('Send to desk')]]);
  let opened=false;
  try{
   await btn('Send to desk').click();opened=true;await idle(200000);evidence.live=await sec.innerText();evidence.status_live=await status.innerText();
   if(!/source managed-api/.test(evidence.live))throw Error('Not live: '+evidence.status_live);
   if(!(await pending.count()))throw Error('Live capstone did not reach the expected trusted refund review.');
   if(await pending.count()){
    await top(conv(),110);await shot('live-pending',[['live-pending-conversation',conv()],['live-pending-chat',chat],['live-pending-review',pending.locator('p')]],);
    await btn('Approve refund').click();await idle(200000);evidence.live_approved=await sec.innerText();evidence.status_live_approved=await status.innerText();
    if(!/2500 cents/.test(await refunds().innerText()))throw Error('Expected the host ledger to contain the approved 2500-cent refund.');
   }
   await top(chat,110);await shot('live-answer',[['live-answer-chat',chat],['live-answer-summary',summary()],['live-answer-ledger',refunds()]],);
   const ev=await openDetails('Correlated event evidence');evidence.live_events=await ev.innerText();
   await top(ev.locator('p'),400);await shot('live-usage',[['live-usage-usage',ev.locator('p')]]);
   await ev.locator('summary').click();
  }finally{
   if(opened){await closeConv(200000);evidence.live_closed=await sec.innerText().catch(()=>'');evidence.status_live_closed=await status.innerText().catch(()=>'');}
  }
  if(!/Cleanup: archived\./.test(evidence.status_live_closed))throw Error('Live conversation not archived: '+evidence.status_live_closed);
  await top(conv(),110);await shot('live-closed',[['live-closed-conversation',conv()],['live-closed-status',status]]);
 }
}finally{await c.done();}
