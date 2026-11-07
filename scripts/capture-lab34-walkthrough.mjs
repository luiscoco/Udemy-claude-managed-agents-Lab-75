// Capture Lab 34 (Output instruction variants) for its step-by-step video.
// Usage: node scripts/capture-lab34-walkthrough.mjs offline
// This lab is offline only: comparisons use authored answers and POST /api/c34/live is refused, so there is no Run live button.
import {start} from './lab_capture_common.mjs';
const c=await start(34,process.argv[2],/\/api\/c34\/(compare|live|who)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const sec=page.locator('section[aria-labelledby="lab34-heading"]');const status=page.getByLabel('Lab 34 status',{exact:true});
const sp=t=>sec.locator(':scope > p').filter({hasText:t}).first();
const run=s=>sec.locator(`section[aria-label="${s} comparison"]`).last();
async function compare(style){await sec.locator('.lab-controls select').selectOption(style);await btn('Compare in fresh session').click();await run(style).waitFor();await page.waitForTimeout(800);evidence[`run_${style}`]=await run(style).innerText();evidence[`status_${style}`]=await status.innerText();}
async function runShot(id,style){const r=run(style);await top(r,110);const rp=t=>r.locator('p').filter({hasText:t}).first();
 await shot(id,[[`${id}-heading`,r.locator('h3')],[`${id}-file`,rp('Instruction file:')],[`${id}-answer`,rp('Answer:')],[`${id}-schema`,rp('Report schema:')],[`${id}-status`,status]]);}
try{
 await c.intro('Output instruction variants');
 await open();const ex=c.h('Output instruction variants',2);await top(ex,130);await sec.locator('p').nth(1).filter({hasText:'trusted host instruction files'}).waitFor();
 evidence.experiment=await sec.innerText();evidence.nolive=await status.innerText();
 await shot('experiment',[['exp-rule',sp('Trusted host files supply')],['exp-question',sp('Question:')],['exp-controls',sec.locator('.lab-controls')]]);
 await shot('no-live',[['no-live-text',status],['no-live-rule',sp('Unknown style names fail')]]);
 await compare('concise');await runShot('concise','concise');
 await compare('review-v2');await runShot('review-v2','review-v2');
 const r=run('review-v2');await r.locator('summary').click();await page.waitForTimeout(500);const pre=r.locator('pre');evidence.system=await pre.innerText();
 await top(r.locator('summary'),110);await shot('system',[['system-summary',r.locator('summary')],['system-pre',pre],['system-note',r.locator(':scope > p').last()]]);
 await btn('Try unknown style').click();await page.waitForTimeout(1200);evidence.unknown=await status.innerText();
 await top(status,300);await shot('unknown',[['unknown-status',status],['unknown-rule',sp('Unknown style names fail')]]);
 await c.codeTour([1,3,6,7]);
 await c.knowledge();
}finally{await c.done();}
