// Capture Lab 46 (Observed cache usage and cost) for its step-by-step video.
// Usage: node scripts/capture-lab46-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button; authored usage fixtures are observations, not savings measurements.
import {start} from './lab_capture_common.mjs';
const c=await start(46,process.argv[2],/\/api\/c46\/(anatomy|switches|breakers|model-switch)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 46 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab46-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const scenario=sec.locator('select').first();
const reading=n=>sec.locator('.lab-results > section').nth(n);const counters=n=>reading(n).locator('p').filter({hasText:'cache read'}).first();
const ident=n=>reading(n).locator('p').filter({hasText:'Session '}).first();
// Every run returns fresh fixture session IDs, so the section text always changes. Wait for that and for the button to be enabled
// again (UI state), not a fixed timeout: the machine is busy.
async function compare(s){await scenario.selectOption(s);const before=await sec.innerText();await btn('Compare usage fixtures').click();
 await page.waitForFunction(b=>{const x=document.querySelector('section[aria-labelledby="lab46-heading"]');const busy=[...x.querySelectorAll('.lab-controls button')].some(y=>y.disabled);return x.innerText!==b&&!busy;},before,{timeout:30000});
 evidence[`run_${s}`]=await sec.innerText();evidence[`status_${s}`]=await status.innerText();}
try{
 await c.intro('Observed cache usage and cost');
 await open();const ex=c.h('Observed cache usage and cost',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();evidence.start=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-select',scenario],['exp-button',btn('Compare usage fixtures')],['exp-status',status]]);
 await compare('reused-content');await top(sp('Stable handbook:'),130);
 await shot('reused',[['reused-handbook',sp('Stable handbook:')],['reused-suffix',sp('Dynamic suffix 1:')],['reused-r1',counters(0)],['reused-r2',counters(1)]]);
 const unc=sp('Savings claim:');const hb=()=>top(sp('Stable handbook:'),130);const r0=()=>top(reading(0),110);
 await top(reading(1),110);
 await shot('reused-delta',[['reused-ident',ident(1)],['reused-comparable',sp('Comparable: ')],['reused-uncertainty',unc],['reused-evidence',sec.locator('ul').last()]]);
 await compare('changed-prefix');await hb();
 await shot('prefix',[['prefix-suffix',sp('Dynamic suffix 1:')],['prefix-r1',counters(0)],['prefix-r2',counters(1)],['prefix-comparable',sp('Comparable: ')]]);
 await compare('changed-model');await r0();
 await shot('model',[['model-id1',ident(0)],['model-id2',ident(1)],['model-comparable',sp('Comparable: ')],['model-uncertainty',unc]]);
 await compare('changed-tools');await r0();
 await shot('tools',[['tools-id1',ident(0)],['tools-id2',ident(1)],['tools-comparable',sp('Comparable: ')],['tools-uncertainty',unc]]);
 await compare('short-input');await hb();
 await shot('short',[['short-r1',counters(0)],['short-r2',counters(1)],['short-comparable',sp('Comparable: ')]]);
 await compare('missing-usage');await r0();
 await shot('missing',[['missing-r1',counters(0)],['missing-r2',counters(1)],['missing-comparable',sp('Comparable: ')],['missing-uncertainty',unc]]);
 const nolive=sp('Short inputs or missing usage may show no cache counters');await top(nolive,500);evidence.nolive=await nolive.innerText();evidence.rule=await ex.locator('xpath=following-sibling::p[1]').innerText();
 await shot('no-live',[['no-live-text',nolive],['no-live-status',status],['no-live-provider',unc]]);
 await c.codeTour([1,2,3,5]);
 await c.knowledge();
}finally{await c.done();}
