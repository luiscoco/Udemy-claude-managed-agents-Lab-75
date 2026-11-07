// Capture Lab 38 (Application follow up suggestions) for its step-by-step video.
// Usage: node scripts/capture-lab38-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button; "The offline fixture does not start a separately billed suggestion session".
import {start} from './lab_capture_common.mjs';
const c=await start(38,process.argv[2],/\/api\/c38\/(chat|send|when|switches|end)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 38 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab38-heading"]');
const sp=t=>sec.locator(':scope > p').filter({hasText:t}).first();const scenario=page.getByLabel('Offline scenario');
const sugg=sec.locator('section[aria-label="Follow up suggestions"]');const copy=()=>sugg.getByRole('button').first();
const draft=page.getByLabel('Your next message');
const conv=()=>sp(/^Conversation /);const answer=()=>sp('Agent answer:');const sends=()=>sp('Explicit sends:');const usage=()=>sp('Answer usage:');
async function act(name,wait=1200){await btn(name).click();await page.waitForTimeout(wait);}
async function begin(s){await scenario.selectOption(s);await act('Start conversation');}
async function snap(id,extra=[],anchor=null){await top(anchor??conv(),130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,[...extra,[`${id}-status`,status]]);}
try{
 await c.intro('Application follow up suggestions');
 await open();const ex=c.h('Application follow up suggestions',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-start',btn('Start conversation')]]);
 // normal: the answer arrives first; suggestions only appear after the host checks for them.
 await begin('normal');
 await snap('started',[['started-conv',conv()],['started-answer',answer()],['started-none',sugg.locator('p')],['started-sends',sends()]]);
 await act('Check suggestions');
 await snap('checked',[['checked-copy',copy()],['checked-usage',usage()]]);
 await copy().click();await page.waitForTimeout(600);evidence.copied_draft=await draft.inputValue();
 await snap('copied',[['copied-draft',draft],['copied-sends',sends()]]);
 await act('Send message');
 await snap('sent',[['sent-conv',conv()],['sent-answer',answer()],['sent-none',sugg.locator('p')],['sent-sends',sends()]]);
 // delayed: the suggestion becomes available about 1.2 s after the answer.
 await begin('delayed');await act('Check suggestions',2400);
 await snap('delayed',[['delayed-copy',copy()]]);
 // suppressed and disabled: absence is a valid outcome.
 await begin('suppressed');await act('Check suggestions');
 await snap('suppressed',[['suppressed-none',sugg.locator('p')]]);
 await begin('disabled');await act('Check suggestions');
 await snap('disabled',[['disabled-toggle',btn('Enable suggestions')],['disabled-none',sugg.locator('p')]]);
 // stale: send the copied suggestion; the next check rejects the old suggestion for the newer turn.
 await begin('stale');await act('Check suggestions');await copy().click();await page.waitForTimeout(600);await act('Send message');
 await snap('stale-sent',[['stale-sent-conv',conv()],['stale-sent-copy',copy()]]);
 await act('Check suggestions');
 await snap('stale',[['stale-none',sugg.locator('p')],['stale-flag',sends()]]);
 await act('Close conversation');
 await snap('closed',[['closed-check',btn('Check suggestions')],['closed-none',sugg.locator('p')]]);
 const nolive=sec.locator(':scope > p').filter({hasText:'No native'}).first();await top(nolive,300);evidence.nolive=await nolive.innerText();
 await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,4,6,7]);
 await c.knowledge();
}finally{await c.done();}
