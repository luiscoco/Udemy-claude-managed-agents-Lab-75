// Capture Lab 35 (Event mirrors and conversation indexes) for its step-by-step video.
// Usage: node scripts/capture-lab35-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button; the fixture "does not restore a transcript into a live session".
import {start} from './lab_capture_common.mjs';
const c=await start(35,process.argv[2],/\/api\/c35\/(run|manage|failures|reset)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 35 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab35-heading"]');
const sp=t=>sec.locator(':scope > p').filter({hasText:t}).first();const events=page.getByRole('region',{name:'Canonical mirror events'});
const scenario=page.getByLabel('Offline scenario');const flush=page.getByLabel('Flush strategy');
const conv=()=>sp('Conversation ');const counts=()=>sp('Persisted: ');
async function act(name,wait=1200){await btn(name).click();await page.waitForTimeout(wait);}
async function startMirror(s,f){await scenario.selectOption(s);await flush.selectOption(f);await act('Start mirror');}
async function snap(id,extra=[]){await top(conv(),130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,[...extra,[`${id}-status`,status]]);}
try{
 await c.intro('Event mirrors and conversation indexes');
 await open();const ex=c.h('Event mirrors and conversation indexes',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-flush',flush],['exp-start',btn('Start mirror')]]);
 await startMirror('normal','eager');
 await snap('eager',[['eager-session',conv()],['eager-counts',counts()],['eager-events',events.locator('ol')]]);
 await act('Reconcile history');
 await snap('reconcile',[['reconcile-counts',counts()],['reconcile-events',events.locator('ol')]]);
 await act('Archive remote fixture');
 await snap('archived',[['archived-session',conv()],['archived-buttons',btn('Reconcile history')],['archived-note',sp('The local mirror contains')]]);
 await startMirror('normal','batched');
 await snap('batched',[['batched-counts',counts()],['batched-events',events.locator('p').first()]]);
 await act('Flush batch');
 await snap('flushed',[['flushed-counts',counts()],['flushed-events',events.locator('ol')]]);
 await startMirror('restart','batched');await act('Simulate crash and restart');
 await snap('crash',[['crash-counts',counts()],['crash-events',events.locator('p').first()]]);
 await startMirror('append-failure','eager');
 await snap('append-failure',[['append-counts',counts()],['append-events',events.locator('p').first()]]);
 await act('Reset local mirror');await top(status,300);evidence.reset=await status.innerText();await shot('reset',[['reset-status',status]]);
 const nolive=sp('Preview fragments are not stored');await top(nolive,300);evidence.nolive=await nolive.innerText();await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,3,5,6]);
 await c.knowledge();
}finally{await c.done();}
