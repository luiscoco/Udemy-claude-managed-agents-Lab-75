// Capture real pages for the install-and-run walkthrough video.
// Usage: node scripts/capture-install-run-walkthrough.mjs web|app
// "app" requires `npm run dev` from the fresh student clone. No live provider session is started.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const mode=process.argv[2];if(!['web','app'].includes(mode))throw Error('Usage: web|app');
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174',repo='https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75';
const out=path.resolve('presentations/managed-agents-install-run-walkthrough/platform');await mkdir(out,{recursive:true});
const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8').catch(()=>'{"shots":[]}'));evidence.viewport={width:1920,height:1080};evidence.liveExecution=false;evidence.errors??=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light',locale:'en-US'});
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c1/query')&&r.postDataJSON().mode!=='scripted')throw Error('Only offline fixtures are permitted');});
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(500);}
 async function shot(id,targets,minY=8){
  await page.waitForTimeout(400);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,a,img')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});const [x,y,w,h]=box.rect;if(w<4||h<4||x<0||y<minY||x+w>1920||y+h>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots=evidence.shots.filter(s=>s.id!==id);evidence.shots.push({id,url:page.url(),captured:new Date().toISOString(),cues});await writeFile(file,JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 const rejectCookies=async()=>{const b=page.getByRole('button',{name:'Reject all cookies'});if(await b.isVisible().catch(()=>false)){await b.click();await page.waitForTimeout(500);}};
 if(mode==='web'){
  await page.goto(repo,{waitUntil:'networkidle'});
  await shot('gh-repo',[['gh-name',page.getByRole('link',{name:'Udemy-claude-managed-agents-Lab-75',exact:true}).filter({visible:true}).first()],['gh-code',page.getByRole('button',{name:/^Code$/}).first()]]);
  await page.getByRole('button',{name:/^Code$/}).first().click();await page.waitForTimeout(1000);
  await shot('gh-clone',[['gh-https',page.locator('input[aria-label*="HTTPS" i], input[value$=".git"]').first()],['gh-zip',page.getByRole('link',{name:/Download ZIP/}).or(page.getByRole('menuitem',{name:/Download ZIP/})).first()]]);
  await page.keyboard.press('Escape');
  const commands=page.locator('.markdown-body pre').filter({hasText:'npm.cmd ci'}).first();
  await top(commands,420);
  await shot('gh-readme',[['readme-requires',page.locator('.markdown-body p').filter({hasText:'Requires Node 24'}).first()],['readme-commands',commands]]);
  await page.goto('https://platform.claude.com/',{waitUntil:'networkidle'});await rejectCookies();
  await shot('console-signin',[['signin-google',page.getByRole('button',{name:/Continue with Google/})],['signin-email',page.getByRole('button',{name:/Continue with email/})]]);
  await page.goto('https://platform.claude.com/docs/en/managed-agents/quickstart',{waitUntil:'networkidle'});await rejectCookies();
  const prereq=page.locator('h2').filter({hasText:/^Prerequisites/}).filter({visible:true}).first();await top(prereq,160);
  await shot('docs-prereq',[['docs-heading',prereq],['docs-list',prereq.locator('xpath=following::ul[1]')]]);
 }else{
  await page.goto(origin,{waitUntil:'networkidle'});
  await shot('app-home',[['home-banner',page.locator('.portal-intro img').first()],['home-start',page.getByRole('link',{name:/Start with Lab 01/})]],90);
  await page.getByRole('button',{name:'Check backend',exact:true}).click();await page.waitForTimeout(1500);
  const health=page.locator('#health-heading');await top(health,130);
  evidence.backendCheck=await health.locator('xpath=ancestor::section[1]').innerText();
  await shot('app-backend',[['backend-heading',health],['backend-result',health.locator('xpath=ancestor::section[1]').locator('[role=status], output, pre, dl').first()]],90);
  await page.goto(origin+'/?lesson=1',{waitUntil:'networkidle'});
  await page.getByRole('tab',{name:'Run the exercise',exact:true}).click();
  await page.getByRole('button',{name:'Run offline fixture',exact:true}).click();
  const outcome=page.getByRole('group',{name:'Turn outcome',exact:true});await outcome.waitFor({timeout:30000});evidence.offlineOutcome=await outcome.innerText();
  await top(page.getByRole('heading',{name:'4. Turn outcome',exact:true}),130);
  await shot('app-offline',[['offline-outcome',outcome.locator('p').first()]],90);
 }
}finally{await browser.close()}
