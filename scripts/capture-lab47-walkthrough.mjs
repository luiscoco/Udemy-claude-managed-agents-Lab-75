// Capture Lab 47 (Model driven and host driven orchestration) for its step-by-step video.
// Usage: node scripts/capture-lab47-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button; every report is an authored offline fixture (provider calls 0).
import {start} from './lab_capture_common.mjs';
const c=await start(47,process.argv[2],/\/api\/c47\/(orchestrator|hierarchy|pipeline|fanout|evaluator)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 47 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab47-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();
const route=sec.locator('select').nth(0);const scenario=sec.locator('select').nth(1);const run=btn('Run offline coordination');
const worker=r=>sec.locator('.lab-results > section').filter({has:page.getByRole('heading',{name:new RegExp(`^${r} worker:`)})}).first();
const wp=(r,t)=>worker(r).locator('p').filter({hasText:t}).first();
// Wait for the real response and the UI state (button enabled again), not fixed timeouts: the machine is busy.
async function go(r,s){await route.selectOption(r);await scenario.selectOption(s);
 const resp=page.waitForResponse(x=>x.url().endsWith(`/api/c47/${r}`)&&x.request().method()==='POST',{timeout:60000});
 await run.click();await resp;await page.waitForFunction(()=>{const b=[...document.querySelectorAll('section[aria-labelledby="lab47-heading"] .lab-controls button')];const s=document.querySelector('[aria-label="Lab 47 status"]');return b.every(x=>!x.disabled)&&s&&s.textContent.startsWith('Verification gate:');},null,{timeout:30000});
 const id=`${r}-${s}`;evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();return id;}
try{
 await c.intro('Model driven and host driven orchestration');
 await open();const ex=c.h('Model driven and host driven orchestration',2);await top(ex,130);await run.waitFor();
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.routes=await route.locator('option').allInnerTexts();
 evidence.scenarios=await scenario.locator('option').allInnerTexts();evidence.start=await status.innerText();
 const nolive=sp('No live Managed session starts');evidence.nolive=await nolive.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-route',route],['exp-scenario',scenario],['exp-run',run],['exp-status',status]]);
 // Native route: worker threads inside ONE parent session.
 await go('orchestrator','regional-sales');await top(sp('Architecture: '),130);
 await shot('native',[['native-arch',sp('Architecture: ')],['native-parent',sp('Parent session: ')],['native-north',wp('north','Session ')],['native-south',wp('south','Session ')]]);
 await top(wp('south','Usage scope'),200);
 await shot('native-usage',[['native-scope',wp('south','Usage scope')],['native-final',c.h('Parent final text',3).locator('xpath=following-sibling::p[1]')],['native-shared',sp('Shared session usage:')],['native-notes',sec.locator('ul').first()]]);
 // Host route: independent sessions; the host owns the dependency graph and aggregates usage.
 await go('pipeline','regional-sales');await top(sp('Architecture: '),130);
 await shot('host',[['host-arch',sp('Architecture: ')],['host-parent',sp('Parent session: ')],['host-north',wp('north','Session ')],['host-south',wp('south','Session ')]]);
 await top(wp('south','Usage scope'),200);
 await shot('host-usage',[['host-scope',wp('south','Usage scope')],['host-aggregate',sp('Shared session usage:')],['host-notes',sec.locator('ul').first()]]);
 // Failure scenarios: the gate, not agent prose, controls the handoff.
 const gateShot=async(id,role)=>{await top(scenario,200);await shot(id,[[`${id}-scenario`,scenario],[`${id}-gate`,sp('Parent session: ')],[`${id}-worker`,worker(role).locator('h3')]]);};
 const detail=async(id,role,cues)=>{await top(worker(role).locator('h3'),200);await shot(id,cues);};
 await go('pipeline','incorrect-total');await gateShot('incorrect','south');
 await detail('incorrect-detail','south',[['incorrect-raw',wp('south','Raw report')],['incorrect-verified',wp('south','Verified report')],['incorrect-evidence',worker('south').locator('p').last()]]);
 await go('orchestrator','delayed-worker');await gateShot('delayed','south');
 await detail('delayed-detail','south',[['delayed-evidence',worker('south').locator('p').last()],['delayed-final',c.h('Parent final text',3).locator('xpath=following-sibling::p[1]')],['delayed-note',sec.locator('ul li').nth(1)]]);
 await go('fanout','dependency-failure');await gateShot('blocked','north');
 await detail('blocked-detail','north',[['blocked-raw',wp('north','Raw report')],['blocked-usage',wp('north','Usage scope')],['blocked-evidence',worker('north').locator('p').last()]]);
 await top(nolive,400);
 await shot('no-live',[['no-live-text',nolive],['no-live-status',status]]);
 await c.codeTour([1,2,3,5]);
 await c.knowledge();
}finally{await c.done();}
