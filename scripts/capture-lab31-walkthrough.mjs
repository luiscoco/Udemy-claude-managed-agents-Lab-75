// Capture Lab 31 (Host questions and correlated answers) for its step-by-step video.
// Usage: node scripts/capture-lab31-walkthrough.mjs offline   (this lab has no live mode and no Run live button)
import {start} from './lab_capture_common.mjs';
const c=await start(31,process.argv[2],/\/api\/c31\/(run|answer|tools)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 31 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab31-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const q=page.getByRole('region',{name:'Host question',exact:true});
async function act(name,wait=1200){await btn(name).click();await page.waitForTimeout(wait);}
async function startScenario(s){await sec.locator('select').first().selectOption(s);await act('Start question');await q.waitFor();}
try{
 await c.intro('Host questions and correlated answers');
 await open();const ex=c.h('Host questions and correlated answers',2);await top(ex,130);
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',sec.locator('select').first()],['exp-start',btn('Start question')]]);
 await startScenario('deployment-target');evidence.question=await sec.innerText();
 await top(sp('Run '),130);await shot('question',[['question-ids',sp('Run ')],['question-text',q.locator('h3')],['question-options',q.locator('fieldset')],['question-expiry',sp('Expires:')]]);
 await page.getByLabel('Staging',{exact:true}).check();await act('Submit answer');evidence.answered=await sec.innerText();evidence.answeredStatus=await status.innerText();
 const pre=sec.locator('pre');evidence.resultEvent=await pre.innerText();
 await top(sp('Answer:'),130);await shot('answered',[['answered-answer',sp('Answer:')],['answered-event',pre],['answered-status',status]]);
 await startScenario('invalid-answer');await act('Try invalid answer');evidence.invalid=await status.innerText();evidence.invalidAnswer=await sp('Answer:').innerText();
 await top(q.locator('h3'),130);await shot('invalid',[['invalid-buttons',btn('Try invalid answer')],['invalid-answer',sp('Answer:')],['invalid-status',status]]);
 await startScenario('allowed-custom-text');await page.getByLabel('Custom answer',{exact:true}).fill('Staging, then a read-only preview');
 await top(q.locator('h3'),130);await shot('custom',[['custom-input',page.getByLabel('Custom answer',{exact:true})],['custom-allowed',sp('Expires:')]]);
 await act('Submit answer');evidence.custom=await sec.innerText();await top(sp('Answer:'),130);
 await shot('custom-answered',[['custom-answer',sp('Answer:')],['custom-event',sec.locator('pre')],['custom-status',status]]);
 await startScenario('expiry');await page.waitForTimeout(1500);await act('Wait for answer or expiry',1500);evidence.expired=await status.innerText();
 await top(q.locator('h3'),130);await shot('expired',[['expired-expiry',sp('Expires:')],['expired-answer',sp('Answer:')],['expired-status',status]]);
 const nolive=sp('Live custom-tool execution is unavailable');await top(nolive,500);evidence.nolive=await nolive.innerText();
 await shot('no-live',[['no-live-note',sp('Answer:')],['no-live-text',nolive]]);
 await c.codeTour([1,3,5,6]);
 await c.knowledge();
}finally{await c.done();}
