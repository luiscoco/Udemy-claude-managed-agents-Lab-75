import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve('presentations/agent-sdk-short-promo-v4/app');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const evidence={origin:'http://127.0.0.1:3101',viewport:{width:1920,height:1080},browserZoom:1,deviceScaleFactor:1,mocked:false,errors:[],shots:[]};
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1});page.on('pageerror',e=>evidence.errors.push(String(e)));
 await page.goto(evidence.origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>!document.querySelector('#run').disabled);await page.locator('#prompt').fill('What files are here?');
 async function shot(id,selector){
  await page.locator(selector).evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-175));await page.waitForTimeout(150);
  const rect=await page.locator(selector).boundingBox();if(rect.y<150||rect.y+rect.height>1020)throw Error('App subject does not fit at 100%: '+id+' '+JSON.stringify(rect));
  const zoom=await page.evaluate(()=>({zoom:getComputedStyle(document.documentElement).zoom,dpr:devicePixelRatio,scale:visualViewport.scale}));if(zoom.zoom!=='1'||zoom.dpr!==1||zoom.scale!==1)throw Error('Not 100% zoom');
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots.push({id,selector,rect,zoom});
 }
 await shot('prompt','#form');
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/query')&&r.request().method()==='POST',{timeout:120000});await page.locator('#run').click();const response=await responsePromise;const text=await response.text();
 let events;try{events=text.trim().split('\n').map(JSON.parse)}catch{throw Error('Live endpoint HTTP '+response.status())}
 await page.waitForFunction(()=>document.querySelector('#status').textContent!=='Running',{timeout:120000});const result=events.find(e=>e.type==='result');
 if(result?.status!=='success'||!events.some(e=>e.type==='tool'&&e.name==='Glob'))throw Error('Real run failed: '+JSON.stringify(result));
 evidence.liveRun={events,status:await page.locator('#status').innerText(),answer:await page.locator('#answer').innerText(),turns:await page.locator('#turns').innerText(),cost:await page.locator('#cost').innerText()};
 for(const f of ['notes.txt','todo.md','src/hello.ts'])if(!evidence.liveRun.answer.replaceAll('\\','/').includes(f))throw Error('Missing file '+f);
 await shot('result','.stats');
 // Keep the complete final answer visible below the status row.
 const answer=await page.locator('#answer').boundingBox();if(answer.y<150||answer.y+answer.height>1020)throw Error('Final answer clipped at native zoom');
 await shot('events','.workspace details');
 await page.goto(evidence.origin+'/walkthrough.html',{waitUntil:'networkidle'});
 const target=page.locator('.step').filter({hasText:'query('}).first();await target.waitFor();
 // A native-size excerpt shows the actual source without scaling the page.
 const pre=target.locator('pre').first();await pre.evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-180));await page.waitForTimeout(150);await page.screenshot({path:path.join(out,'code.png')});
 evidence.shots.push({id:'code',zoom:{zoom:'1',dpr:1,scale:1},rect:await pre.boundingBox()});
 if(evidence.errors.length)throw Error('Browser errors');await writeFile(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({snapshots:evidence.shots.length,zoom:'100%',liveStatus:evidence.liveRun.status,turns:evidence.liveRun.turns,cost:evidence.liveRun.cost}));
}finally{await browser.close();}
