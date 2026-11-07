// Capture Lab 25 (Context growth and compaction evidence) for its step-by-step video.
// Usage: node scripts/capture-lab25-walkthrough.mjs offline
// This lab is offline only: a live report run needs a separately configured agent, so Run live is never available.
import {start} from './lab_capture_common.mjs';
const c=await start(25,process.argv[2],/\/api\/c25\/run$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const res=page.locator('section[aria-label="Context replay result"]');const rp=t=>res.locator(':scope > p').filter({hasText:t}).first();
const hand=page.locator('section[aria-label="Host summary handoff"]');
async function runScenario(s,handoff=false){await page.getByLabel('Offline scenario',{exact:true}).selectOption(s);const cb=page.getByLabel('Include host summary handoff');if((await cb.isChecked())!==handoff)await cb.click();
 await btn('Run offline replay').click();await page.waitForTimeout(2000);await res.waitFor();evidence[`run_${s}`]=await res.innerText();}
async function factsShot(id){await top(res,110);await shot(id,[[`${id}-source`,rp('Source:')],[`${id}-usage`,rp('Thread cumulative usage')],[`${id}-window`,rp('Context window')],[`${id}-events`,rp('Compaction events observed')]]);}
try{
 await c.intro('Context growth and compaction evidence');
 await open();const ex=c.h('Context growth and compaction evidence',2);await top(ex,130);const inv=c.h('Checked report inventory');
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-reports',inv.locator('xpath=following-sibling::ul[1]')],['exp-note',inv.locator('xpath=following-sibling::p[1]')]]);
 await runScenario('compacted');await factsShot('compacted');
 await top(rp('Authoritative fixture message'),200);await shot('compacted-message',[['compacted-response',rp('Authoritative fixture message')],['compacted-note',res.locator(':scope > p').last()]]);
 await runScenario('no-compaction');await factsShot('none');
 await runScenario('missing-metrics');await factsShot('missing');
 await runScenario('summary-omits',true);await hand.waitFor();await top(hand,110);evidence.handoff=await hand.innerText();
 await shot('handoff',[['handoff-sessions',hand.locator('p').nth(0)],['handoff-summary',hand.locator('p').nth(1)],['handoff-retained',hand.locator('ul')],['handoff-answer',hand.locator('p').last()]]);
 await c.liveDisabled();
 await c.codeTour([1,3,4,5]);
 await c.knowledge();
}finally{await c.done();}
