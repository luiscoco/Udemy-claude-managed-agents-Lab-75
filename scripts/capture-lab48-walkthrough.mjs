// Capture Lab 48 (Security hardening) for its step-by-step video.
// Usage: node scripts/capture-lab48-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button; the range holds a fake canary and makes zero provider calls.
import {start} from './lab_capture_common.mjs';
const c=await start(48,process.argv[2],/\/api\/c48\/(permissions|secrets|injection|lockdown)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 48 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab48-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const policy=sec.locator('select').nth(0);const action=sec.locator('select').nth(1);
// Wait for the UI state (a new custom tool event ID and the button enabled again) instead of fixed timeouts: the machine is busy.
async function probe(p,a){await policy.selectOption(p);await action.selectOption(a);
 const before=await sec.locator('code').first().innerText().catch(()=>'');await btn('Run local probe').click();
 await page.waitForFunction(b=>{const s=document.querySelector('section[aria-labelledby="lab48-heading"]');const code=s.querySelector('code');const busy=s.querySelector('.lab-controls button').disabled;return code&&code.textContent!==b&&!busy;},before,{timeout:30000});
 const id=`${p}-${a}`;evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();return id;}
async function result(id,lead){await top(policy,200);
 await shot(id,[[`${id}-request`,lead==='policy'?policy:action],[`${id}-effect`,sp('Attempted:')],[`${id}-hits`,sp('Loopback collector hits:')],[`${id}-files`,sp('Allowed file:')],[`${id}-tool`,sp('Tool result:')]]);}
try{
 await c.intro('Security hardening');
 await open();const ex=c.h('Security hardening',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.policies=await policy.locator('option').allInnerTexts();
 evidence.actions=await action.locator('option').allInnerTexts();evidence.start=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-policy',policy],['exp-action',action],['exp-run',btn('Run local probe')],['exp-status',status]]);
 let id=await probe('layered','secret-read');await result(id,'policy');
 await top(c.h('Observed effect',3),130);
 await shot('layered-secret-ids',[['layered-secret-ids-ids',sp('Custom tool event')],['layered-secret-ids-evidence',c.h('Observed effect',3).locator('xpath=following-sibling::ul[1]')],['layered-secret-ids-status',status]]);
 id=await probe('layered','out-of-scope-write');await result(id,'action');
 id=await probe('layered','injected-egress');await result(id,'action');
 id=await probe('naive','secret-read');await result(id,'policy');
 id=await probe('naive','injected-egress');await result(id,'action');
 id=await probe('naive','out-of-scope-write');await result(id,'action');
 const nolive=sp('Prompts and cwd alone');await top(nolive,400);evidence.nolive=await nolive.innerText();
 await shot('no-live',[['no-live-text',nolive],['no-live-status',status]]);
 await c.codeTour([1,3,4,5]);
 await c.knowledge();
}finally{await c.done();}
