import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
try {
 await page.goto('http://127.0.0.1:5174/?lesson=20');await page.getByRole('tab',{name:'Run the exercise'}).click();
 async function capture(locator,file,width=1050){await locator.evaluate((el,width)=>{const s=document.createElement('div');s.id='presentation-capture';Object.assign(s.style,{position:'fixed',zIndex:'999999',top:'0',left:'0',width:`${width}px`,padding:'16px',background:'#fffdf7',color:'#18242a'});const copy=el.cloneNode(true);const original=el.querySelectorAll('select,textarea,input');copy.querySelectorAll('select,textarea,input').forEach((node,i)=>{node.value=original[i].value});s.append(copy);document.body.append(s)},width);await page.locator('#presentation-capture').screenshot({path:`presentations/lab20/assets/${file}`});await page.locator('#presentation-capture').evaluate(e=>e.remove())}
 await capture(page.locator('.lab-controls').filter({has:page.getByRole('button',{name:'Run offline lifecycle'})}),'controls.png');
 for(const [scenario,file] of [['interceptor-exception','interceptor.png'],['tool-failure','failure.png']]){
  await page.getByRole('combobox',{name:'Offline lifecycle scenario'}).selectOption(scenario);
  await page.getByRole('button',{name:'Run offline lifecycle'}).click();
  const result=page.getByRole('article',{name:'Lifecycle result'});await result.getByText(`Scenario: ${scenario}`,{exact:false}).waitFor({timeout:30000});
  await result.evaluate(el=>{const box=document.createElement('div');box.id='selected-evidence';box.append(el.querySelector('p').cloneNode(true));const title=Array.from(el.querySelectorAll('h3')).find(h=>h.textContent==='Host audit');box.append(title.cloneNode(true));const list=title.nextElementSibling.cloneNode(true);while(list.children.length>4)list.lastElementChild.remove();box.append(list);el.append(box)});
  await capture(page.locator('#selected-evidence'),file);
  await page.getByRole('button',{name:'Reset this fixture'}).click();await result.waitFor({state:'detached'});
 }
 console.log('Captured Lab 20 offline lifecycle evidence.');
}finally{await browser.close()}
