// Capture Lab 49 (Headless host and CI outcomes) for its step-by-step video.
// Usage: node scripts/capture-lab49-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button; it runs authored headless verdict fixtures (providerCalls 0).
import {start} from './lab_capture_common.mjs';
const c=await start(49,process.argv[2],/\/api\/c49\/(headless|ci|limits|deploy)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 49 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab49-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();
const scenario=sec.locator('select').first();const run=btn('Run headless fixture');
// Wait for the UI state (status text changes and the button is enabled again) instead of fixed timeouts: the machine is busy.
async function act(){const before=await status.innerText();await run.click();
 await page.waitForFunction(b=>{const s=document.querySelector('[aria-label="Lab 49 status"]');const busy=[...document.querySelectorAll('section[aria-labelledby="lab49-heading"] .lab-controls button')].some(x=>x.disabled);return s&&s.textContent!==b&&!busy;},before,{timeout:30000});}
async function fixture(s){await scenario.selectOption(s);await act();await top(c.h('Headless host and CI outcomes',2),130);
 evidence[`run-${s}`]=await sec.innerText();evidence[`status_${s}`]=await status.innerText();}
const verdict=()=>sp('Outcome: ');const report=()=>sp('Validated report:');const clean=()=>sp('Interruption: ');const list=()=>sec.locator('ul').first();
try{
 await c.intro('Headless host and CI outcomes');
 await open();const ex=c.h('Headless host and CI outcomes',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();
 evidence.start=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-run',run],['exp-status',status],['exp-cleanup',sp('A local abort without confirmed idle')]]);
 await fixture('pass');
 await shot('run-pass',[['pass-scenario',scenario],['pass-verdict',verdict()],['pass-report',report()],['pass-cleanup',clean()],['pass-status',status]]);
 await fixture('validation');
 await shot('run-validation',[['validation-scenario',scenario],['validation-verdict',verdict()],['validation-report',report()],['validation-evidence',list()]]);
 await fixture('limit');
 await shot('run-limit',[['limit-scenario',scenario],['limit-verdict',verdict()],['limit-status',status]]);
 await fixture('execution-error');
 await shot('run-error',[['error-scenario',scenario],['error-verdict',verdict()],['error-status',status]]);
 await fixture('sigterm');
 await shot('run-sigterm',[['sigterm-scenario',scenario],['sigterm-verdict',verdict()],['sigterm-cleanup',clean()],['sigterm-evidence',list()]]);
 await fixture('concurrency');
 await shot('run-concurrency',[['concurrency-scenario',scenario],['concurrency-verdict',verdict()],['concurrency-evidence',list()]]);
 await fixture('unconfirmed-stop');
 await shot('run-unconfirmed',[['unconfirmed-scenario',scenario],['unconfirmed-verdict',verdict()],['unconfirmed-cleanup',clean()],['unconfirmed-evidence',list()]]);
 // The app's offline-only statement: no live provider run starts here.
 await top(ex,130);evidence.nolive=await ex.locator('xpath=following-sibling::p[1]').innerText();evidence.closing=await sp('A local abort without confirmed idle').innerText();
 await shot('no-live',[['no-live-text',ex.locator('xpath=following-sibling::p[1]')],['no-live-calls',verdict()],['no-live-rule',sp('A local abort without confirmed idle')]]);
 await c.codeTour([1,2,3,4]);
 await c.knowledge();
}finally{await c.done();}
