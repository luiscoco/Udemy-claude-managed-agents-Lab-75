// Capture Lab 23 (Reusable capability bundles) for its step-by-step video.
// Usage: node scripts/capture-lab23-walkthrough.mjs offline
// This lab is offline only: it has no provisioned Managed agent, skill or MCP resource, so Run live is never available.
import {start} from './lab_capture_common.mjs';
const c=await start(23,process.argv[2],/\/api\/c23\/run$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Bundle status',{exact:true});const inv=page.locator('section[aria-label="Capability inventory"]');const res=page.locator('section[aria-label="Bundle run result"]');
const bundleH=c.h('Reviewed local bundle');
async function settle(){await page.waitForTimeout(1800);}
async function check(label,on){const b=page.getByLabel(label,{exact:true});if((await b.isChecked())!==on)await b.click();}
async function invShot(id){await top(inv,110);evidence[id]=await inv.innerText();await shot(id,[[`${id}-requested`,inv.locator('p').nth(0)],[`${id}-resolved`,inv.locator('p').nth(1)],[`${id}-workers`,inv.locator('p').nth(2)]]);}
async function resShot(id){await top(res,110);evidence[id]=await res.innerText();await shot(id,[[`${id}-ledger`,res.locator('p').first()],[`${id}-effect`,res.locator('article, p').nth(1)]]);}
try{
 await c.intro('Reusable capability bundles');
 await open();const ex=c.h('Reusable capability bundles',2);await top(ex,130);
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-bundle',bundleH.locator('xpath=following-sibling::p[1]')],['exp-contributions',bundleH.locator('xpath=following-sibling::ul[1]')]]);
 await check('Enable bundle',false);await btn('Inspect composition').click();await settle();await invShot('disabled-inventory');
 await btn('Run offline bundle').click();await settle();await resShot('disabled-run');
 await check('Enable bundle',true);await btn('Inspect composition').click();await settle();await invShot('enabled-inventory');
 await btn('Run offline bundle').click();await settle();await resShot('enabled-run');
 await check('Include skill snapshot',true);await check('Include URL MCP declaration',true);await btn('Inspect composition').click();await settle();await invShot('skill-mcp-inventory');
 await btn('Run offline bundle').click();await settle();await resShot('skill-mcp-run');
 const rv=page.getByLabel('Reload variant',{exact:true});
 for(const v of ['malformed','changed-hash','elevated-worker']){await rv.selectOption(v);await btn('Reload local bundle').click();await settle();evidence[`reload_${v}`]=await status.innerText();
  await top(rv,250);await shot(`reload-${v}`,[[`reload-${v}-variant`,rv],[`reload-${v}-status`,status]]);}
 await c.liveDisabled();
 await c.codeTour([1,3,4,5]);
 await c.knowledge();
}finally{await c.done();}
