// Capture Lab 28 (Errors, retries and reconciliation) for its step-by-step video.
// Usage: node scripts/capture-lab28-walkthrough.mjs offline   (this lab has no live mode: live fault injection is unavailable)
import {start} from './lab_capture_common.mjs';
const c=await start(28,process.argv[2],/\/api\/c28\/(run|api)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const sec=page.locator('section[aria-labelledby="lab28-heading"]');const status=page.getByLabel('Lab 28 status',{exact:true});
const res=page.locator('section[aria-label="Fault evidence"]');const rp=t=>res.locator('p').filter({hasText:t}).first();
const select=sec.locator('.lab-controls select');
async function run(s){await select.selectOption(s);const resp=page.waitForResponse(r=>/\/api\/c28\/run$/.test(r.url()));await btn('Run offline fault').click();await resp;
 await res.getByText(`Classification: `,{exact:false}).first().waitFor();await page.waitForFunction(()=>!document.querySelector('section[aria-labelledby="lab28-heading"] button')?.disabled);
 await page.waitForTimeout(800);evidence[`run_${s}`]=await res.innerText();evidence[`status_${s}`]=await status.innerText();if(!evidence[`run_${s}`].includes(`Source: authored-loopback-fixture`))throw Error('Unexpected result '+s);}
// Full evidence for the four retry/reconciliation scenarios.
async function fullShot(id,s){await run(s);await top(status,150);
 await shot(id,[[`${id}-class`,rp('Classification:')],[`${id}-attempts`,rp('Read attempts:')],[`${id}-reconcile`,rp('Reconcile:')],[`${id}-evidence`,res.locator('ul')],[`${id}-guidance`,res.locator(':scope > p').last()]]);}
// Classification only for the remaining fault classes.
async function classShot(id,s){await run(s);await top(status,150);
 await shot(id,[[`${id}-class`,rp('Classification:')],[`${id}-reconcile`,rp('Reconcile:')],[`${id}-evidence`,res.locator('ul')]]);}
try{
 await c.intro('Errors, retries and reconciliation');
 await open();const ex=c.h('Errors, retries and reconciliation',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();
 evidence.scenarios=await select.locator('option').allInnerTexts();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-select',select],['exp-run',btn('Run offline fault')],['exp-status',status]]);
 await fullShot('rate-limit','read-rate-limit');
 await fullShot('missing-create','missing-create-response');
 await fullShot('tool-result','tool-result-failure');
 await fullShot('reconnect','reconnect-duplicates');
 for(const s of ['invalid','auth','event-error','handler-error','cancel','eof'])await classShot(s,s);
 await run('disconnect');await top(status,150);
 await shot('disconnect',[['disconnect-class',rp('Classification:')],['disconnect-remote',rp('Remote stopped:')],['disconnect-evidence',res.locator('ul')],['disconnect-guidance',res.locator(':scope > p').last()]]);
 const nolive=sec.locator(':scope > p').filter({hasText:'Live fault injection is unavailable in this lesson'}).first();await top(nolive,400);
 await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,2,4,5]);
 await c.knowledge();
}finally{await c.done();}
