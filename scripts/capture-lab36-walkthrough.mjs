// Capture Lab 36 (Remote transport and host runners) for its step-by-step video.
// Usage: node scripts/capture-lab36-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button; the loopback emulator "makes no Anthropic call".
import {start} from './lab_capture_common.mjs';
const c=await start(36,process.argv[2],/\/api\/c36\/(run|reset|failures)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 36 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab36-heading"]');
const sp=t=>sec.locator(':scope > p').filter({hasText:t}).first();const life=page.getByRole('region',{name:'Remote lifecycle'});
const scenario=page.getByLabel('Offline scenario');
async function run(id,extra){await scenario.selectOption(id);await btn('Run transport experiment').click();
 await page.waitForFunction(()=>!document.querySelector('section[aria-labelledby="lab36-heading"] button')?.disabled,null,{timeout:15000});await page.waitForTimeout(600);
 await top(sp('Run '),130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,[[`${id}-run`,sp('Run ')],[`${id}-request`,sp('Host request:')],[`${id}-life`,(await life.locator('li').count())?life.locator('ol'):life],[`${id}-worker`,sp('Host worker started:')],[`${id}-cleanup`,sp('Local abort:')],...extra,[`${id}-status`,status]]);}
try{
 await c.intro('Remote transport and host runners');
 await open();const ex=c.h('Remote transport and host runners',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();evidence.ready=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-run',btn('Run transport experiment')],['exp-status',status]]);
 await run('success',[['success-note',sp('Loopback transport is not')]]);
 await run('connection-failure',[]);
 await run('early-stream-close',[]);
 await run('handler-worker-failure',[]);
 await run('cancel-pending-cleanup',[]);
 const nolive=sp('Killing a host worker does not prove');await top(nolive,300);evidence.nolive=await nolive.innerText();await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,3,4,6]);
 await c.knowledge();
}finally{await c.done();}
