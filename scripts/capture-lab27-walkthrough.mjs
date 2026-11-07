// Capture Lab 27 (Remote work beyond a browser connection) for its step-by-step video.
// Usage: node scripts/capture-lab27-walkthrough.mjs offline   (this lab has no live mode)
// The slow fixture completes about 1.2 seconds after open, so the running/detached shots act quickly.
import {start} from './lab_capture_common.mjs';
const c=await start(27,process.argv[2],/\/api\/c27\/(open|oneshot|call)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 27 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab27-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();
async function act(name,wait=1500){await btn(name).click();await page.waitForTimeout(wait);}
async function taskShot(id,extra=[]){await top(sp('; session '),200);evidence[id]=await sec.innerText();
 await shot(id,[[`${id}-state`,sp('Task: ')],[`${id}-events`,sp('Observed event IDs:')],[`${id}-status`,status],...extra]);}
try{
 await c.intro('Remote work beyond a browser connection');
 await open();const ex=c.h('Remote work beyond a browser connection',2);await top(ex,130);
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-allow',sec.locator('label').filter({hasText:'Allow host background work'})],['exp-open',btn('Open slow offline task')]]);
 // Slow task: open, detach immediately while it is still running.
 await act('Open slow offline task',250);evidence.opened=await sec.innerText();
 await act('Detach browser',250);await taskShot('detached',[['detached-ids',sp('; session ')]]);
 // The authored completion event arrives while the browser is detached; reconnect reads the same entry.
 await page.waitForTimeout(1800);await act('Reconnect same task');
 await taskShot('reconnected',[['reconnected-counts',sp('Provider creates:')],['reconnected-report',sp('Report: ')]]);
 await act('Close idle session');await taskShot('closed');
 // Second slow task: stop before it completes.
 await act('Open slow offline task',250);await act('Stop and confirm idle',600);
 await taskShot('stopped',[['stopped-counts',sp('Provider creates:')]]);
 await act('Close idle session');evidence.stopClosed=await sec.innerText();
 // Completed one-shot: open and archive in one request.
 await act('Run completed one-shot');await taskShot('oneshot',[['oneshot-report',sp('Report: ')]]);
 // Host policy refuses background work.
 await page.getByLabel('Allow host background work').uncheck();await act('Open slow offline task');
 await top(status,300);evidence.policy=await status.innerText();await shot('policy',[['policy-status',status]]);
 await page.getByLabel('Allow host background work').check();
 const nolive=sp('Live mode is unavailable until');await top(nolive,300);evidence.nolive=await nolive.innerText();await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,3,5,6]);
 await c.knowledge();
}finally{await c.done();}
