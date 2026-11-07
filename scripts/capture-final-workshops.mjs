import {workshop} from './walkthrough-scenes.mjs';
const lab=Number(process.argv[2]);if(lab<71||lab>75)throw Error('Choose Lab 71 through 75');
const titles={71:'A data analysis agent',72:'Document generation with Skills',73:'An autonomous PR reviewer and fixer',74:'Prompt injection red teaming',75:'Capstone 2 an autonomous engineering team'};
const w=await workshop(lab),{page,sec,status,sp,scene,api,btn,evidence}=w;
try{
 await w.intro(titles[lab]);
 if(lab===71){
  await api('Create analysis session','/sessions');
  await scene('analysis-created','Inspect the source dataset',[['analysis-status',status,'The owner-scoped ledger starts with forty-nine authored rows, including an exact duplicate, missing revenue and an outlier. No live model produced these rows.']]);
  await sec.locator('select').nth(0).selectOption('raw');await api('Profile dataset','/tool');
  await scene('analysis-raw','Profile before cleaning',[['analysis-profile',sec.locator('article').last(),'The host records the raw profile, including missing values and explicit quality choices. Empty cells are not silently zero-filled.']]);
  await api('Aggregate metric','/tool');await scene('analysis-raw-sum','Record a raw aggregate',[['analysis-aggregate',sec.locator('article').last(),'The aggregation records a computation identifier, quality, units, eligible row counts and skipped empty cells.']]);
  await sec.locator('select').nth(0).selectOption('clean');await api('Aggregate metric','/tool');
  await scene('analysis-clean','Compare a cleaned computation',[['analysis-clean-values',sec.locator('article').last(),'Clean mode removes duplicates and per-product unit outliers under the documented quartile rule. The separate ledger entry preserves the distinction from raw data.']]);
  await api('Chart last aggregate','/tool');await scene('analysis-chart','Chart recorded ledger values',[['analysis-chart-image',sec.locator('figure'),'The actual SVG chart refers to the last aggregate computation. A chart is evidence only for those recorded numbers.']]);
  const result=await api('Run scripted analyst','/scripted');if(!result.verification?.valid)throw Error('Scripted report not verified');
  await scene('analysis-report','Verify the authored report',[['analysis-report-check',sec.locator('article').last(),'The scripted report passes the same host verifier used for externally supplied reports. Its findings cite recorded computations and chart identifiers.']]);
  const tampered=await api('Verify tampered report','/verify');if(tampered.valid)throw Error('Tampered report accepted');
  await scene('analysis-tampered','Reject a changed number and invented citation',[['analysis-tamper-check',sec.locator('article').last(),'Changing a value and inventing computation C nine nine nine causes rejection. The authoritative computation ledger remains unchanged.']]);
 }else if(lab===72){
  for(const scenario of ['incident','ordinary','invalid-spec','injection','placeholder','skill-tamper']){
   await sec.getByLabel('Scenario',{exact:true}).selectOption(scenario);const result=await api('Build document','/build');
   await scene(`doc-${scenario}`,`Document control: ${scenario}`,[[`doc-${scenario}-status`,status,`Inspect the actual ${scenario} result: ${await status.innerText()}`]]);
   if(result.verification)await scene(`doc-${scenario}-verification`,`Independent checks: ${scenario}`,[[`doc-${scenario}-check`,sec.locator('article'),'The independent package and incident-contract results establish what passed. They do not establish visual pagination in Word.']]);
   if(scenario==='incident'){
    if(!result.verification?.valid||!result.fileId)throw Error('Incident DOCX not verified');
    const download=page.waitForEvent('download');await btn('Download verified DOCX').click();await (await download).saveAs(`presentations/managed-agents-lab72-walkthrough/platform/verified-report.docx`);
    await api('Check command policy','/policy');await scene('doc-command','Reject a command string',[['doc-command-status',status,'The policy probe does not execute a command. Only the typed builder name may reach fixed host arguments.']]);
   }
  }
 }else if(lab===73){
  for(const scenario of ['good-fix','out-of-scope','skipped-tests','unresolved','malformed-review','timeout']){
   await sec.getByLabel('Scenario',{exact:true}).selectOption(scenario);const result=await api('Run PR review and fix','/run');
   if(scenario==='good-fix'&&(result.state!=='ready'||result.commits.length!==1))throw Error('Expected one verified local fix');
   if(scenario!=='good-fix'&&result.state==='ready')throw Error('Negative PR control became ready');
   await scene(`pr-${scenario}`,`Local PR control: ${scenario}`,[[`pr-${scenario}-status`,status,`Actual disposable Git fixture result: ${await status.innerText()} No remote push or PR publication occurs.`]]);
   await scene(`pr-${scenario}-gates`,`Inspect host gates: ${scenario}`,[[`pr-${scenario}-checks`,sec.locator('table'),'Read the observed host gates and real Node test outcomes. Model prose cannot replace path, behavior or post-commit checks.']]);
  }
 }else if(lab===74){
  for(const defense of ['none','pinned']){
   await sec.getByLabel('Defense',{exact:true}).selectOption(defense);await api('Run offline attack','/simulate');
   await scene(`attack-${defense}`,`Fictional attack with ${defense} defenses`,[[`attack-${defense}-evidence`,sec.locator('article').first(),'Inspect attempted and executed fictional effects, final-output checks and safe draft utility separately. These are worst-case scripted model trials, not a measured model success rate.']]);
  }
  const matrixPending=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/c74/matrix'&&r.request().method()==='GET');await btn('Compare defense matrix').click();const matrixResponse=await matrixPending;if(!matrixResponse.ok())throw Error('Matrix request failed');evidence.apiResults.push({path:'/matrix',method:'GET',result:await matrixResponse.json()});await sec.locator('table').waitFor();await scene('attack-matrix','Compare the actual scripted matrix',[['attack-matrix-table',sec.locator('table'),'The matrix reports samples, attack success and utility for each cumulative defense. Zero scripted successes do not prove immunity.']]);
  await api('Normalize and detect','/detect');await scene('attack-detector','Probe the heuristic detector',[['attack-detector-status',status,'Normalization and detector matches are observable heuristics. They are not a substitute for denying dangerous effects.']]);
  await api('Run bounded mutations','/adaptive');await scene('attack-adaptive','Bound authored mutations',[['attack-adaptive-status',status,'The bounded mutation count and assumed cents belong to an offline fixture. They are not billed usage or a live adversarial model evaluation.']]);
 }else{
  for(const preset of ['good','protected-deletion','cycle']){
   await sec.getByLabel('Plan preset',{exact:true}).selectOption(preset);const result=await api('Validate plan only','/plan/validate');if(result.valid!==(preset==='good'))throw Error('Unexpected plan gate');
   await scene(`team-plan-${preset}`,`Plan validation: ${preset}`,[[`team-plan-${preset}-status`,status,'Plan validation computes dependency waves or rejects forbidden ownership and dependency structure before any worker is created.']]);
  }
  for(const scenario of ['happy-rework','test-gaming','hidden-boundary','budget-exhaustion','crash-resume']){
   await sec.getByLabel('Scenario',{exact:true}).selectOption(scenario);let result=await api('Run engineering team','/runs',202);
   for(let n=0;n<240&&['pending','running'].includes(result.state);n++){await page.waitForTimeout(500);result=await w.read(`runs/${result.id}`);}
   if(['pending','running'].includes(result.state))throw Error('Team did not settle');evidence.apiResults.push({path:`runs/${result.id}`,method:'GET',result});
   await status.filter({hasText:/Team /}).waitFor();
   await scene(`team-${scenario}`,`Team control: ${scenario}`,[[`team-${scenario}-status`,status,'Inspect the actual terminal team state. The roles are scripted; host Git worktrees, Node tests, integration checks and journal entries are real.']]);
   await scene(`team-${scenario}-release`,`Release gate: ${scenario}`,[[`team-${scenario}-release`,sec.getByRole('heading',{name:/Release gate:/}),'The host release gate distinguishes a ready handoff from a draft. A person still owns publication.']]);
   if(scenario==='happy-rework')await scene('team-tasks','Inspect verified task outcomes',[['team-task-list',sec.locator('article').first(),'The host records development rounds, review reworks, commits and verification checks independently of the team board.']]);
   if(scenario==='crash-resume'&&result.state==='interrupted'){
    await api('Resume interrupted team','/resume');await status.filter({hasText:/Team /}).waitFor();await scene('team-resume','Resume the retained journal',[['team-resume-status',status,'Resume uses retained authoritative state and stable work identity. It does not infer completion from conversational claims.']]);
   }
  }
  await scene('team-readiness','Record the dedicated live setup boundary',[['team-live-ready',sp('Live readiness:'),'Readiness makes no provider calls. A dedicated live team requires separately configured role pins and its isolated key. The recorded browser experiments remain explicitly scripted.']]);
 }
 await w.finish();
}finally{await w.done();}
