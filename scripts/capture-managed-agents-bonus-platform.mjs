import {chromium} from 'playwright';import {mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';
const out=path.resolve('presentations/managed-agents-bonus-course/platform');await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
const evidence={origin:'http://127.0.0.1:5174',viewport:{width:1920,height:1080},browserZoom:1,deviceScaleFactor:1,newRemoteExecution:false,shots:[],errors:[]};
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',forcedColors:'none',colorScheme:'light'});page.on('pageerror',e=>evidence.errors.push(String(e)));
 async function capture(id,locator){
  const el=page.locator(locator).first();await el.waitFor();await el.evaluate(e=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-105)));await page.waitForTimeout(200);
  const labels=await el.locator('h1,h2,h3,p,summary,button,label,[data-code-line]').evaluateAll(nodes=>nodes.slice(0,40).map(n=>{const r=n.getBoundingClientRect();return {text:n.innerText,rect:[r.x,r.y,r.width,r.height]}}));
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots.push({id,selector:locator,url:page.url(),labels});
 }
 await page.goto(evidence.origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('.brand')?.textContent.includes('Managed Agents'));
 const body=await page.locator('body').innerText();if(!body.includes('75'))throw Error('Expected the 75-lab Managed Agents platform');evidence.courseBrand=await page.locator('.brand').innerText();
 await capture('home','.portal-intro');
 await page.goto(evidence.origin+'/?lesson=1',{waitUntil:'networkidle'});await page.locator('.learning-voice-guide').waitFor();
 await capture('lesson','#main');
 await page.getByRole('button',{name:'Start guided tour',exact:true}).click();await capture('guide','.learning-voice-guide');
 const checklist=page.locator('#lesson-checklist-1');await checklist.evaluate(el=>el.open=true);await capture('checklist','#lesson-checklist-1');
 await page.getByRole('button',{name:'Close guide',exact:true}).click();
 await page.getByText('Run the exercise',{exact:true}).first().click();
 const offline=page.getByRole('button',{name:'Run offline fixture',exact:true});await offline.scrollIntoViewIfNeeded();
 const scope=page.locator('section').filter({has:offline}).last();const id=await scope.getAttribute('id');await scope.evaluate(el=>el.dataset.bonusExercise='true');await capture('exercise','[data-bonus-exercise]');
 evidence.exercisePreview='Controls only. No fixture or live-run button pressed.';
 await page.getByText('TypeScript source',{exact:true}).first().click();await capture('source','.code-block:visible');evidence.headings=await page.locator('h1,h2,h3').allTextContents();
 await writeFile(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({brand:evidence.courseBrand,shots:evidence.shots.map(s=>s.id),headings:evidence.headings.slice(0,12)}));
}finally{await browser.close()}
