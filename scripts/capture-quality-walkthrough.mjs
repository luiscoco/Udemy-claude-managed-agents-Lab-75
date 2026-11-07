// Real offline captures for Labs 51-55. Does not load provider credentials or run a live model.
import {start} from './lab_capture_common.mjs';
const lab=Number(process.argv[2]);
if(!Number.isInteger(lab)||lab<51||lab>55)throw Error('Usage: node scripts/capture-quality-walkthrough.mjs 51..55');
const titles={51:'Testing the Managed host offline',52:'Evals, judges and regression baselines',53:'Debugging session and host traces',54:'Designing tools the model uses well',55:'Official SDK and API upgrades'};
const headings={51:'Test the Managed host offline',52:titles[52],53:'Debug session and host traces',54:'Design tools the model uses well',55:'Rehearse an SDK and API upgrade'};
const c=await start(lab,'offline',new RegExp(`/api/c${lab}/`),['offline']);
const {page,btn,top,shot,evidence}=c;
const sec=page.locator(`section[aria-labelledby="lab${lab}-heading"]`);
const status=page.getByLabel(`Lab ${lab} status`,{exact:true});
const sp=text=>sec.locator('p').filter({hasText:text}).first();
evidence.captureComplete=false;evidence.stagedScenes=[];evidence.apiResults=[];
async function scene(id,title,targets){
 await top(targets[0][1],130);
 await shot(id,targets.map(([id,loc])=>[id,loc]));
 evidence.stagedScenes.push({id,title,narration:Object.fromEntries(targets.map(([id,,speech])=>[id,speech]))});
 await c.save();
}
async function act(button,path){
 const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/c${lab}/${path}`&&r.request().method()==='POST',{timeout:20000});
 await btn(button).click();const response=await responsePromise;const data=await response.json();
 evidence.apiResults.push({path,status:response.status(),input:response.request().postDataJSON(),result:data});
 if(!response.ok())throw Error(`Offline ${path} returned ${response.status()}: ${JSON.stringify(data)}`);
 if(data.providerCalls!==undefined&&data.providerCalls!==0)throw Error('Offline capture observed provider calls');
 await page.waitForFunction(n=>![...document.querySelectorAll(`section[aria-labelledby="lab${n}-heading"] .lab-controls button`)].some(b=>b.textContent?.includes('Run')&&b.disabled),lab);
 return data;
}
try{
 await c.intro(titles[lab]);await c.open();
 const heading=c.h(headings[lab],2);
 await scene('experiment','Open the experiment',[
  ['exp-rule',heading.locator('xpath=following-sibling::p[1]'),'Open Run the exercise. '+await heading.locator('xpath=following-sibling::p[1]').innerText()],
  ['exp-controls',sec.locator('.lab-controls').first(),'The controls choose the local scenario and start its host operation.'],
 ]);
 evidence.liveButtons=await page.getByRole('button',{name:'Run live',exact:true}).count();
 if(lab===51){
  const result=await act('Run offline host tests','run');
  if(!result.pass||!result.mutationDetected)throw Error('Expected offline host suite and mutation detection');
  await scene('suite','Offline suite result',[
   ['suite-summary',sp('Suite:'),'The complete injected-host suite meets its expectations, makes zero provider calls and detects the deliberate policy mutation.'],
  ]);
  const descriptions={
   'malformed-order':'The closed tool schema refuses a string amount and a supplied customer identity before an approval or refund exists.',
   'foreign-order':'The host refuses an order owned by a different customer, with zero approvals and refunds.',
   denial:'A trusted host denial consumes the pending review and leaves the refund ledger empty.',
   cancellation:'Closing a waiting conversation cancels its pending approval without issuing a refund.',
   'missing-terminal':'The injected port ends without idle. The result remains incomplete, with no trusted summary or refund.',
   'child-thread':'A worker-thread message passes through the shared event consumer with its thread identity retained.',
   'duplicate-events':'The authoritative message replaces its preview, and the repeated event ID is ignored.',
   'invalid-report':'The closed summary schema rejects an invented refund identifier.',
   'retained-session':'Two sends retain one session, produce two authoritative answers, and refuse another owner.',
   'real-policy-window':'The unmodified host rejects an order outside the thirty-day refund window under a virtual clock.',
   'mutated-policy-window':'The deliberate sixty-day mutation violates the thirty-day assertion. Its expected failure proves that this test detects the policy drift.',
  };
  for(const [index,item] of result.assertions.entries()){
   const li=sec.locator('.lab-results ol > li').nth(index);
   await scene(`assert-${item.name}`,`Host assertion · ${item.name}`, [
    [`${item.name}-result`,li.locator('strong'),descriptions[item.name]],
    [`${item.name}-values`,li.locator('p').first(),'Compare the expected result with the actual host state shown here.'],
    [`${item.name}-evidence`,li.locator('p').last(),'The evidence comes from the real local handler, store or event consumer, with no model request.'],
   ]);
  }
  await sec.locator('select').selectOption('duplicate-events');await act('Replay recorded events','replay');
  await scene('replay','Replay without a provider',[
   ['replay-summary',sp('Suite:'),'The selected event replay also passes through the same shared consumer.'],
   ['replay-result',sec.locator('.lab-results li').first(),'Preview replacement and duplicate suppression are observable without creating a remote session.'],
  ]);
 }else if(lab===52){
  const selects=sec.locator('select');await selects.nth(1).selectOption('1');
  for(const variant of ['baseline','regression','recovered']){
   await selects.nth(0).selectOption(variant);await act('Run offline eval','run');
   const explanations={baseline:'The baseline evaluates holdout effects using the actual host handlers. A baseline alone is not a promotable candidate.',regression:'The regression candidate claims refunds that the host denied. The failed safety and regression checks block promotion.',recovered:'The recovered candidate agrees with the host ledger and passes the baseline comparison.'};
   await scene(`eval-${variant}`,`Evaluate · ${variant}`,[
    [`${variant}-summary`,sp(/^Report /),explanations[variant]],
    [`${variant}-scope`,sp(/^SDK /),'SDK and API identity are recorded, while model, agent version, latency, tokens and cost remain unknown offline.'],
   ]);
   for(const [i,name] of ['correct-damage','hallucinated-refund','over-refund','injection'].entries()){
    if(variant==='baseline'&&i>0)continue;
    const item=sec.locator('.lab-results ol > li').nth(i);
    await scene(`${variant}-${name}`,`${variant} · ${name}`,[
     [`${variant}-${name}-verdict`,item.locator('strong'),'This holdout case compares its refund claim with the host-verified effect.'],
     [`${variant}-${name}-effect`,item.locator('p').first(),'Read claimed refunds, ledger refunds, safety, judge result and tool acceptance as separate fields.'],
     [`${variant}-${name}-evidence`,item.locator('p').last(),'The evidence names the risk and the correlated host tool result.'],
    ]);
   }
   if(variant!=='baseline'){
    await act('Compare with baseline','pairwise');
    await scene(`pair-${variant}`,`Pairwise comparison · ${variant}`,[
     [`pair-${variant}-result`,sp(/^Pairwise:/),'The pairwise result reports the pass-rate difference, regressions and the server promotion decision.'],
    ]);
   }
  }
  await act('Promote local result','promote');
  await scene('local-promotion','Promote only the local eval pointer', [['local-promotion-status',status,'This promotion changes a local result pointer. No agent or deployment changes.']]);
  for(const [name,button] of [['agreement','Judge agreement'],['disagreement','Judge disagreement'],['invalid','Invalid judge JSON']]){
   await act(button,'calibrate');
   await scene(`judge-${name}`,`Calibrate the optional judge · ${name}`,[[`judge-${name}-result`,sp(/^Calibration:/),'Compare the authored judge with the host verdict. Disagreement or invalid JSON cannot become trusted promotion evidence.']]);
  }
 }else if(lab===53){
  for(const scenario of ['valid-control','malformed-report','denied-tool','missing-idle','local-turn-limit','stream-eof','cleanup-timeout']){
   await sec.locator('select').selectOption(scenario);await act('Run trace','run');
   await scene(`trace-${scenario}`,`Debug · ${scenario}`,[
    [`${scenario}-lifecycle`,sp(/^Local run /),'Correlate the local run and remote fixture session, then inspect event outcome, remote stop and cleanup separately.'],
    [`${scenario}-cause`,sp('First useful evidence:'),'Start with the first useful trace entry and the host diagnosis.'],
    [`${scenario}-effects`,sp('History gap:'),'History completeness, report validation and the host refund ledger support different conclusions. These are authored offline traces.'],
   ]);
   const trace=sec.locator('.lab-results ol');
   await scene(`entries-${scenario}`,`Trace entries · ${scenario}`,[[`entries-${scenario}-list`,trace,'Follow the ordered, redacted event, host-decision, effect, transport and cleanup entries. A message alone cannot establish an effect or remote completion.']]);
  }
  await btn('Inspect saved run').click();await page.getByText('Owned trace retrieved without replaying effects.',{exact:true}).waitFor();
  await scene('saved-run','Read an owned saved trace',[['saved-run-status',status,'The saved trace is retrieved for the same owner without repeating the tool effects.']]);
 }else if(lab===54){
  for(const variant of ['vague','explicit']){
   await sec.locator('select').nth(0).selectOption(variant);
   await scene(`contract-${variant}`,`Tool contract · ${variant}`,[
    [`${variant}-description`,sec.getByRole('heading',{name:'Authored tool contract'}).locator('xpath=following-sibling::p[1]'),variant==='vague'?'The vague contract leaves units and effect unclear.':'The explicit contract names a host-reviewed refund proposal and specifies integer cents.'],
    [`${variant}-lint`,sp('Contract linter:'),'The linter reports contract clarity issues rather than measuring model behavior.'],
    [`${variant}-metadata`,sp('Host metadata:'),'Risk, effect and idempotency metadata belong to the host. They are separate from native SDK annotations.'],
   ]);
   const result=await act('Run all four cases','run');
   for(const [i,item] of result.cases.entries()){
    const section=sec.locator('.lab-results > section').nth(i);
    await scene(`${variant}-${item.scenario}`,`${variant} · ${item.scenario}`,[
     [`${variant}-${item.scenario}-name`,section.locator('h4'),'Inspect this scripted tool scenario. The host handler determines the effects.'],
     [`${variant}-${item.scenario}-effects`,section.locator('p').first(),item.scenario==='correct-idempotent'?'The successful review uses one stable business action, one approval and one refund despite repeated calls.':'An invalid argument, domain refusal or missing prerequisite cannot authorize a refund.'],
    ]);
    if(variant==='explicit')for(const [j] of item.steps.entries()){
     await scene(`step-${item.scenario}-${j}`,`Host result · ${item.scenario} · ${j+1}`,[[`step-${item.scenario}-${j}-trace`,section.locator('ol > li').nth(j),'Inspect the actual scripted input, correlated result, action key and recovery guidance. A new event ID does not create a new business action.']]);
    }
   }
  }
 }else{
  await act('Analyze candidate','run');
  const state=()=>sp(/^State:/);
  await scene('compatible','Compatible candidate fixture',[
   ['compatible-state',state(),'The server classifies the authored candidate as eligible. This is rehearsal evidence.'],
   ['compatible-pins',sp('Installed npm baseline'),'The installed package baseline and the separate agent, environment and skill pins remain explicit. No candidate package is installed.'],
  ]);
  for(const [action,button] of [['canary','Rehearse canary'],['promotion','Rehearse promotion'],['rollback','Rehearse rollback']]){
   await act(button,'transition');
   await scene(`transition-${action}`,`Rehearse · ${action}`,[
    [`${action}-state`,state(),'The server enforces the candidate, canary, promotion and rollback state transitions.'],
    [`${action}-remote`,sp('Remote sessions rewound'),'Host-code rollback does not rewind already-created remote sessions. No real deployment occurred.'],
   ]);
  }
  for(const scenario of ['removed-type','stream-change','policy-drift','missing-usage','quality-regression','missing-evidence']){
   await sec.locator('select').selectOption(scenario);await act('Analyze candidate','run');
   const blocked=sec.locator('.lab-results li').filter({hasText:': blocked'});
   await scene(`candidate-${scenario}`,`Candidate refusal · ${scenario}`,[
    [`${scenario}-state`,state(),'The server blocks advancement for this authored compatibility failure, despite the client eligible hint.'],
   ]);
   await scene(`check-${scenario}`,`Blocking evidence · ${scenario}`,[[`${scenario}-check`,blocked,'This failed server check identifies the evidence needed before advancement. A package version alone cannot establish API, permission or quality compatibility.']]);
  }
 }
 await c.codeTour([1,2,3]);await c.knowledge();evidence.captureComplete=true;
}finally{await c.done();}
