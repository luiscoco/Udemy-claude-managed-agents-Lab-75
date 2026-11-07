// Capture Lab 24 (Who owns the agent loop) for its step-by-step video.
// Usage: node scripts/capture-lab24-walkthrough.mjs offline
// This lab is offline only: live Messages and Managed paths need a separately reviewed agent, so Run live is never available.
import {start} from './lab_capture_common.mjs';
const c=await start(24,process.argv[2],/\/api\/c24\/run$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const names={'manual-messages':'Manual Messages loop','messages-tool-runner':'Messages SDK tool runner','managed-session':'Managed session custom tools'};
const status=page.getByLabel('Harness status',{exact:true});
const result=h=>page.locator(`section[aria-label="${names[h]} result"]`).last();
async function runOne(harness,scenario,limit=3){await page.getByLabel('Harness',{exact:true}).selectOption(harness);await page.getByLabel('Scenario',{exact:true}).selectOption(scenario);
 await page.getByLabel('Host call limit',{exact:true}).selectOption(String(limit));const n=await page.locator('section[aria-label$=" result"]').count();
 await btn('Run offline harness').click();await page.waitForFunction(k=>document.querySelectorAll('section[aria-label$=" result"]').length>k,n,{timeout:60000});await page.waitForTimeout(1000);}
async function resultShot(id,harness,withTrace=false){const r=result(harness);await top(r,110);evidence[id]=await r.innerText();
 await shot(id,[[`${id}-head`,r.locator('h3')],[`${id}-facts`,r.locator('p').first()],...(withTrace?[[`${id}-trace`,r.locator('ol')]]:[]),[`${id}-effects`,r.locator('h4 + ul')]]);}
try{
 await c.intro('Who owns the agent loop');
 await open();const ex=c.h('Who owns the agent loop?',2);await top(ex,130);
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-harness',page.getByLabel('Harness',{exact:true})],['exp-scenario',page.getByLabel('Scenario',{exact:true})],['exp-limit',page.getByLabel('Host call limit',{exact:true})]]);
 const own=page.locator('.lab-controls').filter({hasText:'Ownership'});await top(own,300);
 await shot('ownership',[['own-manual',own.locator('span').nth(0)],['own-runner',own.locator('span').nth(1)],['own-managed',own.locator('span').nth(2)]]);
 for(const h of ['manual-messages','messages-tool-runner','managed-session']){await runOne(h,'reserve');await resultShot(`reserve-${h}`,h,true);}
 await btn('Clear comparisons').click();await page.waitForTimeout(800);
 await runOne('managed-session','large-reservation');await resultShot('reject','managed-session',true);
 await btn('Clear comparisons').click();await page.waitForTimeout(800);
 await runOne('managed-session','call-limit',1);await resultShot('limit','managed-session',true);
 const ans=result('managed-session').locator('p').last();await top(ans,300);await shot('answer',[['answer-text',ans]]);
 await c.liveDisabled();
 await c.codeTour([1,3,4,5]);
 await c.knowledge();
}finally{await c.done();}
