// Capture Lab 06 from the running platform for the Lab 06 step-by-step video.
// Usage: node scripts/capture-lab06-walkthrough.mjs offline|live
// "offline" runs authored fixtures only. "live" performs exactly two billed turns in one retained session
// (New with the introduction, then Continue with the follow-up), then closes and archives it.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['offline','live'].includes(mode))throw Error('Usage: offline|live');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-lab06-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.errors??=[];evidence.runs??=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c6/query')){const b=r.postDataJSON();if(mode==='offline'&&b.mode!=='scripted')throw Error('Offline phase must not run live');evidence.runs.push({phase:mode,mode:b.mode,action:b.action,at:new Date().toISOString()});}});
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const h=(name,level)=>page.getByRole('heading',{name,exact:true,...(level?{level}:{})});
 const identity=h('Session identity').locator('xpath=following-sibling::p[1]');
 const history=h('Retained history').locator('xpath=following-sibling::*[1]');
 const outcomeLine=page.locator('p').filter({hasText:/^Outcome:/}).first();
 const evidenceList=h('Stream evidence').locator('xpath=following-sibling::*[1]');
 const btn=n=>page.getByRole('button',{name:n,exact:true});
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function maskIds(){await page.evaluate(()=>{const re=/\b(sesn|agent|env|file)_([A-Za-z0-9]{4})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})\b/g;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(re.test(n.nodeValue)){re.lastIndex=0;n.nodeValue=n.nodeValue.replace(re,'$1_$2••••$3');}});}
 async function shot(id,targets,minY=90){
  if(mode==='live')await maskIds();
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,img,pre,tr,table,fieldset,ul,ol,div')||el.classList.contains('infographic-region-highlight')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});let [x,y,w,hh]=box.rect;if(y+hh>1068&&y<1000){hh=1068-y;box.rect[3]=hh;}if(x+w>1920&&x<1700){w=1910-x;box.rect[2]=w;}if(w<4||hh<4||x<0||y<minY||x+w>1920||y+hh>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,phase:mode,url:page.url(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 // Runs one action and waits until the request finished (buttons enabled again and the outcome line rendered).
 async function act(name,timeout=200000){
  await btn(name).click();await page.waitForTimeout(800);
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Continue'&&!b.disabled)&&[...document.querySelectorAll('p')].some(p=>p.textContent.startsWith('Outcome:')),null,{timeout});
  await page.waitForTimeout(1000);
  return {identity:await identity.innerText(),history:await history.innerText(),outcome:await outcomeLine.innerText()};
 }
 async function captureTurn(prefix){
  await top(h('Session identity'),130);
  await shot(`${prefix}-identity`,[[`${prefix}-ids`,identity],[`${prefix}-history`,history]]);
 }
 const useFollowUp=()=>btn('Use follow-up').click(),useIntro=()=>btn('Use introduction').click();
 await page.goto(origin+'/?lesson=6',{waitUntil:'load'});
 if(mode==='offline'){
  const title=h('Sessions and retained context',1);await top(title,150);
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
  await tab('Run the exercise').click();const ex=h('Retain context in one Managed session');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-prompt',page.getByLabel('Prompt',{exact:true})],['exp-buttons',btn('New offline').locator('..')]]);
  await useIntro();evidence.new=await act('New offline');await captureTurn('new');
  await useFollowUp();evidence.continue=await act('Continue');await captureTurn('continue');
  await top(outcomeLine,500);await shot('continue-outcome',[['continue-outcome-line',outcomeLine]]);
  evidence.reconnect=await act('Reconnect');
  await top(outcomeLine,500);await shot('reconnect',[['reconnect-outcome',outcomeLine]]);
  await top(h('Stream evidence'),130);evidence.reconnectEvidence=await evidenceList.innerText();
  await shot('reconnect-evidence',[['reconnect-evidence-list',evidenceList]]);
  await btn('Inspect server index').click();await page.waitForTimeout(1200);const index=page.locator('p').filter({hasText:/^Server index:/}).first();
  evidence.index=await index.innerText();await top(index,400);
  await shot('inspect',[['inspect-index',index]]);
  await btn('Close and archive').click();await page.waitForTimeout(1500);const status=page.locator('p[role="status"]').filter({hasText:/archived/}).first();
  evidence.close=await status.innerText();await top(status,300);await shot('close',[['close-status',status]]);
  await page.goto(origin+'/?lesson=6',{waitUntil:'load'});await tab('Run the exercise').click();
  await useFollowUp();evidence.fresh=await act('New offline');await captureTurn('fresh');
  await page.goto(origin+'/?lesson=6',{waitUntil:'load'});await tab('Run the exercise').click();
  await page.getByRole('button',{name:'Run live',exact:true}).click();
  const setup=page.getByRole('region',{name:'Live setup instructions'});await setup.waitFor();await top(page.getByRole('button',{name:'Run live',exact:true}),200);
  await shot('live-disabled',[['live-unavailable',page.getByText('Live setup unavailable. Open setup instructions.',{exact:true})],['live-instructions',setup.locator('p').first()]]);
  await page.goto(origin+'/?lesson=6',{waitUntil:'load'});
  await tab('TypeScript source').click();const tour=page.getByRole('region',{name:'Main concept code narration'});const quick=page.locator('.code-tour-quick-controls');
  await tour.getByRole('button',{name:'Play code tour',exact:true}).click();await quick.waitFor({timeout:30000});
  for(const n of [1,3,4,6,7]){
   await tour.locator('select').nth(1).selectOption({index:n-1});await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:30000});await page.waitForTimeout(2500);
   await top(quick,110);await shot(`code-${n}`,[[`code-${n}-section`,quick.locator('strong')]]);
  }
  await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
  await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();const k=page.locator('#knowledge-check-6');
  let ok=false;for(const o of await k.locator('input[type=radio]').all()){await o.check();await k.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k.getByText('Review this concept',{exact:true}).count())){ok=true;break;}}
  if(!ok)throw Error('No Lab 06 option accepted');
  await top(k.locator('legend').first(),150);
  await shot('knowledge',[['knowledge-question',k.locator('legend').first()],['knowledge-feedback',k.locator('[aria-label="Knowledge check feedback"]')]]);
 }else{
  await tab('Run the exercise').click();await useIntro();
  await top(page.getByLabel('Prompt',{exact:true}),200);
  await shot('live-ready',[['live-prompt',page.getByLabel('Prompt',{exact:true})],['live-run',page.getByRole('button',{name:'Run live',exact:true})]]);
  evidence.live1=await act('Run live');await captureTurn('live1');
  await useFollowUp();evidence.live2=await act('Continue');await captureTurn('live2');
  await top(outcomeLine,500);await shot('live2-outcome',[['live2-outcome-line',outcomeLine]]);
  await btn('Close and archive').click();await page.waitForTimeout(2000);const status=page.locator('p[role="status"]').filter({hasText:/archived/}).first();
  evidence.liveClose=await status.innerText();await top(status,300);await shot('live-close',[['live-close-status',status]]);
 }
 await writeFile(file,JSON.stringify(evidence,null,2));console.log(JSON.stringify({phase:mode,shots:evidence.shots.filter(s=>s.phase===mode).map(s=>s.id),runs:evidence.runs.filter(r=>r.phase===mode),errors:evidence.errors}));
}finally{await browser.close()}
