// Capture Lab 02 from the running platform for the Lab 02 step-by-step video.
// Usage: node scripts/capture-lab02-walkthrough.mjs offline|live|live-deadline
// "offline" runs authored fixtures only. "live" performs exactly two billed runs (system prompt inherit, then override);
// "live-deadline" performs one more billed run with the system prompt inherited and a 60-second local deadline.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live','live-deadline'].includes(mode))throw Error('Usage: offline|live|live-deadline');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab02-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c2/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,scenario:b.scenario??null,system:b.system?.choice,previews:b.previews,budgetCents:b.budgetCents,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const outcome=page.getByRole('group',{name:'Turn outcome',exact:true});
 const rows=page.locator('table.options-experiments tbody tr');
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode!=='offline')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 async function run(kind,scenario){
  const before=await rows.count();
  if(kind==='scripted'){await page.getByLabel('Offline scenario',{exact:true}).selectOption(scenario);await page.getByRole('button',{name:'Run offline fixture',exact:true}).click();}
  else await page.getByRole('button',{name:'Run live',exact:true}).click();
  await page.waitForFunction(n=>document.querySelectorAll('table.options-experiments tbody tr').length>n,before,{timeout:kind==='live'?180000:60000});
  await page.waitForTimeout(1200);return outcome.innerText();
 }
 await page.goto(origin+'/?lesson=2',{waitUntil:'networkidle'});
 if(mode==='offline'){
  const title=h('Session options',1);await top(title,150);
  await shot('lesson',[['lesson-title',title],['lesson-objective',title.locator('xpath=following-sibling::p[1]')]]);
  await top(h('Your lab path'),130);
  await shot('learn',[['learn-objective',page.locator('main p').filter({hasText:/^Objective:/}).first()]]);
  for(const [kind,tabName,regions] of [['concepts','Concept map',[1,2,4,6]],['lab','Lab walkthrough',[1,2,3]]]){
   await tab(tabName).click();const card=page.locator('.lesson-infographic');await card.waitFor();
   for(const n of regions){
    await card.getByRole('group',{name:'Infographic study links'}).getByRole('button').nth(n-1).click();await page.waitForTimeout(900);
    await top(card.locator('.infographic-viewport'),100);await page.waitForTimeout(700);
    await shot(`${kind}-${n}`,[[`${kind}-${n}-region`,card.locator('.infographic-region-highlight')]]);
   }
  }
  await tab('Run the exercise').click();await top(h('Control session options'),130);
  await shot('exercise',[['exercise-prompt',page.getByLabel('Prompt',{exact:true})],['exercise-model',page.getByLabel('Model',{exact:true})],['exercise-system',page.getByLabel('System prompt',{exact:true})]]);
  const budget=page.locator('label').filter({hasText:'Session budget (US cents)'});await top(budget,200);
  await shot('options',[['options-budget',budget.locator('xpath=following-sibling::p[1]')],['options-previews',page.locator('label').filter({hasText:'Text previews for this connection'})],['options-deadline',page.locator('label').filter({hasText:'Local deadline (seconds)'}).locator('xpath=following-sibling::p[1]')]]);
  evidence.outcome_normal=await run('scripted','normal');
  await top(page.getByRole('heading',{name:'Requested options',exact:true,level:4}),130);
  await shot('normal-config',[['normal-requested',page.locator('pre[aria-label="Requested options"]')],['normal-effective',page.locator('pre[aria-label="Effective configuration"]')]]);
  await top(h('3. Lifecycle and span events'),130);
  await shot('normal-outcome',[['normal-lifecycle',h('3. Lifecycle and span events').locator('xpath=following-sibling::ol[1]')],['normal-result',outcome.locator('p').first()]]);
  await page.locator('label').filter({hasText:'Text previews for this connection'}).locator('input').uncheck();
  evidence.outcome_previews_off=await run('scripted','normal');
  await top(h('Experiment table'),130);
  await shot('table-previews',[['table-row1',rows.nth(0)],['table-row2',rows.nth(1)]]);
  for(const [name,check] of [['budget-reached','budget_reached'],['deadline','deadline']]){
   const text=await run('scripted',name);evidence['outcome_'+name]=text;if(!text.toLowerCase().includes(check.split('_')[0]))throw Error(name+' unexpected: '+text);
   await top(h('4. Turn outcome'),330);
   await shot(name,[[name+'-outcome',outcome.locator('p').first()],[name+'-detail',outcome.locator('p').nth(2)]]);
  }
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=2',{waitUntil:'networkidle'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,5,6]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-2');
  await k.getByLabel('The host stopped waiting locally.').check();await k.getByRole('button',{name:'Check answer',exact:true}).click();
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else if(mode==='live-deadline'){
  await tab('Run the exercise').click();await page.getByText('Live setup is ready.',{exact:true}).waitFor({timeout:20000});
  const deadline=page.locator('label').filter({hasText:'Local deadline (seconds)'}).locator('input');
  evidence.defaultDeadline=await deadline.inputValue();await deadline.fill('60');
  await top(deadline,300);
  await shot('live3-deadline',[['deadline-input',deadline],['deadline-note',page.locator('label').filter({hasText:'Local deadline (seconds)'}).locator('xpath=following-sibling::p[1]')]]);
  const t3=Date.now();evidence.liveOutcome3=await run('live');evidence.liveSeconds3=Math.round((Date.now()-t3)/1000);
  evidence.liveAnswer3=await h('2. Agent text').locator('xpath=following-sibling::div[1]').innerText().catch(()=>null);
  await top(h('2. Agent text'),130);
  await shot('live3-answer',[['live3-answer-text',h('2. Agent text').locator('xpath=following-sibling::div[1]')]]);
  await top(h('4. Turn outcome'),330);
  await shot('live3-outcome',[['live3-result',outcome.locator('p').first()],['live3-cleanup',outcome.locator('p').nth(2)]]);
 }else{
  await tab('Run the exercise').click();
  const ready=page.getByText('Live setup is ready.',{exact:true});await ready.waitFor({timeout:20000});await top(page.getByRole('button',{name:'Run live',exact:true}),390);
  await shot('live-ready',[['live-ready-text',ready],['live-run',page.getByRole('button',{name:'Run live',exact:true})]]);
  const t1=Date.now();evidence.liveOutcome1=await run('live');evidence.liveSeconds1=Math.round((Date.now()-t1)/1000);
  evidence.liveMode=await page.locator('p').filter({hasText:/^Mode:/}).first().innerText();if(!evidence.liveMode.includes('Live Managed Agents'))throw Error('Not live: '+evidence.liveMode);
  evidence.liveAnswer1=await page.locator('h3').filter({hasText:'2. Agent text'}).locator('xpath=following-sibling::div[1]').innerText().catch(()=>null);
  await top(page.getByRole('heading',{name:'Effective configuration from session creation',exact:true,level:4}),130);
  await shot('live-effective',[['live-effective-json',page.locator('pre[aria-label="Effective configuration"]')],['live-effective-line',page.locator('p').filter({hasText:/^Effective budget:/}).first()]]);
  await top(h('2. Agent text'),130);
  await shot('live-answer',[['live-answer-text',h('2. Agent text').locator('xpath=following-sibling::div[1]')]]);
  await top(h('Reported token usage'),130);
  await shot('live-usage',[['live-usage-json',h('Reported token usage').locator('xpath=following-sibling::pre[1]')],['live-usage-note',h('Reported token usage').locator('xpath=following-sibling::p[1]')]]);
  await page.getByLabel('System prompt',{exact:true}).selectOption('override');
  await page.locator('label').filter({hasText:'Override text'}).locator('textarea').fill('Answer in exactly one short sentence.');
  await top(page.getByLabel('System prompt',{exact:true}),200);
  await shot('live-override',[['override-choice',page.getByLabel('System prompt',{exact:true})],['override-text',page.locator('label').filter({hasText:'Override text'}).locator('textarea')]]);
  const t2=Date.now();evidence.liveOutcome2=await run('live');evidence.liveSeconds2=Math.round((Date.now()-t2)/1000);
  evidence.liveAnswer2=await h('2. Agent text').locator('xpath=following-sibling::div[1]').innerText().catch(()=>null);
  await top(h('2. Agent text'),130);
  await shot('live2-answer',[['live2-answer-text',h('2. Agent text').locator('xpath=following-sibling::div[1]')]]);
  await top(h('Experiment table'),130);
  await shot('live-table',[['live-table-row1',rows.nth(0)],['live-table-row2',rows.nth(1)]]);
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
