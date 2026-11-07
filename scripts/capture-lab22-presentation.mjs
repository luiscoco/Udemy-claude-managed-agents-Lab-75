import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
try {
 await page.goto('http://127.0.0.1:5174/?lesson=22');await page.getByRole('tab',{name:'Run the exercise'}).click();
 async function capture(locator,file,width=1050){await locator.evaluate((el,width)=>{const s=document.createElement('div');s.id='presentation-capture';Object.assign(s.style,{position:'fixed',zIndex:'999999',top:'0',left:'0',width:`${width}px`,padding:'16px',background:'#fffdf7',color:'#18242a'});const copy=el.cloneNode(true);const original=el.querySelectorAll('select,textarea,input');copy.querySelectorAll('select,textarea,input').forEach((node,i)=>{node.value=original[i].value});s.append(copy);document.body.append(s)},width);await page.locator('#presentation-capture').screenshot({path:`presentations/lab22/assets/${file}`});await page.locator('#presentation-capture').evaluate(e=>e.remove())}
 await capture(page.locator('.lab-controls').filter({has:page.getByRole('button',{name:'Run offline context'})}),'controls.png');
 await page.getByRole('button',{name:'Run offline context'}).click();const result=page.getByRole('region',{name:'Context result'});await result.getByText('Selected host reads:',{exact:false}).waitFor({timeout:30000});
 await result.evaluate(el=>{const box=document.createElement('div');box.id='selected-evidence';for(const p of Array.from(el.querySelectorAll('p')).slice(0,3))box.append(p.cloneNode(true));el.append(box)});await capture(page.locator('#selected-evidence'),'nested.png');await page.locator('#selected-evidence').evaluate(el=>el.remove());
 await page.getByRole('combobox',{name:'Context scenario'}).selectOption('handoff');await page.getByRole('button',{name:'Run offline context'}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Context result"]')?.textContent?.includes('summary'));
 await result.evaluate(el=>{const box=document.createElement('div');box.id='handoff-evidence';for(const p of Array.from(el.querySelectorAll('p')).slice(0,3))box.append(p.cloneNode(true));el.append(box)});await capture(page.locator('#handoff-evidence'),'handoff.png');
 await page.getByRole('button',{name:'Reset selected result'}).click();console.log('Captured Lab 22 offline context evidence.');
}finally{await browser.close()}
