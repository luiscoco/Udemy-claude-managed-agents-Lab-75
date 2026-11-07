// Capture Lab 26 (Session controls and supported updates) for its step-by-step video.
// Usage: node scripts/capture-lab26-walkthrough.mjs offline
// This lab is offline only: the page states "Live mode is unavailable in this lab" and has no Run live button.
import {start} from './lab_capture_common.mjs';
const c=await start(26,process.argv[2],/\/api\/c26\/(open|call)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 26 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab26-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const histH=c.h('Authored history');
async function act(name,wait=1500){await btn(name).click();await page.waitForTimeout(wait);}
async function statusShot(id,extra=[],anchor=null){await top(anchor??status,anchor?120:250);evidence[id]=await status.innerText();await shot(id,[[`${id}-status`,status],...extra]);}
try{
 await c.intro('Session controls and supported updates');
 await open();const ex=c.h('Session controls and supported updates',2);await top(ex,130);
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-fields',ex.locator('xpath=following-sibling::p[2]')],['exp-open',btn('Open offline session')]]);
 await act('Open offline session');const head=sp('· version');await top(head,200);evidence.opened=await sec.innerText();
 await shot('opened',[['opened-session',head],['opened-tools',sp('Tools:')]]);
 // The slow fixture turn runs for 1.2 s: an idle-only update sent meanwhile is refused.
 await act('Send slow turn',300);await act('Replace idle tools and MCP',300);await statusShot('update-running',[['update-running-session',head]],head);
 // Let that turn finish, then send another one and interrupt it at once.
 await page.waitForTimeout(1500);await act('Retrieve',800);await act('Send slow turn',200);await act('Interrupt and confirm idle',800);
 await statusShot('interrupted',[['interrupted-session',head]],head);
 await top(histH,110);evidence.history=await histH.locator('xpath=following-sibling::ol[1]').innerText();await shot('history',[['history-list',histH.locator('xpath=following-sibling::ol[1]')]]);
 await page.getByLabel('Keep read_report tool').check();await act('Replace idle tools and MCP');await statusShot('replaced',[['replaced-tools',sp('Tools:')]],sp('Tools:'));
 const cr=page.getByLabel('Opt in to possible resume');if(await cr.isChecked())await cr.uncheck();
 await page.getByLabel('Budget cents').fill('20');await act('Change budget');await statusShot('budget-no-optin',[['budget-no-optin-tools',sp('Budget:')]],sp('Tools:'));
 await cr.check();await act('Change budget');await statusShot('budget-optin',[['budget-optin-tools',sp('Budget:')]],sp('Tools:'));
 await act('Update title and metadata');await statusShot('title',[['title-inputs',page.getByLabel('Title',{exact:true})],['title-session',head]],head);
 await act('New session with summary',2500);evidence.handoff=await sec.innerText();
 await top(head,200);await shot('handoff',[['handoff-session',head],['handoff-parent',sp('Parent:')]]);
 await act('Archive idle session');await statusShot('archived',[['archived-session',head]],head);
 const nolive=sp('Live mode is unavailable in this lab');await top(nolive,300);evidence.nolive=await nolive.innerText();await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,3,4,5]);
 await c.knowledge();
}finally{await c.done();}
