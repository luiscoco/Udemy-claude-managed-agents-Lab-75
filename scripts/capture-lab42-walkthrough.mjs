// Capture Lab 42 (Bounded web research and citations) for its step-by-step video.
// Usage: node scripts/capture-lab42-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button and every snapshot reports "Provider calls: 0".
import {start} from './lab_capture_common.mjs';
const c=await start(42,process.argv[2],/\/api\/c42\/(basics|fetch-lab|injection|guard|research)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 42 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab42-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const scenario=page.getByLabel('Offline scenario');
const after=name=>c.h(name,3).locator('xpath=following-sibling::*[1]');
const decision=()=>sp('Decision: ');const sources=()=>after('Inspected sources');const evidenceList=()=>after('Host evidence');
async function run(s){await scenario.selectOption(s);
 const done=page.waitForResponse(r=>r.request().method()==='POST'&&/\/api\/c42\//.test(r.url()),{timeout:30000});
 await btn('Run research fixture').click();await done;
 await page.waitForFunction(()=>!document.querySelector('section[aria-labelledby="lab42-heading"] button:disabled')&&!document.querySelector('[aria-label="Lab 42 status"]')?.textContent?.startsWith('Ready.'),null,{timeout:30000});
 await page.waitForTimeout(300);}
async function snap(id,extra,anchor=sp('Query: ')){await top(anchor,130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,[...extra,[`${id}-status`,status]]);}
try{
 await c.intro('Bounded web research and citations');
 await open();const ex=c.h('Bounded web research and citations',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();evidence.ready=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-run',btn('Run research fixture')],['exp-status',status]]);
 await run('basics');
 await snap('basics',[['basics-query',sp('Query: ')],['basics-decision',decision()],['basics-source',sources()],['basics-answer',sp('Citation IDs:')]]);
 await run('fetch');
 await snap('fetch',[['fetch-source',sources()],['fetch-answer',after('Answer and citation check')],['fetch-cite',sp('Citation IDs:')]],decision());
 await run('injection');
 await snap('injection',[['injection-source',sources()],['injection-evidence',evidenceList()]],decision());
 await run('redirect');
 await snap('redirect',[['redirect-decision',decision()],['redirect-targets',sp('Redirect targets:')],['redirect-answer',sp('Citation IDs:')],['redirect-evidence',evidenceList()]]);
 await run('blocked-host');
 await snap('blocked',[['blocked-decision',decision()],['blocked-none',sp('No permitted source returned.')],['blocked-evidence',evidenceList()]]);
 await run('research');
 await snap('research',[['research-decision',decision()],['research-cite',sp('Citation IDs:')],['research-tools',sp('Provider calls:')]],decision());
 const nolive=sp('Fixture citations are authored evidence');const calls=sp('Provider calls:');await top(calls,300);
 evidence.nolive=await nolive.innerText();evidence.calls=await calls.innerText();await shot('no-live',[['no-live-calls',calls],['no-live-text',nolive]]);
 await c.codeTour([1,2,3]);
 await c.knowledge();
}finally{await c.done();}
