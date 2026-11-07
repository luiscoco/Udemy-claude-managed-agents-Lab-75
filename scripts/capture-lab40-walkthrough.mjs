// Capture Lab 40 (Safe recovery boundaries) for its step-by-step video.
// Usage: node scripts/capture-lab40-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button and every snapshot reports "Provider calls: 0".
import {start} from './lab_capture_common.mjs';
const c=await start(40,process.argv[2],/\/api\/c40\/(dry|build|cases|undo)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 40 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab40-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const scenario=page.getByLabel('Offline case');
const list=name=>c.h(name,3).locator('xpath=following-sibling::ul[1]');
const run=()=>sp('retained session');const rec=()=>sp('Recovery: ');
async function act(name,wait=900){await btn(name).click();await page.waitForTimeout(wait);}
async function build(s){await scenario.selectOption(s);await act('Build recovery case');}
async function snap(id,extra,anchor=run()){await top(anchor,130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,[...extra,[`${id}-status`,status]]);}
try{
 await c.intro('Safe recovery boundaries');
 await open();const ex=c.h('Safe recovery boundaries',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-dry',btn('Dry check')],['exp-build',btn('Build recovery case')]]);
 await act('Dry check');await page.waitForFunction(()=>!document.querySelector('[aria-label="Lab 40 status"]')?.textContent?.startsWith('Ready.'),null,{timeout:30000}).catch(()=>{});await top(ex,130);evidence.dry=await status.innerText();await shot('dry',[['dry-status',status]]);
 await build('kept-turn');
 await snap('kept',[['kept-run',run()],['kept-commands',list('Host command ledger')],['kept-effects',list('Effect ledger')],['kept-events',sp('Remote event IDs:')]]);
 await act('Try host-only undo');
 await snap('undo-refused',[['undo-refused-recovery',rec()],['undo-refused-evidence',list('Evidence')]]);
 await act('interrupt');
 await snap('interrupt',[['interrupt-recovery',rec()],['interrupt-buttons',btn('continue')]]);
 await build('uncertain-send');await act('continue');
 await snap('uncertain',[['uncertain-commands',list('Host command ledger')],['uncertain-recovery',rec()]]);
 await act('reconcile');
 await snap('reconcile',[['reconcile-recovery',rec()]]);
 await build('queued-follow-up');await act('continue');
 await snap('queued',[['queued-commands',list('Host command ledger')],['queued-recovery',rec()]]);
 await build('pending-effect');await act('fresh-derived');
 await snap('pending',[['pending-effects',list('Effect ledger')],['pending-recovery',rec()]]);
 await build('clean-snapshot');await act('Try host-only undo');
 await snap('clean-undo',[['clean-commands',list('Host command ledger')],['clean-recovery',rec()],['clean-events',sp('Remote event IDs:')]]);
 const nolive=sp('An uncertain send requires reconciliation');const calls=sp('Provider calls:');await top(calls,200);
 evidence.nolive=await nolive.innerText();evidence.calls=await calls.innerText();await shot('no-live',[['no-live-calls',calls],['no-live-text',nolive]]);
 await c.codeTour([1,4,5,6]);
 await c.knowledge();
}finally{await c.done();}
