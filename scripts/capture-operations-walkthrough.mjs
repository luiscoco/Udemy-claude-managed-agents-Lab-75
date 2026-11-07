// Capture real local host exercises. No credentials or model calls are used.
import {start} from './lab_capture_common.mjs';
const lab=Number(process.argv[2]);
if(!Number.isInteger(lab)||lab<56||lab>60)throw Error('Choose Lab 56 through 60');
const titles={56:'Teams and evidence messages',57:'Workers in host Git worktrees',58:'Tool catalogs and bounded discovery',59:'Routing with verified outcomes',60:'Durable long running agents'};
const c=await start(lab,'offline',new RegExp(`/api/c${lab}/`),['offline']);
const {page,btn,top,shot,evidence}=c;
const sec=page.locator(`section[aria-labelledby="lab${lab}-heading"]`);
const sp=text=>sec.locator('p').filter({hasText:text}).first();
const status=page.getByLabel(`Lab ${lab} status`,{exact:true});
evidence.captureComplete=false;evidence.stagedScenes=[];evidence.apiResults=[];
async function scene(id,title,targets){
 await top(targets[0][1],130);
 await shot(id,targets.map(([key,loc])=>[key,loc]));
 evidence.stagedScenes.push({id,title,narration:Object.fromEntries(targets.map(([key,,speech])=>[key,speech]))});
 await c.save();
}
async function act(button,path){
 const pending=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/c${lab}/${path}`&&r.request().method()==='POST',{timeout:125000});
 await btn(button).click();const response=await pending;const data=await response.json();
 evidence.apiResults.push({path,status:response.status(),input:response.request().postDataJSON(),result:data});
 if(!response.ok())throw Error(`${path}: ${response.status()} ${JSON.stringify(data)}`);
 if(data.providerCalls!==0)throw Error('Expected explicitly zero provider calls');
 await page.waitForFunction(n=>{const s=document.querySelector(`section[aria-labelledby="lab${n}-heading"]`);return s&&![...s.querySelectorAll('.lab-controls button')].some(b=>b.disabled&&b.textContent!=='Recover batch');},lab);
 await page.waitForTimeout(200);
 return data;
}
try{
 await c.intro(titles[lab]);await c.open();
 const heading=c.h(titles[lab],2);
 await scene('experiment','Open the local experiment',[
  ['exp-rule',heading.locator('xpath=following-sibling::p[1]'),'Open Run the exercise. '+await heading.locator('xpath=following-sibling::p[1]').innerText()],
  ['exp-controls',sec.locator('.lab-controls'),'These controls choose local fixture scenarios. Their results do not establish live model performance.'],
 ]);
 if(lab===56){
  const explanations={
   'blocked-review':'The reviewer cannot claim work while its evidence dependency is blocked.',
   'competing-claim':'The reviewer cannot claim the researcher role. The host preserves the existing owner.',
   'busy-shutdown':'Shutdown is refused while claimed work remains unfinished.',
   'duplicate-envelope':'An identical stable envelope is accepted as a replay without another delivery or task completion.',
   'ack-before-delivery':'The reviewer cannot acknowledge a queued envelope before delivery.',
   'rejected-30':'The owner cannot complete the arithmetic task with thirty; the host independently checks thirty-seven.',
   'verified-37':'Delivered and acknowledged evidence unlocks review. Only explicit, checked completion establishes the verified answer.',
   'clean-shutdown':'Both tasks finish, the evidence is acknowledged, and only then does clean shutdown succeed.',
  };
  for(const [scenario,speech] of Object.entries(explanations)){
   await sec.locator('select').selectOption(scenario);const result=await act('Replay team actions','replay');
   if(scenario==='clean-shutdown'&&(!result.shutdown||result.verifiedAnswer!==37))throw Error('Clean team completion missing');
   await scene(`team-${scenario}`,`Team replay · ${scenario}`,[[`${scenario}-summary`,sp('Verified answer:'),speech]]);
   await scene(`actions-${scenario}`,`Host decisions · ${scenario}`,[[`${scenario}-actions`,sec.locator('.lab-results ol'),'Read the accepted and rejected actions in order. Delivery, acknowledgment and completion remain separate state changes.']]);
  }
  await scene('team-ownership','Completed ownership and evidence',[
   ['team-tasks',sec.getByRole('heading',{name:'Task ownership'}).locator('xpath=following-sibling::ul[1]'),'The host records both tasks as done with their authorized owners.'],
   ['team-envelope',sec.getByRole('heading',{name:'Evidence envelopes'}).locator('xpath=following-sibling::ul[1]'),'One stable envelope carries the checked evidence and is acknowledged by its addressed reviewer.'],
  ]);
 }else if(lab===57){
  const expected={'serial-integration':'passed','competing-edits':'conflicted','failed-worker':'blocked','cancel-worker':'cancelled'};
  const explanations={
   'serial-integration':'The host verifies independent greeting and tax edits, integrates their commits serially, and passes the combined behavioral test.',
   'competing-edits':'Each competing edit passes alone, but cherry-picking both produces a real Git conflict. The host aborts the cherry-pick and preserves both branches.',
   'failed-worker':'The deliberately incorrect tax edit fails its behavioral test. No worker claim can bypass the host commit and integration gate.',
   'cancel-worker':'Cancellation retains the edited worktree but prevents its commit and combined integration.',
  };
  for(const scenario of Object.keys(expected)){
   await sec.locator('select').selectOption(scenario);const result=await act('Run local worktrees','run');
   if(result.integration!==expected[scenario]||!result.branchesPreserved)throw Error('Unexpected host Git outcome');
   await scene(`worktree-${scenario}`,`Local Git result · ${scenario}`,[[`${scenario}-summary`,sp('Base SHA:'),explanations[scenario]]]);
   await scene(`workers-${scenario}`,`Verified worker evidence · ${scenario}`,[[`${scenario}-workers`,sec.getByRole('heading',{name:'Worker evidence'}).locator('xpath=following-sibling::ul[1]'),'Inspect allowlisted changes, untracked paths, behavioral tests and host commit decisions. These are authored worker actions in real local Git worktrees.']]);
   await scene(`integration-${scenario}`,`Integration timeline · ${scenario}`,[[`${scenario}-timeline`,sec.getByRole('heading',{name:'Host timeline'}).locator('xpath=following-sibling::ol[1]'),'The host timeline records the actual Git operations. Worktrees separate files and refs; they do not provide operating-system or tenant isolation.']]);
  }
 }else if(lab===58){
  for(const variant of ['good','vague']){
   await sec.locator('select').selectOption(variant);const result=await act('Search catalog','search');
   if(result.results.length>5)throw Error('Discovery bound exceeded');
   await scene(`search-${variant}`,`Catalog metadata · ${variant}`,[
    [`${variant}-estimate`,sp('Initial names estimate:'),'The host estimates token counts for names and returned definitions. These figures are estimates, not live provider usage.'],
    [`${variant}-results`,sec.locator('ol'),'Compare the five highest-ranked authored definitions for this same query. Metadata changes the transparent local scorer; no native tool is registered.'],
   ]);
  }
  for(const [scenario,button] of [['unauthorized','Try unauthorized refund'],['authorized','Run authorized fixture']]){
   await act(button,'run');
   await scene(`dispatch-${scenario}`,`Host dispatch · ${scenario}`,[[`${scenario}-dispatch`,sec.locator('pre.lab-json'),scenario==='unauthorized'?'Discovery does not grant authority. The trusted dispatcher refuses the unauthorized refund request.':'The authorized fixture still passes through a closed schema and trusted host context. Its effect is fictional; no payment is sent.']]);
  }
 }else if(lab===59){
  for(const strategy of ['fixed-light','fixed-standard','fixed-deep','rule','classifier','cascade','draft-review']){
   await sec.locator('select').selectOption(strategy);const result=await act('Run routing fixture','run');
   await scene(`routing-${strategy}`,`Authored routing · ${strategy}`,[[`${strategy}-summary`,sp('Correct:'),'This strategy is checked against thirteen private host answers. Sessions, spend, time and token figures are authored offline assumptions, not measured API performance.']]);
   const index=result.taskResults.findIndex(task=>!task.correct||task.attempts.length>1);
   if(index>=0)await scene(`task-${strategy}`,`Inspect a checked task · ${strategy}`,[[`${strategy}-task`,sec.locator('ol > li').nth(index),'The host answer key verifies this task independently of the proposed answer and confidence. Each attempt represents a hypothetical separate session.']]);
  }
  await sec.locator('select').selectOption('fixed-deep');await sec.locator('input').fill('100');
  const limited=await act('Run routing fixture','run');if(!limited.stoppedByBudget)throw Error('Expected budget stop');
  await scene('routing-budget','Stop before exceeding the assumed budget',[['budget-summary',sp('Correct:'),'With a smaller assumed budget, the host stops before the remaining tasks. Incomplete tasks do not become correct results. No live model switch or price guarantee is demonstrated.']]);
 }else{
  for(const strategy of ['naive-restart','journal-only','journal-idempotency']){
   await sec.locator('select').nth(1).selectOption(strategy);const crashed=await act('Start offline batch','run');
   if(crashed.ledger.length!==3||crashed.journalKeys.length!==2)throw Error('Expected effect-before-journal crash');
   await scene(`crash-${strategy}`,`Crash boundary · ${strategy}`,[[`${strategy}-crash`,sp('Job:'),'A fresh fictional batch crashes after its third ledger effect but before the third journal write. Three effects and only two journaled keys expose the recovery gap.']]);
   const recovered=await act('Recover batch','recover');
   const expected={'naive-restart':3,'journal-only':1,'journal-idempotency':0};
   if(recovered.duplicates!==expected[strategy]||recovered.state!=='done')throw Error('Unexpected recovery effect count');
   const speech={'naive-restart':'Restarting every eligible item repeats three effects. A completed run can still contain duplicates.','journal-only':'Skipping journaled keys avoids two repeats, but the unjournaled third effect is applied twice.','journal-idempotency':'The stable business key finds the already-recorded third effect, suppresses its repeat, and completes with zero duplicates.'};
   await scene(`recovery-${strategy}`,`Recovery result · ${strategy}`,[[`${strategy}-recovered`,sp('Job:'),speech[strategy]]]);
   await scene(`ledger-${strategy}`,`Fictional ledger · ${strategy}`,[[`${strategy}-ledger`,sec.locator('ol'),'Inspect the actual persisted fictional effects. Stable business keys identify repeats independently of the conversation transcript.']]);
  }
  for(const scenario of ['lease-loss','no-progress']){
   await sec.locator('select').nth(0).selectOption(scenario);await act('Start offline batch','run');
   const recovered=await act('Recover batch','recover');if(recovered.state!=='failed')throw Error('Supervisor must fail closed');
   await scene(`supervisor-${scenario}`,`Supervisor refusal · ${scenario}`,[[`${scenario}-supervisor`,sp('Job:'),'The supervisor fails closed for '+scenario.replaceAll('-',' ')+'. A recovery request cannot bypass ownership, lease and progress checks. No actual refund or email is sent.']]);
  }
 }
 await scene('scope','Keep the evidence scoped',[['scope-rule',sec.locator('p').last(),await sec.locator('p').last().innerText()]]);
 await c.codeTour([1,2,3]);await c.knowledge();evidence.captureComplete=true;
}finally{await c.done();}
