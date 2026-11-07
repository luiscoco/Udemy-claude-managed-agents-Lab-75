// Capture Lab 13 (MCP connections and reachability) for its step-by-step video.
// Usage: node scripts/capture-lab13-walkthrough.mjs offline|live
// "live" runs exactly one billed turn through the typed host bridge to the local MCP servers, then closes the session.
// Native Managed HTTPS MCP needs a reviewed public endpoint and vault, so it is explained, not run.
import {start} from './lab_capture_common.mjs';
const c=await start(13,process.argv[2],/\/api\/c13\/(session|query|send)$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.locator('section[aria-labelledby="c13-heading"] p[role="status"]');const q=page.locator('div[aria-label="MCP evidence"]');
const conns=q.locator('h4:text-is("Last connection observations") ~ article.report-turn').filter({has:page.locator('h5')});
const calls=q.locator('h4:text-is("Actual tool evidence") ~ article.report-turn');
const head=q.locator('p').filter({hasText:'State:'}).first();
async function idle(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel experiment')&&/State: (idle|closed)/.test(document.querySelector('div[aria-label="MCP evidence"]')?.textContent??''),null,{timeout});await page.waitForTimeout(1000);}
const callH5=(name)=>calls.filter({has:page.locator('h5',{hasText:name})}).last();
async function check(label,on){const b=page.getByLabel(label,{exact:true});if((await b.isChecked())!==on)await b.click();}
try{
 if(c.mode==='offline'){
  await c.intro('MCP connections and reachability');
  await open();const ex=c.h('Connect MCP tools and inspect reachability');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',page.getByLabel('Offline connection scenario',{exact:true})],['exp-integration',page.getByLabel('Live integration',{exact:true})],['exp-config',page.locator('fieldset').filter({hasText:'Server and tool configuration'})]]);
  await btn('Run offline MCP experiment').click();await idle();evidence.working=await q.innerText();
  await top(conns.first(),110);
  await shot('connections',[['conn-notes',conns.nth(0)],['conn-inventory',conns.nth(1)]]);
  await top(calls.first(),110);evidence.calls=await calls.allInnerTexts();
  await shot('calls',[['call-notes',calls.nth(0).locator('h5')],['call-notes-path',calls.nth(0).locator('p')],['call-stock',calls.nth(1).locator('h5')]]);
  const stock=q.locator('h4:text-is("Owned local inventory")');await top(stock,110);
  await shot('stock',[['stock-scope',stock.locator('xpath=following-sibling::p[1]')],['stock-list',stock.locator('xpath=following-sibling::ul[1]')]]);
  // Enable reservation while idle and attempt one reservation.
  await check('Enable fictional stock reservation tool',true);await btn('Apply idle MCP configuration').click();await page.waitForTimeout(1500);
  await page.getByLabel('Offline authored tool plan',{exact:true}).selectOption('reserve');
  const fs=page.locator('fieldset').filter({hasText:'Server and tool configuration'});await top(fs,130);evidence.reserve_apply=await status.innerText();
  await shot('reserve-config',[['reserve-checkbox',page.getByText('Enable fictional stock reservation tool',{exact:true})],['reserve-apply',btn('Apply idle MCP configuration')],['reserve-plan',page.getByLabel('Offline authored tool plan',{exact:true})]]);
  await btn('Run offline MCP experiment').click();await idle();evidence.reserve=await q.innerText();
  const r=callH5('reserve_stock');await top(r,110);
  await shot('reserve',[['reserve-call',r.locator('h5')],['reserve-result',r.locator('pre')]]);
  await top(stock,110);evidence.reserve_stock=await stock.locator('xpath=following-sibling::ul[1]').innerText();await shot('reserve-stock',[['reserve-stock-list',stock.locator('xpath=following-sibling::ul[1]')]]);
  // Disable the inventory server while idle and attempt the same call.
  await check('Enable inventory server',false);await btn('Apply idle MCP configuration').click();await page.waitForTimeout(1500);
  await btn('Run offline MCP experiment').click();await idle();evidence.disabled=await q.innerText();
  await top(conns.first(),110);
  await shot('disabled',[['disabled-inventory',conns.filter({hasText:'inventory'}).first()]]);
  const rej=calls.last();await top(rej,110);await shot('disabled-call',[['disabled-call-head',rej.locator('h5')],['disabled-call-path',rej.locator('p')],['disabled-call-text',rej.locator('pre')]]);
  await top(stock,110);evidence.disabled_stock=await stock.locator('xpath=following-sibling::ul[1]').innerText();await shot('disabled-stock',[['disabled-stock-list',stock.locator('xpath=following-sibling::ul[1]')]]);
  await btn('Close MCP session').click();await page.waitForTimeout(2000);
  // Unauthorized: a local HTTP 401 is not a cloud reachability test.
  await open();await page.getByLabel('Offline connection scenario',{exact:true}).selectOption('unauthorized');
  await btn('Run offline MCP experiment').click();await idle();evidence.unauthorized=await q.innerText();
  await top(conns.first(),110);await shot('unauthorized',[['unauth-inventory',conns.filter({hasText:'inventory'}).first()],['unauth-calls',calls.first().or(q.locator('p').filter({hasText:'No tool calls observed.'})).first()]]);
  await btn('Close MCP session').click();await page.waitForTimeout(1500);
  await c.liveDisabled();
  await c.codeTour([1,3,4,5]);
  await c.knowledge();
 }else{
  await open();const integ=page.getByLabel('Live integration',{exact:true});await top(integ,200);
  await shot('live-question',[['live-integration',integ],['live-prompt',page.getByLabel('User question',{exact:true})]]);
  const run=btn('Run live');await top(run,300);await shot('live-run',[['live-run-button',run]]);
  await run.click();await idle(240000);evidence.live=await q.innerText();if(!/Source: managed-api/.test(evidence.live))throw Error('Not live: '+evidence.live.slice(0,300));
  await top(q,110);await shot('live-session',[['live-head',head],['live-conn-notes',conns.nth(0).locator('h5')],['live-conn-inventory',conns.nth(1).locator('h5')]]);
  await top(calls.first(),110);evidence.live_calls=await calls.allInnerTexts();
  await shot('live-calls',[['live-call-1',calls.nth(0).locator('h5')],['live-call-1-path',calls.nth(0).locator('p')],['live-call-2',calls.nth(1).locator('h5')]]);
  const turns=q.locator('h4:text-is("Agent turns")');const msg=q.locator('.agent-message').last();await top(turns,110);
  await shot('live-answer',[['live-outcome',turns.locator('xpath=following-sibling::article[1]/p[1]')],['live-answer-text',msg]]);
  await btn('Close MCP session').click();await page.waitForFunction(()=>/State: closed/.test(document.querySelector('div[aria-label="MCP evidence"]')?.textContent??''),null,{timeout:90000});await page.waitForTimeout(1000);
  evidence.live_close=await q.innerText();await top(q,110);await shot('live-close',[['live-close-head',head],['live-close-cleanup',q.locator('p').filter({hasText:'Cleanup:'}).first()]]);
 }
}finally{await c.done();}
