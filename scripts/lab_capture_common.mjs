// Shared Playwright helpers for the Lab NN step-by-step video captures (Lab 11 onward).
// A lab script calls start(lab, mode, endpointPattern), scripts its own exercise, and calls done().
// Shots and cue rectangles land in presentations/managed-agents-labNN-walkthrough/platform/capture-evidence.json.
import {captureBrowser} from './walkthrough-capture-browser.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

export async function start(lab,mode,endpoint,modes=['offline','live']){
 if(!modes.includes(mode))throw Error('Usage: '+modes.join('|'));
 const nn=String(lab).padStart(2,'0');const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
 const out=path.resolve(`presentations/managed-agents-lab${nn}-walkthrough/platform`);await mkdir(out,{recursive:true});
 const file=path.join(out,'capture-evidence.json');
 const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
 const capture=await captureBrowser();const {browser}=capture;
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 const live=mode.startsWith('live');
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()!=='POST'||!endpoint.test(r.url()))return;let b={};try{b=r.postDataJSON()??{}}catch{}
  if(!live&&b.mode==='live')throw Error('Offline phase must not run live');
  evidence.runs.push({phase:mode,mode:b.mode,variant:b.variant,scenario:b.scenario,endpoint:new URL(r.url()).pathname,at:new Date().toISOString()});});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const btn=n=>page.getByRole('button',{name:n,exact:true});
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|sthr|agent|env|file|skill|skver|mcpsrv|vlt|msg)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}
  for(const t of document.querySelectorAll('textarea,input'))if(re.test(t.value)){re.lastIndex=0;t.value=t.value.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul,ol,div,article,header,details,summary')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim().slice(0,600),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 const open=async(t='Run the exercise')=>{await page.goto(`${origin}/?lesson=${lab}`,{waitUntil:'domcontentloaded',timeout:90000});if(t)await tab(t).click();};
 // Lesson header, Learn tab and the infographic regions.
 async function intro(title,concepts=[1,2,3,6],labRegions=[1,2,3,4]){
  await open(null);const t=h(title,1);await top(t,150);
  await shot('lesson',[['lesson-title',t],['lesson-objective',t.locator('xpath=following-sibling::p[1]')]]);
  await top(h('Your lab path'),130);
  await shot('learn',[['learn-objective',page.locator('main p').filter({hasText:/^Objective:/}).first()]]);
  for(const [kind,tabName,regions] of [['concepts','Concept map',concepts],['lab','Lab walkthrough',labRegions]]){
   await tab(tabName).click();const c=page.locator('.lesson-infographic');await c.waitFor();
   for(const n of regions){
    await c.getByRole('group',{name:'Infographic study links'}).getByRole('button').nth(n-1).click();await page.waitForTimeout(900);
    await top(c.locator('.infographic-viewport'),100);await page.waitForTimeout(700);
    await shot(`${kind}-${n}`,[[`${kind}-${n}-region`,c.locator('.infographic-region-highlight')]]);
   }
  }
 }
 async function liveDisabled(){
  await open();const run=btn('Run live').first();await run.click();
  const setup=page.getByRole('region',{name:'Live setup instructions'}).first();await setup.waitFor();await top(run,200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true}).first()],['live-instructions',setup.locator('p').first()]]);
 }
 async function codeTour(sections){
  await open('TypeScript source');
  const narratedMain=page.getByRole('button',{name:'Open narrated main concept',exact:true});
  if(await narratedMain.count())await narratedMain.click();
  const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of sections){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
 }
 async function knowledge(){
  await btn('Open knowledge check').click();const k=page.locator(`#knowledge-check-${lab}`);
  let ok=false;for(const o of await k.locator('input[type=radio]').all()){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error(`No Lab ${lab} option accepted`);
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }
 async function done(){await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));await capture.close();const shutdown=setTimeout(()=>process.exit(process.exitCode??0),1000);shutdown.unref();}
 return {page,browser,evidence,mode,live,origin,tab,h,btn,top,shot,open,intro,liveDisabled,codeTour,knowledge,done,save:()=>writeFile(file,JSON.stringify(evidence,null,2))};
}
