// Capture Lab 32 (Plan review and execution gate) for its step-by-step video.
// Usage: node scripts/capture-lab32-walkthrough.mjs offline
// This lab is offline only: the page states that live use needs separately configured agents and has no Run live button.
import {start} from './lab_capture_common.mjs';
const c=await start(32,process.argv[2],/\/api\/c32\/(run|decide|who)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 32 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab32-heading"]');
const plan=page.locator('section[aria-label="Plan under review"]');const file=page.locator('section[aria-label="File evidence"]');
const pp=t=>plan.locator('p').filter({hasText:t}).first();const fp=t=>file.locator('p').filter({hasText:t}).first();
async function act(name,wait=1200){await btn(name).click();await page.waitForTimeout(wait);}
async function startPlan(s){await sec.locator('select').first().selectOption(s);await act('Start plan');await plan.waitFor();}
async function grab(id){evidence[id]=await sec.innerText();evidence[`${id}_status`]=await status.innerText();}
try{
 await c.intro('Plan review and execution gate');
 await open();const ex=c.h('Plan review and execution gate',2);await top(ex,130);
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',sec.locator('select').first()],['exp-start',btn('Start plan')]]);
 // Approval path: plan v1 is pending, a planning write is denied, approval runs one checked execution action.
 await startPlan('approval');await grab('plan');await top(plan,110);
 await shot('plan',[['plan-text',plan.locator('p').first()],['plan-hash',pp('Hash:')],['plan-sessions',pp('Planning session:')]]);
 await act('Try planning write');await grab('planning-write');await top(file,110);
 await shot('planning-write',[['pw-tool',fp('Last tool:')],['pw-effects',file.locator('p').first()],['pw-file',file.locator('pre')],['pw-status',status]]);
 await act('Approve current plan');await grab('approved');await top(pp('Planning session:'),110);
 await shot('approved',[['approved-sessions',pp('Planning session:')],['approved-file',file.locator('pre')],['approved-tool',fp('Last tool:')],['approved-status',status]]);
 await act('Try unselected execution tool');await grab('unselected');await top(file,110);
 await shot('unselected',[['unselected-tool',fp('Last tool:')],['unselected-effects',file.locator('p').first()]]);
 // Rejection path: no execution session and no file effect.
 await startPlan('rejection');await act('Reject plan');await grab('rejected');await top(pp('Planning session:'),110);
 await shot('rejected',[['rejected-sessions',pp('Planning session:')],['rejected-effects',file.locator('p').first()],['rejected-status',status]]);
 // Revision path: feedback creates plan v2 with a new hash; an approval that names v1 is refused as stale.
 await startPlan('revision');evidence.v1hash=await pp('Hash:').innerText();await act('Request revision');await grab('revised');await top(plan,110);
 await shot('revised',[['revised-title',plan.locator('h3')],['revised-text',plan.locator('p').first()],['revised-hash',pp('Hash:')]]);
 await act('Try stale approval');await grab('stale');await top(pp('Hash:'),110);
 await shot('stale',[['stale-button',btn('Try stale approval')],['stale-hash',pp('Hash:')],['stale-status',status]]);
 const nolive=sec.locator('p').filter({hasText:'Live use needs separately configured'}).first();await top(nolive,300);evidence.nolive=await nolive.innerText();
 await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,3,5,6]);
 await c.knowledge();
}finally{await c.done();}
