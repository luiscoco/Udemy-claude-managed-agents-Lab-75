// Capture Lab 39 (Trusted configuration and untrusted checkouts) for its step-by-step video.
// Usage: node scripts/capture-lab39-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button and the server refuses live checkout sessions.
import {start} from './lab_capture_common.mjs';
const c=await start(39,process.argv[2],/\/api\/c39\/(dry|start|where|takeover|try)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
page.setDefaultTimeout(60000);
const status=page.getByLabel('Lab 39 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab39-heading"]');
const sp=t=>sec.locator(':scope > p').filter({hasText:t}).first();const scenario=page.getByLabel('Offline scenario');
const pathInput=page.getByLabel('Checked relative path');const textInput=page.getByLabel('Edit data text');
const evList=c.h('Host evidence',3).locator('xpath=following-sibling::ul[1]');
async function act(name,wait=2000){await btn(name).click();await page.waitForTimeout(wait);}
// Starting a checkout runs four short git commands on the host. On a busy machine the request can outlast the page's
// 8 s fetch timeout ("signal timed out"), so wait for the new run and retry the click at most twice.
async function create(s){const run=()=>sp(/^Run /);const before=await run().count()?await run().innerText():'';await scenario.selectOption(s);
 for(let attempt=1;;attempt++){await btn('Create disposable worktree').click();
  const outcome=await page.waitForFunction(([b])=>{const sec=document.querySelector('section[aria-labelledby="lab39-heading"]');
   const p=[...sec.querySelectorAll(':scope > p')].find(e=>e.innerText.startsWith('Run '));if(p&&p.innerText!==b)return 'ok';
   const st=sec.querySelector('[aria-label="Lab 39 status"]').innerText;return st.includes('timed out')?'timeout':false;},[before],{timeout:60000}).then(h=>h.jsonValue());
  if(outcome==='ok')break;evidence.createRetries=(evidence.createRetries??0)+1;if(attempt>=3)throw Error('Create disposable worktree timed out 3 times');
  await page.waitForTimeout(1000);}
 await page.waitForTimeout(800);}
async function snap(id,anchor,extra=[]){await top(anchor,130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 await shot(id,[...extra,[`${id}-status`,status]]);}
try{
 await c.intro('Trusted configuration and untrusted checkouts');
 await open();const ex=c.h('Trusted configuration and untrusted checkouts',2);await top(ex,130);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-dry',btn('Dry check')],['exp-create',btn('Create disposable worktree')]]);
 await act('Dry check');await top(ex,130);evidence.dry=await status.innerText();await shot('dry',[['dry-status',status]]);
 await create('conflict');
 await snap('ready',sp(/^Run /),[['ready-run',sp(/^Run /)],['ready-hash',sp('Manifest hash:')],['ready-tools',sp('Trusted agent:')],['ready-marker',sp('Host instruction:')]]);
 await top(c.h('Host evidence',3),300);evidence.readyEvidence=await evList.innerText();await shot('ready-evidence',[['ready-evidence-list',evList],['ready-hooks',sp('Branch hook runs:')]]);
 await act('Checked read');await snap('read',pathInput,[['read-path',pathInput],['read-result',sp('Tool result:')]]);
 await pathInput.fill('CLAUDE.md');await act('Checked read');await snap('read-claude',pathInput,[['read-claude-path',pathInput],['read-claude-result',sp('Tool result:')]]);
 await pathInput.fill('../secrets.txt');await act('Checked read');await snap('traversal',pathInput,[['traversal-path',pathInput],['traversal-result',sp('Tool result:')]]);
 await pathInput.fill('notes.txt');await act('Checked edit');await snap('edit',pathInput,[['edit-text',textInput],['edit-result',sp('Tool result:')]]);
 await act('Try branch takeover');await snap('takeover',sp('Host instruction:'),[['takeover-marker',sp('Host instruction:')],['takeover-result',sp('Tool result:')],['takeover-hooks',sp('Branch hook runs:')]]);
 await create('modified-hash');
 await snap('modified',sp(/^Run /),[['modified-run',sp(/^Run /)],['modified-hash',sp('Manifest hash:')],['modified-marker',sp('Host instruction:')],['modified-read',btn('Checked read')]]);
 await create('missing-manifest');
 await snap('missing',sp(/^Run /),[['missing-run',sp(/^Run /)],['missing-hash',sp('Manifest hash:')],['missing-evidence',evList]]);
 const nolive=sp('A remote mount needs a reviewed resource policy');await top(nolive,300);evidence.nolive=await nolive.innerText();await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,3,5,6]);
 await c.knowledge();
}finally{await c.done();}
