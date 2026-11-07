// Capture Lab 10 from the running platform for the Lab 10 step-by-step video.
// Usage: node scripts/capture-lab10-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" performs exactly two billed turns in one retained session
// (Start live report, then Send another turn), then closes the idle session.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live'].includes(mode))throw Error('Usage: offline|live');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab10-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const followUp='Return an updated report for Aurora Finch that adds one risk about offline sync conflicts. Return only the JSON object required by the report schema.';
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&/\/api\/c10\/(structured|send)/.test(r.url())){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,scenario:b.scenario,endpoint:r.url().split('/').pop(),at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const runEvidence=page.locator('p[aria-label="Run evidence"]');const turns=page.locator('article.report-turn');
 const btn=n=>page.getByRole('button',{name:n,exact:true});
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|file)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode==='live')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul,ol,div,article,header')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 // Waits until the request finished: no "Disconnect locally" button and the run evidence rendered with n turns.
 async function settle(nTurns,timeout){await page.waitForFunction(k=>!([...document.querySelectorAll('button')].some(b=>b.textContent==='Disconnect locally'))&&document.querySelector('p[aria-label="Run evidence"]')&&document.querySelectorAll('article.report-turn').length>=k,nTurns,{timeout});await page.waitForTimeout(1200);}
 async function startOffline(scenario){await page.goto(origin+'/?lesson=10',{waitUntil:'load'});await tab('Run the exercise').click();await page.getByLabel('Offline scenario',{exact:true}).selectOption(scenario);await btn('Start offline report').click();}
 async function turnShot(id,i){const t=turns.nth(i);await top(t,120);
  const body=t.locator('.validated-report, .report-errors').first();
  evidence[`${id}_turn`]=(await t.innerText()).slice(0,1500);
  await shot(id,[[`${id}-header`,t.locator('header')],[`${id}-body`,body.or(t.locator('p').filter({hasText:'No verified report'})).first()]]);
 }
 if(mode==='offline'){
  await page.goto(origin+'/?lesson=10',{waitUntil:'load'});
  const title=h('Validated reports and interruption',1);await top(title,150);
  await shot('lesson',[['lesson-title',title],['lesson-objective',title.locator('xpath=following-sibling::p[1]')]]);
  await top(h('Your lab path'),130);
  await shot('learn',[['learn-objective',page.locator('main p').filter({hasText:/^Objective:/}).first()]]);
  for(const [kind,tabName,regions] of [['concepts','Concept map',[1,2,3,6]],['lab','Lab walkthrough',[1,2,3,4]]]){
   await tab(tabName).click();const c=page.locator('.lesson-infographic');await c.waitFor();
   for(const n of regions){
    await c.getByRole('group',{name:'Infographic study links'}).getByRole('button').nth(n-1).click();await page.waitForTimeout(900);
    await top(c.locator('.infographic-viewport'),100);await page.waitForTimeout(700);
    await shot(`${kind}-${n}`,[[`${kind}-${n}-region`,c.locator('.infographic-region-highlight')]]);
   }
  }
  await tab('Run the exercise').click();const ex=h('Validate reports and control a retained session');await top(ex,130);
  const schema=page.locator('summary').filter({hasText:'Closed report JSON Schema'});
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-schema',schema],['exp-question',page.getByLabel('User question',{exact:true})]]);
  await schema.click();await top(schema,130);await shot('schema',[['schema-json',page.locator('pre[aria-label="Application report schema"]')]]);
  await page.goto(origin+'/?lesson=10',{waitUntil:'load'});await tab('Run the exercise').click();
  for(const scenario of ['valid','invalid','corrected','exhausted']){
   // One page and one owner: close each retained session before starting the next (the server allows one open run).
   await page.getByLabel('Offline scenario',{exact:true}).selectOption(scenario);await btn('Start offline report').click();
   await settle(1,60000);evidence[`run_${scenario}`]=await runEvidence.innerText();
   await turnShot(scenario,0);
   await btn('Close idle session').click();await page.waitForFunction(()=>/State: closed/.test(document.querySelector('p[aria-label="Run evidence"]')?.textContent??''),null,{timeout:30000});
   if(scenario==='valid'){evidence.close_valid=await runEvidence.innerText();await top(runEvidence,250);await shot('close-valid',[['close-valid-evidence',runEvidence]]);}
  }
  // A fresh page: the previous closed snapshot would keep Interrupt disabled while the hang run is still open.
  await startOffline('hang');await page.waitForFunction(()=>!!document.querySelector('p[aria-label="Run evidence"]')||[...document.querySelectorAll('p[role=status]')].some(p=>/Turn started/.test(p.textContent)),null,{timeout:30000});
  await page.waitForTimeout(1500);await btn('Interrupt and retain session').click();await page.waitForTimeout(2500);
  await settle(0,60000).catch(()=>{});evidence.hang=await runEvidence.innerText();
  await top(btn('Send another turn'),160);await shot('hang-interrupt',[['hang-run-evidence',runEvidence],['hang-buttons',btn('Send another turn').locator('..')]]);
  await page.goto(origin+'/?lesson=10',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=10',{waitUntil:'load'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,5]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-10');
  let ok=false;for(const o of await k.locator('input[type=radio]').all()){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error('No Lab 10 option accepted');
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  await page.goto(origin+'/?lesson=10',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByText('Live base setup is ready. Start a billed text-only session.',{exact:false}).count();
  await top(page.getByLabel('User question',{exact:true}),200);
  await shot('live-ready',[['live-question',page.getByLabel('User question',{exact:true})],['live-run',page.getByRole('button',{name:'Run live',exact:true})]]);
  await page.getByRole('button',{name:'Run live',exact:true}).click();await settle(1,200000);
  evidence.live_run1=await runEvidence.innerText();if(!/managed-api/.test(evidence.live_run1))throw Error('Not live: '+evidence.live_run1);
  await top(runEvidence,250);await shot('live1-evidence',[['live1-run-evidence',runEvidence]]);
  await turnShot('live1',0);
  await page.getByLabel('User question',{exact:true}).fill(followUp);await btn('Send another turn').click();await settle(2,200000);
  evidence.live_run2=await runEvidence.innerText();await turnShot('live2',1);
  await btn('Close idle session').click();await page.waitForTimeout(2500);evidence.live_close=await runEvidence.innerText();
  await top(runEvidence,250);await shot('live-close',[['live-close-evidence',runEvidence]]);
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
