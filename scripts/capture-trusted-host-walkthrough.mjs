// Actual local SQLite, Playwright MCP and reviewer exercises. No live models or external notifications.
import {start} from './lab_capture_common.mjs';
const lab=Number(process.argv[2]);if(![63,64,65].includes(lab))throw Error('Choose Lab 63 through 65');
const titles={63:'A safe database agent',64:'Browser tools across host and cloud',65:'Human approval over Slack, Teams or email'};
const c=await start(lab,'offline',new RegExp(`/api/c${lab}/`),['offline']);
const {page,evidence,top,shot,btn}=c,sec=page.locator(`section[aria-labelledby="lab${lab}-heading"]`);
const status=page.getByLabel(`Lab ${lab} status`,{exact:true}),sp=text=>sec.locator('p').filter({hasText:text}).first();
evidence.captureComplete=false;evidence.stagedScenes=[];evidence.apiResults=[];let owner;
async function scene(id,title,targets){await top(targets[0][1],130);await shot(id,targets.map(([key,loc])=>[key,loc]));evidence.stagedScenes.push({id,title,narration:Object.fromEntries(targets.map(([key,,speech])=>[key,speech]))});await c.save();}
async function act(button,suffix,expected=200){
 const pending=page.waitForResponse(r=>new URL(r.url()).pathname.startsWith(`/api/c${lab}/`)&&new URL(r.url()).pathname.endsWith(suffix)&&r.request().method()==='POST',{timeout:45000});
 await btn(button).click();const response=await pending,data=await response.json(),request=response.request();
 evidence.apiResults.push({path:new URL(response.url()).pathname,status:response.status(),input:request.postDataJSON(),result:data});
 if(response.status()!==expected)throw Error(`${button}: expected ${expected}, got ${response.status()}: ${JSON.stringify(data)}`);
 if(data.providerCalls!==undefined&&data.providerCalls!==0||data.snapshot?.providerCalls!==undefined&&data.snapshot.providerCalls!==0)throw Error('Unexpected model provider call');
 if(button!=='Wrong reviewer')owner=request.headers()['x-lab-owner'];
 await page.waitForFunction(n=>{const b=document.querySelector(`section[aria-labelledby="lab${n}-heading"] .lab-controls button`);return b&&!b.disabled;},lab);
 return data;
}
async function reviewerSnapshot(){const response=await page.request.get(`${c.origin}/api/c65/review`,{headers:{'X-Lab-Owner':owner}});if(!response.ok())throw Error('Reviewer snapshot failed');return response.json();}
try{
 if(lab===65)await page.route('**/api/c65/run',async route=>{const b=route.request().postDataJSON();if(b?.action==='notify'&&b.channel!=='local')throw Error('This capture only permits local notification');await route.continue();});
 await c.intro(titles[lab]);await c.open();const heading=c.h(titles[lab],2);
 await scene('experiment','Open the trusted host exercise',[
  ['exp-rule',heading.locator('xpath=following-sibling::p[1]'),'Open Run the exercise. '+await heading.locator('xpath=following-sibling::p[1]').innerText()],
  ['exp-controls',sec.locator('.lab-controls'),'These controls run a local fixture. Host state and checked effects remain separate from an agent proposal.'],
 ]);
 if(lab===63){
  const rows=()=>sec.getByRole('heading',{name:'Orders',exact:true}).locator('xpath=following-sibling::ul[1]');
  const proposals=()=>sec.getByRole('heading',{name:'Proposals',exact:true}).locator('xpath=following-sibling::ul[1]');
  for(const scenario of ['approved','rejected','stale','expired']){
   const created=await act('Create SQLite session','/sessions');if(!created.readQueryOnly||!created.writeQueryOnly||created.rows.length!==1)throw Error('Expected tenant-filtered query-only SQLite connections');
   if(scenario==='approved'){
    await scene('sqlite-session','A real tenant-scoped SQLite session',[['sqlite-scope',sp('Session:'),'The local SQLite session exposes one host-tenant order. Both connections start query-only, and no model request is made.'],['sqlite-rows',rows(),'The other tenant order exists in the fixture but is filtered out of this result.']]);
    await act('Read order','/query');await act('Try arbitrary SQL','/blocked-sql');
    await scene('sqlite-no-sql','Arbitrary SQL remains teaching data',[['sql-refusal',status,'The arbitrary DELETE text is blocked before reaching DatabaseSync. Read operations use fixed parameterized SQL.']]);
   }
   const proposed=await act('Propose cancellation','/query');if(proposed.committed!==false)throw Error('Proposal must not commit a cancellation');
   await scene(`proposal-${scenario}`,`Database proposal · ${scenario}`,[[`${scenario}-proposal`,proposals(),'The proposal captures the current row version and expiry. It has not cancelled the order.']]);
   if(scenario==='stale')await act('Change row version','/fixture');
   if(scenario==='expired')await act('Advance five minutes','/fixture');
   const result=await act(scenario==='rejected'?'Reject as human':'Approve as human','/decision');
   if(result.outcome!==scenario||result.changedRows!==(scenario==='approved'?1:0))throw Error('Unexpected SQLite decision outcome');
   const text={approved:'The separate human endpoint changes exactly one tenant, status and version-matched row in a transaction.',rejected:'The trusted reviewer rejects the proposal. The order remains open and no row is cancelled.',stale:'The captured version no longer matches the row. The transaction rolls back and marks the proposal stale.',expired:'The virtual clock passes proposal expiry. Approval changes no order row.'};
   await scene(`decision-${scenario}`,`Host database decision · ${scenario}`,[
    [`${scenario}-decision`,status,text[scenario]],
   ]);
   await scene(`rows-${scenario}`,`Authoritative database state · ${scenario}`,[[`${scenario}-rows`,rows(),'Inspect the actual order status and version after the trusted decision. Agent prose does not commit this change.'],[`${scenario}-final-proposal`,proposals(),'The proposal records the host decision independently of the order row.']]);
  }
 }else if(lab===64){
  for(const [scenario,button] of [['inspect-product','Inspect product'],['fill-form','Fill fictional form'],['blocked-navigation','Try blocked navigation'],['missing-browser','Missing browser']]){
   const result=await act(button,'/run');
   if(result.verified!==(scenario!=='missing-browser'))throw Error('Unexpected local browser proof');
   const text={'inspect-product':'A real local browser is driven through Playwright MCP. The host checks product and price in the DOM before accepting proof.','fill-form':'The MCP tools fill and submit a fictional local form. Both its snapshot and DOM confirmation must agree.','blocked-navigation':'Navigation outside the fixture is refused before MCP. The host verifies that the browser remains on the allowed local page.','missing-browser':'Browser launch is deliberately skipped. Zero tool calls and no proof cannot become a successful browser claim.'};
   await scene(`browser-${scenario}`,`Local browser result · ${scenario}`,[[`${scenario}-status`,status,text[scenario]],[`${scenario}-scope`,sp('Source:'),'Read the source, number of MCP calls and verification result as separate facts. This is a host browser, not a cloud Managed browser connection.']]);
   await scene(`events-${scenario}`,`MCP host evidence · ${scenario}`,[[`${scenario}-events`,sec.locator('ol'),'These events identify the allowlisted local operations or the deliberate unavailable-browser case.']]);
   if(result.proofId){
    const img=sec.getByRole('img',{name:'Screenshot of the verified local fixture page'});await img.waitFor();await img.evaluate(im=>im.decode());
    await scene(`proof-${scenario}`,`Verified browser screenshot · ${scenario}`,[[`${scenario}-proof`,img,'This screenshot is the actual fixture page captured by Playwright MCP after the host DOM checks. No external site or real purchase was used.']]);
   }
  }
 }else{
  const latest=()=>sec.locator('article').last();
  await act('Preview proposal','/run');await act('Notify locally','/run');
  await scene('approval-preview','Inspect immutable arguments before review',[
   ['approval-immutable',latest().locator('p').first(),'The fictional case archive is still pending. Its reason and action arguments were fixed when the host accepted the proposal.'],
   ['approval-correlation',latest().locator('p').nth(1),'The custom-tool event correlation and stable business key serve different purposes. Neither grants reviewer authority.'],
  ]);
  await act('Tamper action','/run');await scene('approval-tamper','Refuse changed arguments',[['tamper-status',status,'The host refuses a changed case identifier and retains the original immutable proposal.']]);
  await act('Wrong reviewer','/run',409);if((await reviewerSnapshot()).effects.length!==0)throw Error('Wrong reviewer produced an effect');
  await scene('approval-reviewer','Refuse the wrong reviewer',[['reviewer-status',status,'A mismatched trusted reviewer session cannot approve the proposal. No fictional effect is executed.']]);
  await act('Expire proposal','/run');await act('Approve as reviewer','/run',409);
  await scene('approval-expired','Refuse expired approval',[['expired-status',status,'An expired proposal cannot be approved, even by a reviewer with a valid session.']]);
  await act('Preview proposal','/run');await act('Notify locally','/run');const rejected=await act('Reject as reviewer','/run');if(rejected.effects.length!==0)throw Error('Rejected proposal produced an effect');
  await scene('approval-rejected','Reject without an effect',[['rejected-proposal',latest(),'Local notification records no outbound message. Rejection records a decision without archiving the fictional case.']]);
  await act('Preview proposal','/run');await act('Notify locally','/run');const approved=await act('Approve as reviewer','/run');if(approved.effects.length!==1)throw Error('Expected one fictional archive effect');
  await scene('approval-approved','One trusted approval, one fictional effect',[['approved-proposal',latest(),'Only a notified, immutable, unexpired proposal with its trusted reviewer reaches this local effect.'],['approved-effect',sec.locator('[data-guide-evidence]'),'The database records exactly one fictional archive effect using a unique business key.']]);
  await act('Duplicate click','/run',409);if((await reviewerSnapshot()).effects.length!==1)throw Error('Duplicate review changed effect count');
  await scene('approval-duplicate','Refuse a duplicate decision',[['duplicate-status',status,'The duplicate decision is refused and the verified effect count stays at one.']]);
  await scene('notification-scope','Keep notification and approval separate',[['notification-rule',sec.locator('p').last(),'Slack, Teams and email are optional adapters. This demonstration used only local notification; no external message was sent and notifications never approve a proposal.']]);
 }
 await scene('scope','Record the host boundary',[['scope-rule',sec.locator('p').last(),await sec.locator('p').last().innerText()]]);
 await c.codeTour([1,2,3]);await c.knowledge();evidence.captureComplete=true;
}finally{await c.done();}
