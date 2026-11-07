// Capture Lab 04 from the running platform for the Lab 04 step-by-step video.
// Usage: node scripts/capture-lab04-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" performs exactly two billed runs: run 1 answers like the offline
// baseline (allow, allow, deny, deny); run 2 denies the first write.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live','live2'].includes(mode))throw Error('Usage: offline|live|live2');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab04-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c4/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,scenario:b.scenario??null,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const outcome=page.getByRole('group',{name:'Turn outcome',exact:true});
 const dialog=page.getByRole('dialog');
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|file)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode!=='offline')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul,div')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 // Answers each review dialog in order. hooks[i] runs before answering dialog i (for screenshots).
 async function review(decisions,hooks={},timeout=200000){
  const log=[];const end=Date.now()+timeout;let i=0,last='';
  while(Date.now()<end){
   if(await outcome.isVisible().catch(()=>false)&&!(await dialog.isVisible().catch(()=>false)))break;
   if(await dialog.isVisible().catch(()=>false)){
    const id=await dialog.locator('code').first().innerText().catch(()=>'');
    if(id&&id!==last){
     last=id;const title=await dialog.locator('h3').innerText();const guard=await dialog.locator('p').filter({hasText:'Host guard'}).innerText();
     const decision=decisions[i]??'deny';
     if(decision==='deny'){await dialog.locator('textarea').fill(i===0?'Do not write this file. Leave the outputs folder unchanged.':'Not approved by the reviewer. Leave the file as it is.');}
     if(hooks[i])await hooks[i]();
     await dialog.getByRole('button',{name:decision==='allow'?'Allow':'Deny',exact:true}).click();
     log.push({title,guard,decision});i++;await page.waitForTimeout(600);continue;
    }
   }
   await page.waitForTimeout(300);
  }
  await outcome.waitFor({timeout:60000});await page.waitForTimeout(1200);return log;
 }
 async function start(kind,scenario){
  await page.goto(origin+'/?lesson=4',{waitUntil:'load'});await tab('Run the exercise').click();
  if(kind==='scripted'){await page.getByLabel('Offline scenario',{exact:true}).selectOption(scenario);await page.getByRole('button',{name:'Run offline fixture',exact:true}).click();}
  else{await page.getByText('Live setup is ready.',{exact:true}).waitFor({timeout:30000});await page.locator('label').filter({hasText:'Local deadline (seconds)'}).locator('input').fill('120');await page.locator('label').filter({hasText:'Approval window (seconds)'}).locator('input').fill('60');await page.getByRole('button',{name:'Run live',exact:true}).click();}
 }
 const dialogShot=(id)=>async()=>{await top(dialog,110);await shot(id,[[`${id}-title`,dialog.locator('h3')],[`${id}-guard`,dialog.locator('p').filter({hasText:'Host guard'})],[`${id}-buttons`,dialog.getByRole('button',{name:'Allow',exact:true}).locator('..')]]);};
 async function results(prefix,withFiles=true){
  await top(h('1. Tool calls'),130);
  await shot(`${prefix}-decisions`,[[`${prefix}-asked`,page.locator('p').filter({hasText:/^Asked \(paused for review\)/}).first()],[`${prefix}-log`,page.locator('table[aria-label="Decision log"]')]]);
  await top(h('4. Permission denials and agent text'),130);
  const den=h('4. Permission denials and agent text').locator('xpath=following-sibling::*[1]');
  evidence[`${prefix}_denials`]=await den.innerText();evidence[`${prefix}_text`]=await h('4. Permission denials and agent text').locator('xpath=following-sibling::*[2]').innerText().catch(()=>null);
  await shot(`${prefix}-denials`,[[`${prefix}-denial-list`,den],[`${prefix}-message`,h('4. Permission denials and agent text').locator('xpath=following-sibling::*[2]')]]);
  if(withFiles){const files=page.getByRole('group',{name:'Sandbox files'});const draft=files.locator('div').filter({hasText:/^outputs\/draft\.md/}).first();
   await top(h('5. Files on disk'),130);
   if(await draft.count()){evidence[`${prefix}_draft`]=await draft.innerText();await shot(`${prefix}-files`,[[`${prefix}-draft`,draft]]);}
   else{evidence[`${prefix}_draft`]=null;evidence[`${prefix}_files`]=await files.innerText();await shot(`${prefix}-files`,[[`${prefix}-draft`,files]]);}}
  await top(h('6. Turn outcome'),330);evidence[`${prefix}_outcome`]=await outcome.innerText();
  await shot(`${prefix}-outcome`,[[`${prefix}-result`,outcome.locator('p').first()],[`${prefix}-cleanup`,outcome.locator('p').nth(1)]]);
 }
 if(mode==='offline'){
  await page.goto(origin+'/?lesson=4',{waitUntil:'load'});
  const title=h('Permissions',1);await top(title,150);
  await shot('lesson',[['lesson-title',title],['lesson-objective',title.locator('xpath=following-sibling::p[1]')]]);
  await top(h('Your lab path'),130);
  await shot('learn',[['learn-objective',page.locator('main p').filter({hasText:/^Objective:/}).first()]]);
  for(const [kind,tabName,regions] of [['concepts','Concept map',[1,2,3,6]],['lab','Lab walkthrough',[1,3,4]]]){
   await tab(tabName).click();const card=page.locator('.lesson-infographic');await card.waitFor();
   for(const n of regions){
    await card.getByRole('group',{name:'Infographic study links'}).getByRole('button').nth(n-1).click();await page.waitForTimeout(900);
    await top(card.locator('.infographic-viewport'),100);await page.waitForTimeout(700);
    await shot(`${kind}-${n}`,[[`${kind}-${n}-region`,card.locator('.infographic-region-highlight')]]);
   }
  }
  await tab('Run the exercise').click();const ex=h('Review tool calls before they run');await top(ex,130);
  await shot('mapping',[['mapping-rule',ex.locator('xpath=following-sibling::p[1]')],['mapping-table',h('Agent SDK to Managed Agents').locator('xpath=following-sibling::div[1]')]]);
  const settings=page.locator('fieldset').filter({has:page.locator('legend',{hasText:'Run settings'})});await top(settings,120);
  await shot('settings',[['settings-approval',page.locator('label').filter({hasText:'Approval window (seconds)'})],['settings-deadline',page.locator('label').filter({hasText:'Local deadline (seconds)'})]]);
  await start('scripted','review');
  evidence.review_offline=await review(['allow','allow','deny','deny'],{0:dialogShot('dialog-write'),2:async()=>{await top(dialog,110);await shot('dialog-deny',[['dialog-deny-title',dialog.locator('h3')],['dialog-deny-message',dialog.locator('textarea')],['dialog-deny-button',dialog.getByRole('button',{name:'Deny',exact:true})]]);}});
  await results('offline');
  await top(h('3. Decision tester'),130);
  await page.getByRole('button',{name:'Replay last decision',exact:true}).click();await page.waitForTimeout(800);
  await page.getByRole('button',{name:'Send with a wrong token',exact:true}).click();await page.waitForTimeout(800);
  evidence.tester=await page.locator('ul[aria-label="Decision tester results"]').innerText();
  await shot('tester',[['tester-rule',h('3. Decision tester').locator('xpath=following-sibling::p[1]')],['tester-results',page.locator('ul[aria-label="Decision tester results"]')]]);
  await start('scripted','preallowed-only');await outcome.waitFor({timeout:60000});await page.waitForTimeout(1000);
  await top(h('1. Tool calls'),130);
  await shot('preallowed',[['preallowed-never',page.locator('p').filter({hasText:/^Never asked \(preallowed\)/}).first()],['preallowed-asked',page.locator('p').filter({hasText:/^Asked \(paused for review\)/}).first()]]);
  await page.goto(origin+'/?lesson=4',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=4',{waitUntil:'load'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,6,7]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-4');
  let ok=false;for(const o of await k.locator('input[type=radio]').all()){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error('No Lab 04 option accepted');
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  if(mode==='live'){
   await start('live');
   evidence.review_live1=await review(['allow','allow','deny','deny'],{0:dialogShot('live1-dialog')});
   const m=await page.locator('p').filter({hasText:/^Mode:/}).first().innerText();if(!m.includes('Live Managed Agents'))throw Error('Not live: '+m);
   await results('live1');
  }
  await start('live');
  evidence.review_live2=await review(['deny','deny','deny','deny'],{0:dialogShot('live2-dialog')});
  await results('live2');
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
