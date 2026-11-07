import { chromium } from 'playwright';
import { mkdir,writeFile,copyFile,readFile,readdir } from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve('presentations/agent-sdk-free-course-promo-v2/tour');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];const evidence={origin:'http://127.0.0.1:3100',mocked:false,viewport:{width:1600,height:800},clips:[]};
async function record(name,action){
 const dir=path.join(out,name);await mkdir(dir,{recursive:true});
 const context=await browser.newContext({viewport:evidence.viewport,recordVideo:{dir,size:evidence.viewport},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const marks=[];const began=Date.now();const mark=(event)=>marks.push({event,seconds:(Date.now()-began)/1000});
 await action(page,mark);
 const file=await page.video().path();await context.close();await copyFile(file,path.join(out,name+'.webm'));
 evidence.clips.push({name,marks,file:name+'.webm'});
}
try {
 if(process.argv.includes('--reuse-live')){
  const previous=JSON.parse(await readFile(path.join(out,'live-evidence.json'),'utf8'));
  if(previous.status!=='Success'||!previous.events?.some(e=>e.type==='tool'&&e.name==='Glob'))throw Error('No successful existing run to reuse');
  for(const filename of ['notes.txt','src/hello.ts','todo.md'])if(!previous.answer.replaceAll('\\','/').includes(filename))throw Error('Missing normalized path '+filename);
  const files=(await readdir(path.join(out,'live-run'))).filter(n=>n.endsWith('.webm'));
  if(files.length!==1)throw Error('Select one existing live recording');
  await copyFile(path.join(out,'live-run',files[0]),path.join(out,'live-run.webm'));
  Object.assign(evidence,{events:previous.events,status:previous.status,answer:previous.answer,turns:previous.turns,cost:previous.cost});
  evidence.clips.push({name:'live-run',file:'live-run.webm',reusedActualRecording:true,normalizedWindowsPaths:true});
 }else await record('live-run',async(page,mark)=>{
  await page.goto(evidence.origin,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  await page.locator('.workspace').scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollTo(0,document.querySelector('.workspace').getBoundingClientRect().top+scrollY-16));
  mark('prompt visible');await page.screenshot({path:path.join(out,'before-run.png')});
  await page.locator('#prompt').fill('');await page.locator('#prompt').pressSequentially('What files are here?',{delay:65});
  await page.waitForTimeout(1200);mark('click run');
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/query')&&r.request().method()==='POST');
  await page.locator('#run').click();
  const response=await responsePromise;const body=await response.text();
  evidence.events=body.trim().split('\n').map(line=>JSON.parse(line));
  await page.waitForFunction(()=>document.querySelector('#status').textContent!=='Running',{timeout:100000});
  evidence.status=await page.locator('#status').innerText();evidence.answer=await page.locator('#answer').innerText();
  evidence.turns=await page.locator('#turns').innerText();evidence.cost=await page.locator('#cost').innerText();
  mark('final result');await page.screenshot({path:path.join(out,'completed-run.png')});
  await page.locator('#events').scrollIntoViewIfNeeded();await page.waitForTimeout(3500);mark('events shown');
  await page.screenshot({path:path.join(out,'tool-events.png')});
  const result=evidence.events.find(e=>e.type==='result');
  if(!result||result.status!=='success'||!evidence.events.some(e=>e.type==='tool'&&e.name==='Glob'))throw Error('Real run did not produce Glob and a successful final result');
  for(const filename of ['notes.txt','src/hello.ts','todo.md'])if(!evidence.answer.replaceAll('\\','/').includes(filename))throw Error('Answer is missing '+filename);
 });
 await record('learning-tour',async(page,mark)=>{
  await page.goto(evidence.origin+'/learn.html',{waitUntil:'networkidle'});mark('learning goals');
  await page.evaluate(()=>window.scrollTo(0,430));await page.waitForTimeout(3200);
  await page.getByRole('link',{name:'How to run',exact:true}).click();await page.waitForLoadState('networkidle');
  await page.locator('.step').first().scrollIntoViewIfNeeded();mark('setup instructions');await page.waitForTimeout(3500);
  await page.screenshot({path:path.join(out,'setup-page.png')});
 });
 await record('workflow-tour',async(page,mark)=>{
  await page.goto(evidence.origin+'/architecture.html',{waitUntil:'networkidle'});
  await page.locator('.diagram').scrollIntoViewIfNeeded();mark('UML workflow');await page.waitForTimeout(4000);
  await page.screenshot({path:path.join(out,'architecture-page.png')});
  await page.getByRole('link',{name:'Code walkthrough',exact:true}).click();await page.waitForLoadState('networkidle');
  await page.locator('.step').first().scrollIntoViewIfNeeded();mark('source walkthrough');await page.waitForTimeout(4000);
  await page.screenshot({path:path.join(out,'source-page.png')});
 });
 evidence.browserErrors=errors;if(errors.length)throw Error('Browser script errors detected');
 await writeFile(path.join(out,'live-evidence.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify({status:evidence.status,turns:evidence.turns,cost:evidence.cost,tool:'Glob',filesVerified:3,clips:evidence.clips.length,mocked:false}));
}catch(error){
 evidence.error=String(error);await writeFile(path.join(out,'live-evidence.json'),JSON.stringify(evidence,null,2));throw error;
}finally{await browser.close();}
