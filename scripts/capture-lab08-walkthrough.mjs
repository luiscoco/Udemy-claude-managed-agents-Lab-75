// Capture Lab 08 from the running platform for the Lab 08 step-by-step video.
// Usage: node scripts/capture-lab08-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" performs exactly two billed runs with the Lab 08 coordinator.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live'].includes(mode))throw Error('Usage: offline|live');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab08-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const livePrompt2='Ask the calculator to add 40 + 2 and the reviewer to check that the result is correct. Report both answers.';
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c8/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,scenario:b.scenario,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const threads=page.locator('table[aria-label="Session threads"]');const ledger=page.locator('table[aria-label="Effect ledger"]');
 const states=page.locator('p').filter({hasText:/^States:/}).first();
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|file)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode==='live')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul,ol,div')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 async function run(kind,scenario='normal',prompt){
  await page.goto(origin+'/?lesson=8',{waitUntil:'load'});await tab('Run the exercise').click();
  if(prompt)await page.getByLabel('Prompt',{exact:true}).fill(prompt);
  if(kind==='scripted'){await page.getByLabel('Offline scenario',{exact:true}).selectOption(scenario);await page.getByRole('button',{name:'Run offline delegation',exact:true}).click();}
  else{await page.getByText('Live setup and Lab 08 coordinator are configured.',{exact:false}).waitFor({timeout:30000}).catch(()=>{});await page.getByRole('button',{name:'Run live',exact:true}).click();}
  await page.waitForFunction(()=>[...document.querySelectorAll('p')].some(p=>p.textContent.startsWith('States:'))||[...document.querySelectorAll('p[role=status]')].some(p=>/failed|error|required|expired|Cancelled/i.test(p.textContent)),null,{timeout:kind==='live'?200000:60000});
  await page.waitForTimeout(1200);
  return {status:await page.locator('p[role="status"]').last().innerText(),threads:(await threads.innerText().catch(()=>'')).slice(0,3000),ledger:await ledger.innerText().catch(()=>''),states:await states.innerText().catch(()=>'')};
 }
 async function results(prefix){
  await top(h('Thread histories'),130);await shot(`${prefix}-threads`,[[`${prefix}-thread-table`,threads]]);
  await top(h('Capability and effect ledger'),130);await shot(`${prefix}-ledger`,[[`${prefix}-ledger-table`,ledger],[`${prefix}-states`,states]]);
 }
 await page.goto(origin+'/?lesson=8',{waitUntil:'load'});
 if(mode==='offline'){
  const title=h('Delegation and session threads',1);await top(title,150);
  await shot('lesson',[['lesson-title',title],['lesson-objective',title.locator('xpath=following-sibling::p[1]')]]);
  await top(h('Your lab path'),130);
  await shot('learn',[['learn-objective',page.locator('main p').filter({hasText:/^Objective:/}).first()]]);
  for(const [kind,tabName,regions] of [['concepts','Concept map',[1,2,3,6]],['lab','Lab walkthrough',[1,2,3,4]]]){
   await tab(tabName).click();const card=page.locator('.lesson-infographic');await card.waitFor();
   for(const n of regions){
    await card.getByRole('group',{name:'Infographic study links'}).getByRole('button').nth(n-1).click();await page.waitForTimeout(900);
    await top(card.locator('.infographic-viewport'),100);await page.waitForTimeout(700);
    await shot(`${kind}-${n}`,[[`${kind}-${n}-region`,card.locator('.infographic-region-highlight')]]);
   }
  }
  await tab('Run the exercise').click();const ex=h('Delegation with separate session threads');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-prompt',page.getByLabel('Prompt',{exact:true})]]);
  evidence.normal=await run('scripted','normal');await results('normal');
  evidence.wrong_role=await run('scripted','wrong-role');await top(h('Capability and effect ledger'),130);await shot('wrong-role-ledger',[['wrong-role-ledger-table',ledger],['wrong-role-states',states]]);
  evidence.cross=await run('scripted','cross-posted-call');await top(h('Capability and effect ledger'),130);await shot('cross-ledger',[['cross-ledger-table',ledger],['cross-states',states]]);
  await page.goto(origin+'/?lesson=8',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=8',{waitUntil:'load'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,5,6]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-8');
  let ok=false;for(const o of await k.locator('input[type=radio]').all()){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error('No Lab 08 option accepted');
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  evidence.live1=await run('live');if(!evidence.live1.states)throw Error('Live run did not finish: '+evidence.live1.status);
  await results('live1');
  evidence.live2=await run('live','normal',livePrompt2);await results('live2');
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
