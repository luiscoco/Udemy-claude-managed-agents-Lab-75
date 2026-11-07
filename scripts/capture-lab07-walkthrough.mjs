// Capture Lab 07 from the running platform for the Lab 07 step-by-step video.
// Usage: node scripts/capture-lab07-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" performs exactly two billed runs with the Lab 07 agent
// (Deny write, then Rewrite input).
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live'].includes(mode))throw Error('Usage: offline|live');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab07-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
// The default prompt names no file, so a live model may make no call; these name each policy's target explicitly.
const denyPrompt='Use edit_file once to change "locked" to "changed" in /workspace/protected.md, then report whether the change happened.';
const rewritePrompt='Use write_file once to create /workspace/proposed.md containing "Status: rewritten through policy", then report which file was written.';
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c7/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,policy:b.policy,scenario:b.scenario,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const audit=page.locator('table[aria-label="Policy audit"]');const outcomeLine=page.locator('p').filter({hasText:/^Outcome:/}).first();
 const fileBox=page.locator('pre[aria-label="Loaded file evidence"]');
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|file)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode==='live')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul,ol,div')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 async function run(kind,policy,scenario='normal',prompt){
  await page.goto(origin+'/?lesson=7',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByLabel('Host policy',{exact:true}).selectOption(policy);
  if(prompt)await page.getByLabel('Prompt',{exact:true}).fill(prompt);
  if(kind==='scripted'){await page.getByLabel('Offline scenario',{exact:true}).selectOption(scenario);await page.getByRole('button',{name:'Run offline fixture',exact:true}).click();}
  else{await page.getByText('Live base setup is ready; the Lab 07 agent ID is also required.',{exact:false}).count();await page.getByRole('button',{name:'Run live',exact:true}).click();}
  await page.waitForFunction(()=>[...document.querySelectorAll('p')].some(p=>p.textContent.startsWith('Outcome:'))||[...document.querySelectorAll('p[role=status]')].some(p=>/failed|error|required|not ready/i.test(p.textContent)),null,{timeout:kind==='live'?200000:60000});
  await page.waitForTimeout(1200);
  return {status:await page.locator('p[role="status"]').last().innerText(),page:(await page.locator('section[aria-labelledby="c7-heading"]').innerText()).slice(-1500),audit:(await audit.innerText().catch(()=>'')).slice(0,2500),outcome:await outcomeLine.innerText().catch(()=>'')};
 }
 async function evidenceFor(prefix,fileName){
  await top(h('Policy and execution audit'),130);
  if(await audit.count())await shot(`${prefix}-audit`,[[`${prefix}-table`,audit]]);
  else{const empty=h('Policy and execution audit').locator('xpath=following-sibling::*[1]');evidence[`${prefix}_empty`]=await empty.innerText();
   await shot(`${prefix}-audit`,[[`${prefix}-table`,empty]]);}
  if(fileName){await page.getByRole('button',{name:`Load ${fileName}`,exact:true}).click();await fileBox.waitFor();await page.waitForTimeout(500);
   evidence[`${prefix}_file`]=await fileBox.innerText();await top(h('File evidence'),130);
   await shot(`${prefix}-file`,[[`${prefix}-file-box`,fileBox],[`${prefix}-outcome`,outcomeLine]]);}
 }
 await page.goto(origin+'/?lesson=7',{waitUntil:'load'});
 if(mode==='offline'){
  const title=h('Tool policy and execution audit',1);await top(title,150);
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
  await tab('Run the exercise').click();const ex=h('Host policy before execution, audit after execution');await top(ex,130);
  const tools=page.locator('summary').filter({hasText:/^Dedicated custom tools/});
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-tools',tools],['exp-policy',page.getByLabel('Host policy',{exact:true})]]);
  evidence.audit_only=await run('scripted','audit-only');await evidenceFor('audit','draft.md');
  evidence.deny_write=await run('scripted','deny-write');await evidenceFor('deny','protected.md');
  evidence.rewrite=await run('scripted','rewrite-input');await evidenceFor('rewrite','draft.md');
  evidence.exception=await run('scripted','audit-only','handler-exception');await evidenceFor('exception',null);
  await page.goto(origin+'/?lesson=7',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=7',{waitUntil:'load'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,5,6]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-7');
  let ok=false;for(const o of await k.locator('input[type=radio]').all()){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error('No Lab 07 option accepted');
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  evidence.live_deny=await run('live','deny-write','normal',denyPrompt);if(!evidence.live_deny.outcome)throw Error('Live run did not finish: '+evidence.live_deny.status);
  await evidenceFor('live-deny','protected.md');
  evidence.live_rewrite=await run('live','rewrite-input','normal',rewritePrompt);await evidenceFor('live-rewrite','draft.md');
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
