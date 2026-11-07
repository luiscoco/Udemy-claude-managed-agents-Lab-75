// Capture Lab 41 (Managed session lifecycle comparison) for its step-by-step video.
// Usage: node scripts/capture-lab41-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button and every snapshot reports "Provider calls: 0".
import {start} from './lab_capture_common.mjs';
const c=await start(41,process.argv[2],/\/api\/c41\/(oneshot|compare|continue)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 41 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab41-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const scenario=page.getByLabel('Offline workflow');
const list=(name,tag)=>c.h(name,3).locator(`xpath=following-sibling::${tag}[1]`);
const seq=()=>list('Current Managed event sequence','ol');const hist=()=>list('Listed history','ul');
const run=()=>sp('Resolved session');const counts=()=>sp('Created sessions:');
// Wait for the UI, not the clock: the section text must change and no button may stay disabled.
async function act(name){console.log('act '+name);const before=await sec.innerText();await btn(name).click();
 await page.waitForFunction(b=>{const s=document.querySelector('section[aria-labelledby="lab41-heading"]');return s&&s.innerText!==b&&!s.querySelector('button:disabled');},before,{timeout:60000});await page.waitForTimeout(300);}
async function startFlow(s){await scenario.selectOption(s);await act('Start workflow');}
async function snap(id,extra,anchor=run(),withStatus=true){await top(anchor,130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,withStatus?[...extra,[`${id}-status`,status]]:extra);}
try{
 await c.intro('Managed session lifecycle comparison');
 await open();const ex=c.h('Managed session lifecycle comparison',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();evidence.ready=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-start',btn('Start workflow')],['exp-status',status]]);
 await startFlow('one-shot');
 await snap('oneshot',[['oneshot-run',run()],['oneshot-counts',counts()],['oneshot-seq',seq()],['oneshot-history',hist()]]);
 const note=sp('not billed provider evidence');await top(counts(),130);
 evidence.nolive=await note.innerText();evidence.calls=await counts().innerText();await shot('no-live',[['no-live-calls',counts()],['no-live-text',note]]);
 await startFlow('retained');
 await snap('retained',[['retained-run',run()],['retained-seq',seq()]]);
 await act('send-after-archive');
 await snap('early-refusal',[['early-buttons',btn('send-after-archive')]]);
 await act('second-turn');
 await snap('second',[['second-seq',seq().locator('li').nth(2)],['second-history',hist()]],seq());
 await act('reconnect');
 await snap('reconnect',[['reconnect-counts',counts()],['reconnect-seq',seq().locator('li').last()]],run(),false);
 await act('interrupt');
 await snap('interrupt',[['interrupt-run',run()],['interrupt-seq',seq().locator('li').last()]],run(),false);
 await act('archive');await act('send-after-archive');
 await snap('archived',[['archived-run',run()],['archived-counts',counts()],['archived-seq',seq().locator('li').nth(5)],['archived-refused',seq().locator('li').nth(6)]],run(),false);
 await act('Inspect state');
 await snap('inspect',[['inspect-users',sp('User event IDs:')]],sp('User event IDs:'));
 const det=sec.locator('details');await det.locator('summary').click();await top(det,300);evidence.historical=await det.innerText();
 await shot('historical',[['historical-text',det.locator('p')]]);
 await c.codeTour([1,2,3,4]);
 await c.knowledge();
}finally{await c.done();}
