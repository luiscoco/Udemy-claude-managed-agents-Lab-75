// Capture Lab 43 (MCP resources through a host bridge) for its step-by-step video.
// Usage: node scripts/capture-lab43-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button and every snapshot reports "Provider calls: 0".
// The toy bridge token lives 30 s, so local consent is granted again (same token, new expiry) before each read.
import {start} from './lab_capture_common.mjs';
const c=await start(43,process.argv[2],/\/api\/c43\/(auth|resources|toolsets|host-read)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 43 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab43-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const scenario=page.getByLabel('Offline case');
const evidenceList=()=>c.h('Host evidence',3).locator('xpath=following-sibling::ul[1]');
// Wait for the status line to change instead of a fixed timeout (the machine may be busy).
async function act(name){const before=await status.innerText();await btn(name).click();
 await page.waitForFunction(b=>{const s=document.querySelector('[aria-label="Lab 43 status"]')?.textContent;return s&&s!==b;},before,{timeout:30000}).catch(()=>{});
 await sec.locator('button:not([disabled])').first().waitFor({timeout:30000});await page.waitForTimeout(300);}
async function read(s){await act('Grant local consent');await scenario.selectOption(s);
 await page.evaluate(()=>{const s=document.querySelector('[aria-label="Lab 43 status"]');if(s)s.textContent='…';});
 await btn('Read through host bridge').click();
 await page.waitForFunction(()=>{const s=document.querySelector('[aria-label="Lab 43 status"]')?.textContent;return s&&s!=='…';},null,{timeout:30000});
 await sec.locator('button:not([disabled])').first().waitFor({timeout:30000});await page.waitForTimeout(300);}
async function snap(id,extra){await top(sp('Transport:'),130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,[...extra,[`${id}-status`,status]]);}
try{
 await c.intro('MCP resources through a host bridge');
 await open();const ex=c.h('MCP resources through a host bridge',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();
 evidence.initial=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-buttons',btn('Grant local consent').locator('xpath=..')],['exp-scenario',scenario],['exp-read',btn('Read through host bridge')],['exp-status',status]]);
 await act('Grant local consent');await top(ex,130);evidence.consent=await status.innerText();await shot('consent',[['consent-status',status]]);
 await act('List resources');await top(ex,130);evidence.resources=await status.innerText();await shot('resources',[['resources-button',btn('List resources')],['resources-status',status]]);
 await act('Inspect toolsets');await top(ex,130);evidence.toolsets=await status.innerText();await shot('toolsets',[['toolsets-button',btn('Inspect toolsets')],['toolsets-status',status]]);
 await read('versioned-resource');
 await snap('v1',[['v1-transport',sp('Transport:')],['v1-method',sp('Method:')],['v1-version',sp('Resource version:')],['v1-result',sec.locator('pre')],['v1-custom',sp('Custom tool result:')]]);
 await read('allowed-template');
 await snap('v2',[['v2-method',sp('Method:')],['v2-version',sp('Resource version:')],['v2-result',sec.locator('pre')]]);
 await read('known-prompt');
 await snap('prompt',[['prompt-method',sp('Method:')],['prompt-version',sp('Resource version:')],['prompt-custom',sp('Custom tool result:')]]);
 await read('bad-token');
 await snap('bad-token',[['bad-transport',sp('Transport:')],['bad-version',sp('Resource version:')],['bad-evidence',evidenceList()]]);
 await read('expired-token');
 await snap('expired',[['expired-transport',sp('Transport:')],['expired-custom',sp('Custom tool result:')]]);
 await read('unknown-uri');
 await snap('unknown',[['unknown-method',sp('Method:')],['unknown-version',sp('Resource version:')],['unknown-evidence',evidenceList()]]);
 await act('Refresh bridge token');evidence.refresh=await status.innerText();
 await scenario.selectOption('versioned-resource');await page.evaluate(()=>{const s=document.querySelector('[aria-label="Lab 43 status"]');if(s)s.textContent='…';});
 await btn('Read through host bridge').click();await page.waitForFunction(()=>{const s=document.querySelector('[aria-label="Lab 43 status"]')?.textContent;return s&&s!=='…';},null,{timeout:30000});
 await sec.locator('button:not([disabled])').first().waitFor({timeout:30000});
 await snap('refresh',[['refresh-transport',sp('Transport:')],['refresh-method',sp('Method:')],['refresh-version',sp('Resource version:')]]);
 const nolive=sp('Direct URL MCP requires a reachable server');const calls=sp('Provider calls:');await top(calls,200);
 evidence.nolive=await nolive.innerText();evidence.calls=await calls.innerText();await shot('no-live',[['no-live-calls',calls],['no-live-text',nolive]]);
 await c.codeTour([1,3,5,6,7]);
 await c.knowledge();
}finally{await c.done();}
