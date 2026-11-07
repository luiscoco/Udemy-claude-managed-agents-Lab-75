// Capture Lab 33 (Human forms during tool work) for its step-by-step video.
// Usage: node scripts/capture-lab33-walkthrough.mjs offline
// This lab is offline only: the page states "Direct cloud MCP elicitation callback support is not assumed" and has no Run live button.
import {start} from './lab_capture_common.mjs';
const c=await start(33,process.argv[2],/\/api\/c33\/(run|respond|who|consent\/[^/]+)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 33 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab33-heading"]');
const form=page.locator('section[aria-label="Pending MCP form"]');const sp=t=>sec.locator(':scope > p').filter({hasText:t}).first();
const sel=sec.locator('.lab-controls select').first();const evH=c.h('Protocol evidence');const evList=evH.locator('xpath=following-sibling::ul[1]');
async function startScenario(s){await sel.selectOption(s);await btn('Start MCP form').click();await page.waitForTimeout(1500);await form.waitFor();}
async function act(name,wait=1500){await btn(name).click();await page.waitForTimeout(wait);}
try{
 await c.intro('Human forms during tool work');
 await open();const ex=c.h('Human forms during tool work',2);await top(ex,130);
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',sel],['exp-start',btn('Start MCP form')]]);
 // valid-form: the local MCP server sends elicitation/create and waits for the host's validated reply.
 await startScenario('valid-form');evidence.pending=await sec.innerText();await top(form,110);
 await shot('pending',[['pending-question',form.locator('h3')],['pending-ids',form.locator(':scope > p').first()],['pending-fields',page.getByLabel('Quantity (1–10)')],['pending-status',status]]);
 await act('Submit form');evidence.accepted=await sec.innerText();evidence.accepted_status=await status.innerText();
 await top(sp('Validated form:'),110);
 await shot('accepted',[['accepted-form',sp('Validated form:')],['accepted-result',sp('MCP tool result:')],['accepted-bridge',sec.locator('pre').first()]]);
 await top(evH,110);evidence.evidence_list=await evList.innerText();
 await shot('evidence',[['evidence-list',evList],['evidence-note',sp('Provider calls:')],['evidence-status',status]]);
 // invalid-values: the host schema rejects quantity 99 before any MCP reply; the form stays pending.
 await startScenario('invalid-values');await act('Try invalid quantity');evidence.invalid=await status.innerText();
 await top(form,110);await shot('invalid',[['invalid-button',btn('Try invalid quantity')],['invalid-status',status]]);
 await act('Inspect state');evidence.invalid_inspect=await status.innerText();
 await shot('invalid-pending',[['invalid-pending-form',sp('Validated form:')],['invalid-pending-status',status]]);
 // decline: the host replies decline; the MCP tool returns an error result.
 await startScenario('decline');await act('Decline');evidence.decline=await sec.innerText();evidence.decline_status=await status.innerText();
 await top(sp('Validated form:'),110);await shot('declined',[['declined-form',sp('Validated form:')],['declined-result',sp('MCP tool result:')],['declined-bridge',sec.locator('pre').first()]]);
 // timeout: the fixture's 1.2 s timer closes the wait; inspect shows timed-out.
 await startScenario('timeout');await page.waitForTimeout(2000);await act('Inspect state');evidence.timeout=await status.innerText();
 await top(sp('Validated form:'),300);await shot('timeout',[['timeout-form',sp('Validated form:')],['timeout-status',status]]);
 // abort: the host stops waiting.
 await startScenario('abort');await act('Abort waiting');evidence.abort=await status.innerText();
 await top(sp('Validated form:'),300);await shot('aborted',[['aborted-form',sp('Validated form:')],['aborted-status',status]]);
 // url-consent: a fixed same-origin fictional consent page, not OAuth.
 await startScenario('url-consent');const consent=page.locator('section[aria-label="Fixed fictional local consent page"]');await consent.waitFor();
 evidence.consent=await consent.innerText();await top(form,110);
 await shot('consent',[['consent-ids',form.locator(':scope > p').first()],['consent-page',consent]]);
 const nolive=sp('Direct cloud MCP elicitation callback support is not assumed');await top(nolive,300);evidence.nolive=await nolive.innerText();
 await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,3,5,7]);
 await c.knowledge();
}finally{await c.done();}
