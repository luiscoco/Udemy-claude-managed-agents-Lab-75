// Capture Lab 09 from the running platform for the Lab 09 step-by-step video.
// Usage: node scripts/capture-lab09-walkthrough.mjs offline|live
// "offline" compares the four authored variants. "live" performs exactly two billed fresh sessions
// (Base, then Custom replacement) with the same question.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live'].includes(mode))throw Error('Usage: offline|live');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab09-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c9/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,variant:b.variant,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const articles=page.locator('article[aria-label$=" result"]');
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|file)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode==='live')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul,ol,div,article')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 async function waitResults(n,timeout){await page.waitForFunction(k=>document.querySelectorAll('article[aria-label$=" result"]').length>=k,n,{timeout});await page.waitForTimeout(1200);}
 // One shot per result card: the system override line and the agent answer.
 async function card(prefix,i){
  const a=articles.nth(i);await top(a.locator('h4'),120);
  const override=a.locator('p').filter({hasText:/^System override/});const answer=a.locator('.agent-message').first();
  evidence[`${prefix}_card`]={title:await a.locator('h4').innerText(),override:await override.innerText(),answer:(await answer.innerText().catch(()=>'')).slice(0,1500),usage:await a.locator('p').filter({hasText:/^Usage:/}).innerText().catch(()=>'')};
  await top(override,200);
  await shot(`${prefix}`,[[`${prefix}-override`,override],[`${prefix}-settings`,a.locator('pre').first()]]);
  const usage=a.locator('p').filter({hasText:/^Usage:/});await top(answer,300);
  // Live answers can be long: the answer and the usage line get separate shots when they do not fit together.
  const fits=await usage.evaluate(e=>e.getBoundingClientRect().bottom<1060);
  if(fits)await shot(`${prefix}-answer`,[[`${prefix}-answer-text`,answer],[`${prefix}-usage`,usage]]);
  else{await shot(`${prefix}-answer`,[[`${prefix}-answer-text`,answer]]);await top(usage,500);await shot(`${prefix}-usage`,[[`${prefix}-usage-line`,usage]]);}
 }
 await page.goto(origin+'/?lesson=9',{waitUntil:'load'});
 if(mode==='offline'){
  const title=h('System instructions and explicit context',1);await top(title,150);
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
  await tab('Run the exercise').click();const ex=h('Compose explicit system instructions');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-question',page.getByLabel('Fixed user question',{exact:true})],['exp-variant',page.getByLabel('System variant',{exact:true})]]);
  await top(page.getByLabel('Custom replacement instructions',{exact:true}),200);
  await shot('instructions',[['instr-custom',page.getByLabel('Custom replacement instructions',{exact:true})],['instr-append',page.getByLabel('Appended instructions',{exact:true})]]);
  const ctx=page.locator('summary').filter({hasText:/^Authored project context/});await ctx.click();await top(ctx,130);
  await shot('context',[['context-summary',ctx],['context-text',ctx.locator('xpath=..').locator('pre')]]);await ctx.click();
  await page.getByRole('button',{name:'Compare all offline variants',exact:true}).click();await waitResults(4,120000);
  for(const [i,v] of ['base','custom','append','project'].entries())await card(`offline-${v}`,i);
  await page.goto(origin+'/?lesson=9',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=9',{waitUntil:'load'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,5,6]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-9');
  let ok=false;for(const o of await k.locator('input[type=radio]').all()){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error('No Lab 09 option accepted');
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  await tab('Run the exercise').click();
  for(const [i,variant] of ['base','custom'].entries()){
   await page.getByLabel('System variant',{exact:true}).selectOption(variant);
   if(i===0){await top(page.getByLabel('System variant',{exact:true}),200);await shot('live-ready',[['live-variant',page.getByLabel('System variant',{exact:true})],['live-run',page.getByRole('button',{name:'Run live',exact:true})]]);}
   await page.getByRole('button',{name:'Run live',exact:true}).click();await waitResults(i+1,200000);
   const src=await articles.nth(i).locator('p').first().innerText();if(!/managed-api/.test(src))throw Error('Not live: '+src);
   await card(`live-${variant}`,i);
  }
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
