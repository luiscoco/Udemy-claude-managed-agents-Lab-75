// Capture Lab 30 (Host task board and completion gates) for its step-by-step video.
// Usage: node scripts/capture-lab30-walkthrough.mjs offline   (this lab has no live mode and no Run live button)
import {start} from './lab_capture_common.mjs';
const c=await start(30,process.argv[2],/\/api\/c30\/(run|tools)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 30 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab30-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const row=i=>sec.locator('tbody tr').nth(i);
const results=()=>c.h('Correlated host results').locator('xpath=following-sibling::ol[1]');const lastResult=()=>results().locator(':scope > li').last();
async function act(name,wait=1200){await btn(name).click();await page.waitForTimeout(wait);}
async function resultText(){const li=lastResult();await li.locator('summary').click();await page.waitForTimeout(300);return li.locator('pre');}
try{
 await c.intro('Host task board and completion gates');
 await open();const ex=c.h('Host task board and completion gates',2);await top(ex,130);
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',sec.locator('select').first()],['exp-start',btn('Start offline board')]]);
 await sec.locator('select').first().selectOption('three-step');
 await act('Start offline board',2000);const board=sp('Agent claim:');await board.waitFor();evidence.started=await sec.innerText();
 await top(board,130);await shot('started',[['started-claim',board],['started-table',sec.locator('table')],['started-status',status]]);
 await act('Attempt review completion');evidence.refused=await sec.innerText();const refusedPre=await resultText();evidence.refusedText=await refusedPre.innerText();
 await top(lastResult(),300);await shot('refused',[['refused-result',lastResult().locator('code')],['refused-text',refusedPre],['refused-status',status]]);
 await act('Complete draft with evidence');evidence.draft=await sec.innerText();
 await top(sec.locator('table'),110);await shot('draft',[['draft-row',row(0)],['draft-review',row(1)],['draft-result',lastResult().locator('code')]]);
 await act('Attempt review completion');evidence.review=await sec.innerText();
 await act('Complete publish with evidence');evidence.publish=await sec.innerText();
 await top(board,130);await shot('publish',[['publish-board',board],['publish-review',row(1)],['publish-row',row(2)]]);
 const before={board:await board.innerText(),count:await results().locator(':scope > li').count()};
 await act('Replay last event ID');const after={board:await board.innerText(),count:await results().locator(':scope > li').count()};
 evidence.replay={before,after,status:await status.innerText()};if(before.board!==after.board||before.count!==after.count)throw Error('Replay was not deduplicated '+JSON.stringify(evidence.replay));
 await top(lastResult(),300);await shot('replay',[['replay-last',lastResult().locator('code')],['replay-status',status]]);
 await act('List tasks');evidence.list=await sec.innerText();const listPre=await resultText();evidence.listText=await listPre.innerText();
 await top(lastResult(),400);await shot('list',[['list-result',lastResult().locator('code')],['list-text',listPre],['list-status',status]]);
 const note=sp('Provider calls:');const nolive=sp('Live custom-tool execution needs');await top(nolive,500);evidence.nolive=await nolive.innerText();
 await shot('no-live',[['no-live-note',note],['no-live-text',nolive]]);
 await c.codeTour([1,3,5]);
 await c.knowledge();
}finally{await c.done();}
