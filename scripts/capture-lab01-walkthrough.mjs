// Capture Lab 01 from the running platform for the Lab 01 step-by-step video.
// Usage: node scripts/capture-lab01-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" performs exactly one billed Run live (requires MANAGED_LIVE_ENABLED=true).
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live'].includes(mode))throw Error('Usage: offline|live');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab01-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c1/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,scenario:b.scenario??null,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const outcome=page.getByRole('group',{name:'Turn outcome',exact:true});
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|evt|msg)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode==='live')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});const [x,y,w,h]=box.rect;if(w<4||h<4||x<0||y<minY||x+w>1920||y+h>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 async function runOffline(name){
  await page.getByLabel('Offline scenario',{exact:true}).selectOption(name);
  await page.getByRole('button',{name:'Run offline fixture',exact:true}).click();
  await outcome.waitFor({timeout:30000});await page.waitForFunction(()=>!document.querySelector('[aria-label="Turn outcome"]')?.closest('section')?.querySelector('button:disabled'),null,{timeout:30000}).catch(()=>{});
  await page.waitForTimeout(800);const text=await outcome.innerText();evidence['outcome_'+name]=text;return text;
 }
 await page.goto(origin+'/?lesson=1',{waitUntil:'networkidle'});
 if(mode==='offline'){
  const title=page.getByRole('heading',{name:'Session event streaming',exact:true,level:1});await top(title,150);
  await shot('lesson',[['lesson-title',title],['lesson-objective',title.locator('xpath=following-sibling::p[1]')]]);
  const objective=page.locator('main p').filter({hasText:/^Objective:/}).first();await top(page.getByRole('heading',{name:'Your lab path',exact:true}),130);
  await shot('learn',[['learn-objective',objective],['learn-baseline',page.getByRole('heading',{name:'Try a baseline and compare',exact:true})]]);
  for(const [kind,tabName,regions] of [['concepts','Concept map',[1,2,3,4,5,6]],['lab','Lab walkthrough',[1,4,5]]]){
   await tab(tabName).click();const card=page.locator('.lesson-infographic');await card.waitFor();
   for(const n of regions){
    await card.getByRole('group',{name:'Infographic study links'}).getByRole('button').nth(n-1).click();await page.waitForTimeout(900);
    await top(card.locator('.infographic-viewport'),100);await page.waitForTimeout(700);
    await shot(`${kind}-${n}`,[[`${kind}-${n}-region`,card.locator('.infographic-region-highlight')]]);
   }
  }
  await tab('Run the exercise').click();const ex=page.getByRole('heading',{name:'Query a session and read its events',exact:true});await top(ex,130);
  await shot('exercise',[['exercise-prompt',page.getByLabel('Prompt',{exact:true})],['exercise-scenario',page.getByLabel('Offline scenario',{exact:true})],['exercise-run',page.getByRole('button',{name:'Run offline fixture',exact:true})]]);
  if(!(await runOffline('normal')).includes('completed'))throw Error('Normal fixture did not complete');
  await top(page.locator('p').filter({hasText:/^Mode:/}).first(),130);
  await shot('normal-text',[['normal-mode',page.locator('p').filter({hasText:/^Mode:/}).first()],['normal-session',page.getByRole('heading',{name:'1. Session metadata',exact:true}).locator('xpath=following-sibling::ul[1]')],['normal-message',page.locator('.agent-response').getByText('Authoritative agent.message').first()]]);
  await top(page.getByRole('heading',{name:'3. Lifecycle and span events',exact:true}),130);
  await shot('normal-outcome',[['normal-lifecycle',page.getByRole('heading',{name:'3. Lifecycle and span events',exact:true}).locator('xpath=following-sibling::ol[1]')],['normal-result',outcome.locator('p').first()]]);
  const raw=page.locator('summary').filter({hasText:/^Raw events/}).first();await raw.click();await top(raw,130);
  await shot('normal-raw',[['raw-summary',raw],['raw-code',raw.locator('xpath=..').locator('pre, code').first()]]);
  await raw.click();
  for(const [name,check] of [['repeated-events','Duplicates ignored'],['stream-ended','incomplete'],['session-error','error']]){
   const text=await runOffline(name);if(!text.toLowerCase().includes(check.toLowerCase()))throw Error(name+' outcome unexpected: '+text);
   await top(page.getByRole('heading',{name:'4. Turn outcome',exact:true}),name==='repeated-events'?520:330);
   await shot(name,[[name+'-outcome',outcome.locator('p').first()],[name+'-detail',outcome.locator('p').nth(name==='repeated-events'?2:1)]]);
  }
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  evidence.liveSetupText=await setup.innerText();
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=1',{waitUntil:'networkidle'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,5,6]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-1');
  await k.getByLabel('The reported turn outcome and lifecycle evidence.').check();await k.getByRole('button',{name:'Check answer',exact:true}).click();
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  await tab('Run the exercise').click();
  const ready=page.getByText('Live setup is ready.',{exact:true});await ready.waitFor({timeout:20000});await top(page.getByRole('button',{name:'Run live',exact:true}),390);
  await shot('live-ready',[['live-ready-text',ready],['live-prompt',page.getByLabel('Prompt',{exact:true})]]);
  const started=Date.now();await page.getByRole('button',{name:'Run live',exact:true}).click();
  await outcome.waitFor({timeout:180000});await page.waitForTimeout(1500);evidence.liveSeconds=Math.round((Date.now()-started)/1000);
  evidence.liveOutcome=await outcome.innerText();evidence.liveMode=await page.locator('p').filter({hasText:/^Mode:/}).first().innerText();
  if(!evidence.liveMode.includes('Live Managed Agents'))throw Error('Result was not live: '+evidence.liveMode);
  await top(page.locator('p').filter({hasText:/^Mode:/}).first(),130);
  await shot('live-text',[['live-mode',page.locator('p').filter({hasText:/^Mode:/}).first()],['live-session',page.getByRole('heading',{name:'1. Session metadata',exact:true}).locator('xpath=following-sibling::ul[1]')],['live-message',page.locator('.agent-response').getByText('Authoritative agent.message').first()]]);
  await top(page.locator('.agent-response'),110);
  await shot('live-answer',[['live-answer-text',page.locator('.agent-response').locator('xpath=.//*[self::ul or self::ol or self::p][last()]').first()]]);
  await top(page.getByRole('heading',{name:'3. Lifecycle and span events',exact:true}),130);
  await shot('live-outcome',[['live-lifecycle',page.getByRole('heading',{name:'3. Lifecycle and span events',exact:true}).locator('xpath=following-sibling::ol[1]')],['live-result',outcome.locator('p').first()]]);
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
