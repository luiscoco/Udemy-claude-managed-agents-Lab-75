// Capture Lab 45 (Provider availability and configuration) for its step-by-step video.
// Usage: node scripts/capture-lab45-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button; catalog facts and the loopback emulator "never contact a cloud provider".
import {start} from './lab_capture_common.mjs';
const c=await start(45,process.argv[2],/\/api\/c45\/(catalog|same|auth|models|failures|aws\/check)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 45 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab45-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const li=t=>sec.locator('li').filter({hasText:t}).first();
const target=sec.locator('select').nth(0);const scenario=sec.locator('select').nth(1);
// Compare runs before the catalog loads, so the status line stays on screen next to the Target select.
// Wait for the UI state (status text changes and the buttons are enabled again) instead of fixed timeouts: the machine is busy.
async function act(name){const before=await status.innerText();await btn(name).click();
 await page.waitForFunction(b=>{const s=document.querySelector('[aria-label="Lab 45 status"]');const busy=[...document.querySelectorAll('section[aria-labelledby="lab45-heading"] .lab-controls button')].some(x=>x.disabled);return s&&s.textContent!==b&&!busy;},before,{timeout:30000});}
async function compare(t){await target.selectOption(t);await act('Compare APIs');await top(c.h('Provider availability and configuration',2),130);
 evidence[`same_${t}`]=await status.innerText();}
async function preflight(t,s){await target.selectOption(t);await scenario.selectOption(s);await act('Run loopback preflight');
 const id=`pre-${t}-${s}`;await top(sp('Target: '),200);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();return id;}
try{
 await c.intro('Provider availability and configuration');
 await open();const ex=c.h('Provider availability and configuration',2);await top(ex,130);
 await sp('Setup required').or(sp('Configured;')).waitFor();
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.targets=await target.locator('option').allInnerTexts();
 evidence.scenarios=await scenario.locator('option').allInnerTexts();evidence.start=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-catalog',btn('Load capability catalog')],['exp-target',target],['exp-mismatch',scenario],['exp-status',status]]);
 await compare('claude-api');
 const st=async id=>shot(id,[[`${id}-target`,target],[`${id}-status`,status]]);
 await top(target,300);await st('same-direct');
 await compare('claude-platform-aws');await top(target,300);await st('same-aws');
 await compare('vertex');await top(target,300);await st('same-vertex');
 await act('Load capability catalog');await top(c.h('Documented provider catalog',3),130);evidence.catalog=await sec.innerText();evidence.status_catalog=await status.innerText();
 await shot('catalog',[['catalog-direct',li('Direct Claude API:')],['catalog-aws',li('Claude Platform on AWS:')],['catalog-bedrock',li('Amazon Bedrock:')]]);
 let id=await preflight('claude-api','ready');
 await shot('pre-ready',[['pre-ready-target',sp('Target: ')],['pre-ready-endpoint',sp('Endpoint: ')],['pre-ready-calls',sp('Session created:')],['pre-ready-evidence',c.h('Host evidence',3).locator('xpath=following-sibling::ul[1]')]]);
 id=await preflight('claude-api','bad-auth');
 await shot('pre-badauth',[['pre-badauth-mismatch',scenario],['pre-badauth-target',sp('Target: ')],['pre-badauth-status',status]]);
 id=await preflight('claude-api','model-mismatch');
 await shot('pre-model',[['pre-model-mismatch',scenario],['pre-model-target',sp('Target: ')],['pre-model-status',status]]);
 id=await preflight('claude-api','missing-feature');
 await shot('pre-feature',[['pre-feature-mismatch',scenario],['pre-feature-target',sp('Target: ')],['pre-feature-status',status]]);
 id=await preflight('claude-platform-aws','ready');
 await shot('pre-aws',[['pre-aws-target',sp('Target: ')],['pre-aws-endpoint',sp('Endpoint: ')],['pre-aws-status',status]]);
 id=await preflight('bedrock','ready');
 await shot('pre-bedrock',[['pre-bedrock-target',sp('Target: ')],['pre-bedrock-evidence',c.h('Host evidence',3).locator('xpath=following-sibling::ul[1]')],['pre-bedrock-status',status]]);
 const nolive=sp('Emulated wire shapes stay labeled offline');const setup=sp('Setup required').or(sp('Configured;'));const aws=btn('Check AWS resources (read-only)');
 await top(c.h('AWS resource setup',3),300);evidence.nolive=await nolive.innerText();evidence.awsSetup=await setup.innerText();evidence.awsDisabled=await aws.isDisabled();
 await shot('no-live',[['no-live-text',nolive],['no-live-aws',sp('The official AWS client is installed')],['no-live-setup',setup],['no-live-button',aws]]);
 await c.codeTour([1,3,5,6]);
 await c.knowledge();
}finally{await c.done();}
