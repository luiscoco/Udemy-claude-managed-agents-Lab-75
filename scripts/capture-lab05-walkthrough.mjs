// Capture Lab 05 from the running platform for the Lab 05 step-by-step video.
// Usage: node scripts/capture-lab05-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" performs exactly two billed runs with the Lab 05 custom-tools agent.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live'].includes(mode))throw Error('Usage: offline|live');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab05-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const livePrompt2='Use the task tools. List the tasks, then complete every open task, and finish with a one-line summary of what changed.';
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c5/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,scenario:b.scenario??null,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const outcome=page.getByRole('group',{name:'Turn outcome',exact:true});
 const calls=page.locator('table[aria-label="Custom tool calls"]');const state=page.getByRole('group',{name:'Task state',exact:true});
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|file)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode==='live')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul,div')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 async function run(kind,scenario,prompt){
  await page.goto(origin+'/?lesson=5',{waitUntil:'load'});await tab('Run the exercise').click();
  if(prompt)await page.getByLabel('Prompt',{exact:true}).fill(prompt);
  if(kind==='scripted'){await page.getByLabel('Offline scenario',{exact:true}).selectOption(scenario);await page.getByRole('button',{name:'Run offline fixture',exact:true}).click();}
  else{await page.getByText('Live setup is ready.',{exact:true}).waitFor({timeout:30000});await page.locator('label').filter({hasText:'Local deadline (seconds)'}).locator('input').fill('120');await page.getByRole('button',{name:'Run live',exact:true}).click();}
  await outcome.waitFor({timeout:kind==='live'?200000:60000});await page.waitForTimeout(1500);
  return {outcome:await outcome.innerText(),calls:(await calls.innerText().catch(()=>'')).slice(0,3000),state:await state.innerText().catch(()=>''),text:await h('3. Agent text').locator('xpath=following-sibling::*[1]').innerText().catch(()=>'')};
 }
 async function results(prefix,withText=true){
  await top(h('1. Custom tool calls'),130);await shot(`${prefix}-calls`,[[`${prefix}-table`,calls]]);
  await top(h('2. Task state'),130);
  await shot(`${prefix}-state`,[[`${prefix}-before`,state.locator('ul').first()],[`${prefix}-after`,state.locator('ul').nth(1)],[`${prefix}-handlers`,state.locator('p').filter({hasText:/^Handler calls/})]]);
  if(withText){await top(h('3. Agent text'),130);await shot(`${prefix}-text`,[[`${prefix}-message`,h('3. Agent text').locator('xpath=following-sibling::*[1]')],[`${prefix}-outcome`,outcome.locator('p').first()]]);}
 }
 if(mode==='offline'){
  await page.goto(origin+'/?lesson=5',{waitUntil:'load'});
  const title=h('Custom tools',1);await top(title,150);
  await shot('lesson',[['lesson-title',title],['lesson-objective',title.locator('xpath=following-sibling::p[1]')]]);
  await top(h('Your lab path'),130);
  await shot('learn',[['learn-objective',page.locator('main p').filter({hasText:/^Objective:/}).first()]]);
  for(const [kind,tabName,regions] of [['concepts','Concept map',[1,2,3,6]],['lab','Lab walkthrough',[1,2,4]]]){
   await tab(tabName).click();const card=page.locator('.lesson-infographic');await card.waitFor();
   for(const n of regions){
    await card.getByRole('group',{name:'Infographic study links'}).getByRole('button').nth(n-1).click();await page.waitForTimeout(900);
    await top(card.locator('.infographic-viewport'),100);await page.waitForTimeout(700);
    await shot(`${kind}-${n}`,[[`${kind}-${n}-region`,card.locator('.infographic-region-highlight')]]);
   }
  }
  await tab('Run the exercise').click();const ex=h('Custom tools answered by the host');await top(ex,130);
  await shot('mapping',[['mapping-rule',ex.locator('xpath=following-sibling::p[1]')],['mapping-table',h('Agent SDK to Managed Agents').locator('xpath=following-sibling::div[1]')]]);
  const defs=page.locator('summary').filter({hasText:/^Custom tool definitions on the agent/});await defs.click();await top(defs,130);
  await shot('definitions',[['definitions-summary',defs],['definitions-json',page.locator('pre[aria-label="Custom tool definitions"]')]]);
  evidence.tour=await run('scripted','tour');await results('tour');
  evidence.slow=await run('scripted','slow-handler');await results('slow',false);
  await page.goto(origin+'/?lesson=5',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=5',{waitUntil:'load'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,5,6]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-5');
  let ok=false;for(const o of await k.locator('input[type=radio]').all()){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error('No Lab 05 option accepted');
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  evidence.live1=await run('live');
  const m=await page.locator('p').filter({hasText:/^Mode:/}).first().innerText();if(!m.includes('Live Managed Agents'))throw Error('Not live: '+m);
  await results('live1');
  evidence.live2=await run('live',null,livePrompt2);await results('live2');
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
