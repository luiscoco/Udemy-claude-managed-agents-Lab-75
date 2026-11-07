// Capture Lab 03 from the running platform for the Lab 03 step-by-step video.
// Usage: node scripts/capture-lab03-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" performs exactly two billed runs (Denied Write, then Permitted edit).
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live'].includes(mode))throw Error('Usage: offline|live');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab03-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c3/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,preset:b.preset,scenario:b.scenario??null,deadlineSeconds:b.deadlineSeconds,budgetCents:b.budgetCents??null,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const outcome=page.getByRole('group',{name:'Turn outcome',exact:true});
 const rows=page.locator('table.options-experiments tbody tr');
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const calls=page.locator('table[aria-label="Tool calls"]');
 const denials=h('3. Permission denials').locator('xpath=following-sibling::*[1]');
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|file)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode==='live')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 async function run(kind,preset){
  await page.getByLabel('Preset',{exact:true}).selectOption(preset);await page.waitForTimeout(300);
  if(kind==='live')await page.locator('label').filter({hasText:'Local deadline (seconds)'}).locator('input').fill('120');
  const before=await rows.count();
  if(kind==='scripted'){await page.getByLabel('Offline scenario',{exact:true}).selectOption('normal');await page.getByRole('button',{name:'Run offline fixture',exact:true}).click();}
  else await page.getByRole('button',{name:'Run live',exact:true}).click();
  await page.waitForFunction(n=>document.querySelectorAll('table.options-experiments tbody tr').length>n,before,{timeout:kind==='live'?200000:60000});
  await page.waitForTimeout(1500);
  const o=await outcome.innerText().catch(()=>''),d=await denials.innerText().catch(()=>''),c=await calls.innerText().catch(()=>'');
  evidence[`${kind}_${preset}`]={outcome:o,denials:d,calls:c.slice(0,3000)};return o;
 }
 await page.goto(origin+'/?lesson=3',{waitUntil:'networkidle'});
 if(mode==='offline'){
  const title=h('Built-in tools',1);await top(title,150);
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
  await tab('Run the exercise').click();const ex=h('Enabled is not permitted');await top(ex,130);
  await shot('mapping',[['mapping-rule',ex.locator('xpath=following-sibling::p[1]')],['mapping-table',h('Agent SDK to Managed Agents').locator('xpath=following-sibling::div[1]')]]);
  await top(page.getByLabel('Preset',{exact:true}),200);
  await shot('experiment',[['exp-preset',page.getByLabel('Preset',{exact:true})],['exp-summary',page.getByLabel('Preset',{exact:true}).locator('xpath=following-sibling::p[1]')],['exp-prompt',page.getByLabel('Prompt',{exact:true})]]);
  const tsum=page.locator('summary').filter({hasText:'Session toolset sent as tools[0]'});await tsum.click();await top(tsum,130);
  await shot('toolset',[['toolset-json',page.locator('pre[aria-label="Session toolset"]')]]);
  await tsum.click();const bashList=page.locator('p').filter({hasText:'Bash is only ever enabled with always_ask'}).last();await top(bashList,300);
  await shot('bashlist',[['toolset-bash',bashList]]);
  for(const preset of ['read-only','unavailable-write','denied-write','permitted-edit']){
   await run('scripted',preset);await top(h('2. Tool calls'),130);
   if(preset==='permitted-edit'){await shot(`${preset}-calls`,[[`${preset}-table`,calls]]);await top(h('3. Permission denials'),130);await shot(`${preset}-denials`,[[`${preset}-denials`,denials]]);}
   else await shot(`${preset}-calls`,[[`${preset}-table`,calls],[`${preset}-denials`,denials]]);
   if(preset==='permitted-edit'){
    await top(h('4. Files on disk (host sandbox)'),130);const draft=page.getByRole('group',{name:'Sandbox files'}).locator('div').filter({hasText:/^outputs\/draft\.md/}).first();
    await shot('permitted-edit-files',[['edit-files-note',h('4. Files on disk (host sandbox)').locator('xpath=following-sibling::p[1]')],['edit-files-draft',draft]]);
   }
  }
  await top(h('Experiment table'),130);
  await shot('offline-table',[['offline-row1',rows.nth(0)],['offline-row2',rows.nth(1)],['offline-row3',rows.nth(2)],['offline-row4',rows.nth(3)]]);
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=3',{waitUntil:'networkidle'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,6,7]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-3');
  const options=await k.locator('input[type=radio]').all();let ok=false;
  for(const o of options){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error('No Lab 03 option accepted');
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  await tab('Run the exercise').click();
  const ready=page.getByText('Live setup is ready.',{exact:true});await ready.waitFor({timeout:20000});
  await page.getByLabel('Preset',{exact:true}).selectOption('denied-write');await page.locator('label').filter({hasText:'Local deadline (seconds)'}).locator('input').fill('120');
  await top(page.locator('label').filter({hasText:'Local deadline (seconds)'}),200);
  await shot('live-ready',[['live-deadline',page.locator('label').filter({hasText:'Local deadline (seconds)'}).locator('input')],['live-budget',page.locator('label').filter({hasText:'Live session budget (US cents)'}).locator('input')]]);
  for(const preset of ['denied-write','permitted-edit']){
   const t0=Date.now();await run('live',preset);evidence[`live_${preset}`].seconds=Math.round((Date.now()-t0)/1000);
   const m=await page.locator('p').filter({hasText:/^Mode:/}).first().innerText();if(!m.includes('Live Managed Agents'))throw Error('Not live: '+m);
   await top(h('1. Session'),130);
   await shot(`live-${preset}-calls`,[[`live-${preset}-effective`,h('1. Session').locator('xpath=following-sibling::ul[1]')],[`live-${preset}-table`,calls]]);
   const outputsLine=page.locator('p').filter({hasText:/^Outputs:/}).first();evidence[`live_${preset}`].outputs=await outputsLine.innerText();
   await top(h('3. Permission denials'),130);
   await shot(`live-${preset}-denials`,[[`live-${preset}-denial-list`,denials]]);
   if(preset==='permitted-edit'){
    await top(h('4. Files on disk (host sandbox)'),130);const draft=page.getByRole('group',{name:'Sandbox files'}).locator('div').filter({hasText:/^outputs\/draft\.md/}).first();
    evidence.live_permitted_edit_draft=await draft.innerText().catch(()=>null);
    await shot('live-permitted-edit-files',[['live-edit-files-note',h('4. Files on disk (host sandbox)').locator('xpath=following-sibling::p[1]')],['live-edit-files-draft',draft]]);
   }
   await top(outputsLine,300);
   await shot(`live-${preset}-outputs`,[[`live-${preset}-outputs-line`,outputsLine]]);
   await top(h('5. Agent text and turn outcome'),130);
   evidence[`live_${preset}`].text=await h('5. Agent text and turn outcome').locator('xpath=following-sibling::*[1]').innerText().catch(()=>null);
   await shot(`live-${preset}-text`,[[`live-${preset}-message`,h('5. Agent text and turn outcome').locator('xpath=following-sibling::*[1]')],[`live-${preset}-outcome`,outcome.locator('p').first()]]);
  }
  await top(h('Experiment table'),130);
  await shot('live-table',[['live-row1',rows.nth(0)],['live-row2',rows.nth(1)]]);
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
