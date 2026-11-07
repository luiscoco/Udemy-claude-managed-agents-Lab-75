// Capture Lab 37 (External policy decision service) for its step-by-step video.
// Usage: node scripts/capture-lab37-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button and every snapshot reports "Provider calls: 0".
// The backend gate keeps at most 16 runs per process: this script starts 8.
import {start} from './lab_capture_common.mjs';
const c=await start(37,process.argv[2],/\/api\/c37\/(run|decide|failures)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;page.setDefaultTimeout(30000);
const status=page.getByLabel('Lab 37 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab37-heading"]');
const sp=t=>sec.locator(':scope > p').filter({hasText:t}).first();
const scenario=page.getByLabel('Offline scenario');const gate=page.getByLabel('Gate source');
const runP=()=>sp('pending event');const actionP=()=>sp('Action: ');const gateP=()=>sp('Gate: ');
const fixture=()=>sec.locator(':scope > pre').nth(0);const confirmation=()=>sec.locator(':scope > pre').nth(1);const evid=()=>sec.locator(':scope > ul');
async function act(name,wait=1500){await btn(name).click();await page.waitForTimeout(wait);}
async function startRun(s,g='worker'){await scenario.selectOption(s);await gate.selectOption(g);await act('Start policy review');}
// The app gives its Node policy worker 3 s; Node startup on this Windows host sometimes exceeds that, so an
// unintended timed-out decision is retried once with a fresh run (the timeout scenario itself is captured on purpose).
async function workerRun(s){for(let i=0;i<2;i++){await startRun(s);await act('Ask policy worker',4500);
 const st=await status.innerText();if(!st.startsWith('timed-out'))return;evidence.workerRetries=(evidence.workerRetries??0)+1;console.log('Worker timed out for '+s+'; retrying once');}
 throw Error('Policy worker timed out twice for '+s);}
async function snap(id,extra=[]){await top(runP(),130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,[...extra,[`${id}-status`,status]]);}
try{
 await c.intro('External policy decision service');
 await open();const ex=c.h('External policy decision service',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();
 evidence.gates=await gate.locator('option').allInnerTexts();evidence.ready=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-gate',gate],['exp-start',btn('Start policy review')]]);
 // deny + isolated worker: pause on an exact sevt_ ID, then ask the worker.
 await startRun('deny');
 await snap('pending',[['pending-run',runP()],['pending-action',actionP()],['pending-ask',btn('Ask policy worker')]]);
 await act('Ask policy worker',4500);
 if((await status.innerText()).startsWith('timed-out')){evidence.workerRetries=1;console.log('Worker timed out for deny; retrying once');await workerRun('deny');}
 await snap('deny',[['deny-gate',gateP()],['deny-confirmation',confirmation()],['deny-evidence',evid()]]);
 await workerRun('allow');
 await snap('allow',[['allow-gate',gateP()],['allow-fixture',fixture()],['allow-confirmation',confirmation()]]);
 await workerRun('host-refusal');
 await snap('host-refusal',[['refusal-action',actionP()],['refusal-gate',gateP()],['refusal-confirmation',confirmation()]]);
 await workerRun('malformed');
 await snap('malformed',[['malformed-gate',gateP()],['malformed-evidence',evid()]]);
 await startRun('timeout');await act('Ask policy worker',5000);
 await snap('timeout',[['timeout-gate',gateP()],['timeout-evidence',evid()]]);
 await startRun('allow','local-reviewer');
 await snap('reviewer-pending',[['reviewer-buttons',btn('Reviewer denies')]]);
 await act('Reviewer denies');
 await snap('reviewer',[['reviewer-gate',gateP()],['reviewer-confirmation',confirmation()]]);
 await startRun('preallowed');
 await snap('preallowed',[['preallowed-run',runP()],['preallowed-action',actionP()]]);
 await startRun('deny');await act('Cancel pending');
 await snap('canceled',[['canceled-gate',gateP()],['canceled-evidence',evid()]]);
 const nolive=sp('Provider calls:');await top(nolive,300);evidence.nolive=await nolive.innerText();
 evidence.failclosed=await sp('fail closed').innerText();
 await shot('no-live',[['no-live-text',nolive],['no-live-rule',sp('fail closed')]]);
 await c.codeTour([1,3,5,7]);
 await c.knowledge();
}finally{await c.done();}
