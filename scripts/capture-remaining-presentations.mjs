import { chromium } from 'playwright';
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { captureComponent } from './presentation-browser.mjs';

// Deliberate, local exercise actions only. No live run, upload, provider inspection,
// notification channel, repository publication or remote approval is invoked.
const actions={
23:['Run offline bundle'],24:['Run offline harness'],25:['Run offline replay'],26:['Open offline session'],27:['Open slow offline task'],28:['Run offline fault'],29:['Run offline comparison'],30:['Start offline board'],
31:['Start question'],32:['Start plan'],33:['Start MCP form'],34:['Compare in fresh session'],35:['Start mirror'],36:['Run transport experiment'],37:['Start policy review'],38:['Start conversation'],39:['Create disposable worktree'],40:['Build recovery case'],41:['Start workflow'],42:['Run research fixture'],43:['Grant local consent','List resources'],44:['Run trace fixture'],45:['Run loopback preflight'],46:['Compare usage fixtures'],47:['Run offline coordination'],48:['Run local probe'],49:['Run headless fixture'],
50:['Send to desk'],51:['Run offline host tests'],52:['Run offline eval'],53:['Run trace'],54:['Call scripted tool'],55:['Analyze candidate'],56:['Replay team actions'],57:['Run local worktrees'],58:['Search catalog'],59:['Run routing fixture'],60:['Start offline batch'],61:['Run local MCP client'],62:['Run retrieval fixture'],63:['Create SQLite session','Read order','Propose cancellation'],64:['Inspect product'],65:['Preview proposal'],66:['Start guided run','Send message'],67:['Simulate both sign-ins','Run both tenants'],68:['Create 5-second schedule','Advance scheduling clock 60 seconds','Tick and coalesce'],69:['Start guided review'],70:['Start offline Python'],71:['Create analysis session','Run scripted analyst'],72:['Build document'],73:['Run PR review and fix'],74:['Run offline attack'],75:['Run engineering team']};
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const stage=await browser.newPage();
await page.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(!['127.0.0.1','localhost'].includes(url.hostname)){await route.abort();return;}
 if(route.request().method()==='POST'){
  const body=route.request().postData();
  if(body && /"mode"\s*:\s*"live"/.test(body))throw new Error('Presentation capture forbids live mode.');
 }
 await route.continue();
});
const first=Number(process.argv[2]??23),last=Number(process.argv[3]??75),audit={};
const lessons=process.argv[2]?.includes(',')?process.argv[2].split(',').map(Number):Array.from({length:last-first+1},(_,i)=>first+i);
const auditPath=process.argv[2]?.includes(',')?'presentations/capture-audit-final.json':`presentations/capture-audit-${first}-${last}.json`;
try{
 for(const n of lessons){
  const dir=`presentations/lab${n}/assets`;await mkdir(dir,{recursive:true});
  try{
   await page.goto(`http://127.0.0.1:5174/?lesson=${n}`);await page.getByRole('tab',{name:'Run the exercise'}).click();await page.waitForTimeout(700);
   let root=page.locator(`section[aria-labelledby="lab${n}-heading"]`);
   if(!await root.count())root=page.locator('section[aria-labelledby]').last();
   await root.evaluate(el=>{
    const box=document.createElement('div');box.id='presentation-controls';
    const groups=[...el.querySelectorAll('fieldset,.lab-controls')].filter(e=>!e.parentElement.closest('fieldset,.lab-controls'));
    for(const group of groups.slice(0,3)) box.append(group.cloneNode(true));
    if(!box.children.length){for(const child of [...el.children].slice(0,5))box.append(child.cloneNode(true));}
    el.append(box);
   });
   await captureComponent(page.locator('#presentation-controls'),`${dir}/lesson-controls.png`,stage);
   await page.locator('#presentation-controls').evaluate(e=>e.remove());
   const performed=[];
   for(const name of actions[n]??[]){
    const button=root.getByRole('button',{name,exact:true});
    if(!await button.count())throw new Error(`Missing action: ${name}`);
    await button.click({timeout:15000});performed.push(name);
    await page.waitForTimeout(700);
    // Wait for a finite run to release its action control. Pending human forms
    // remain usable evidence and are deliberately left without an approval.
    if(await button.count()&&await button.isDisabled()){
     await page.waitForFunction(name=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===name);return !b||!b.disabled},name,{timeout:[73,75].includes(n)?180000:n>=57?45000:12000}).catch(()=>{});
    }
   }
   await page.waitForTimeout(n>=57?1800:500);
   const evidence=await root.evaluate(el=>{
    const labels=[...el.querySelectorAll('section[aria-label],article[aria-label],div[aria-label],table[aria-label]')].filter(e=>e.getBoundingClientRect().height>0&&!e.closest('#presentation-controls'));
    const candidates=labels.filter(e=>!labels.some(other=>other!==e&&other.contains(e)));
    const box=document.createElement('div');box.id='presentation-evidence';
    const chosen=candidates.find(e=>/result|evidence|report|snapshot|board|inventory|trace|conversation|ledger|comparison|gate|analysis|run|question|form/i.test(e.getAttribute('aria-label')??''));
    const from=chosen??el;
    // Select complete direct children, preserving tables with their headers.
    let chars=0;
    const children=[...from.children];
    const firstAction=children.findIndex(e=>e.matches('.lab-controls')||e.matches('button'));
    const start=chosen?0:Math.max(0,firstAction+1);
    for(const child of children.slice(start)){
     if(child.matches('.lab-live,details,[role="status"]')||child.querySelector('.lab-live')||!chosen&&child.matches('.lab-controls,fieldset'))continue;
     if(!chosen&&child.matches('label,button,input,select'))continue;
     const text=child.textContent.trim();if(!text)continue;
     if(!chosen&&text.startsWith('Live readiness:'))continue;
     const copy=child.cloneNode(true);
     copy.querySelectorAll('details:not([open])').forEach(e=>e.remove());
     // Representative complete rows; never crop a row or a control.
     copy.querySelectorAll('tbody').forEach(t=>{while(t.children.length>3)t.lastElementChild.remove()});
     copy.querySelectorAll('ul,ol').forEach(t=>{while(t.children.length>3)t.lastElementChild.remove()});
     if(copy.matches('ol,ul'))while(copy.children.length>4)copy.lastElementChild.remove();
     box.append(copy);chars+=copy.textContent.length;
     if(chars>2200||box.children.length>=9)break;
    }
    if(!box.children.length)box.append(from.cloneNode(true));
    if(box.textContent.length<180){const status=el.querySelector('[role="status"]');if(status)box.append(status.cloneNode(true));}
    el.append(box);return {label:chosen?.getAttribute('aria-label')??'exercise evidence',text:box.textContent.trim()};
   });
   await captureComponent(page.locator('#presentation-evidence'),`${dir}/lesson-evidence.png`,stage);
   await page.locator('#presentation-evidence').evaluate(e=>e.remove());
   const sizes=await stage.locator('#capture').boundingBox();
   const pages=await stage.evaluate(()=>{
    const root=document.querySelector('#capture');
    const all=[...root.querySelectorAll('h3,h4,p,pre,table,ul,ol')].filter(e=>e.getBoundingClientRect().height>0);
    const units=all.filter(e=>!all.some(p=>p!==e&&p.contains(e)));
    const container=document.createElement('div');container.id='evidence-pages';root.after(container);
    let group=document.createElement('div');group.style.width='1080px';group.style.padding='12px';group.style.background='#fffdf7';container.append(group);
    for(const original of units){
     const copy=original.cloneNode(true);group.append(copy);
     if(group.getBoundingClientRect().height>495){
      copy.remove();if(group.children.length){group=document.createElement('div');Object.assign(group.style,{width:'1080px',padding:'12px',background:'#fffdf7'});container.append(group)}
      group.append(copy);if(group.getBoundingClientRect().height>495)copy.remove();
     }
    }
    root.remove();[...container.children].filter(e=>!e.children.length).forEach(e=>e.remove());
    return container.children.length;
   });
   for(const file of await readdir(dir))if(/^lesson-evidence-\d+\.png$/.test(file))await unlink(`${dir}/${file}`);
   for(let i=0;i<pages;i++)await stage.locator('#evidence-pages>div').nth(i).screenshot({path:`${dir}/lesson-evidence-${i+1}.png`});
   const detailLabels=await root.evaluate(el=>[...el.querySelectorAll('section[aria-label],article[aria-label],div[aria-label],table[aria-label]')].filter(e=>e.getBoundingClientRect().height>90&&e.getBoundingClientRect().height<470&&e.textContent.trim().length>70&&/result|evidence|ledger/i.test(e.getAttribute('aria-label')??'')).map(e=>e.getAttribute('aria-label')).slice(0,3));
   for(const file of await readdir(dir))if(/^lesson-details-\d+\.png$/.test(file))await unlink(`${dir}/${file}`);
   let detailCount=0;for(const label of detailLabels){const exact=root.locator(`[aria-label="${label.replaceAll('"','\\"')}"]`).first();await captureComponent(exact,`${dir}/lesson-details-${++detailCount}.png`,stage);}
   audit[n]={actions:performed,...evidence,height:sizes.height,pages,status:await root.locator('[role="status"]').allTextContents()};
   console.log(`Lab ${n}: captured controls and ${evidence.label} (${Math.round(sizes.height)}px)`);
  }catch(error){audit[n]={error:String(error)};console.log(`Lab ${n}: ${error}`);}
  await writeFile(auditPath,JSON.stringify(audit,null,2));
 }
}finally{await browser.close()}
