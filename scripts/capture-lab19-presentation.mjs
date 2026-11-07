import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
try {
 await page.goto('http://127.0.0.1:5174/?lesson=19'); await page.getByRole('tab',{name:'Run the exercise'}).click();
 async function capture(locator,file,width=1050){await locator.evaluate((el,width)=>{const s=document.createElement('div');s.id='presentation-capture';Object.assign(s.style,{position:'fixed',zIndex:'999999',top:'0',left:'0',width:`${width}px`,padding:'16px',background:'#fffdf7',color:'#18242a'});const copy=el.cloneNode(true);const original=el.querySelectorAll('select,textarea,input');copy.querySelectorAll('select,textarea,input').forEach((node,i)=>{node.value=original[i].value});s.append(copy);document.body.append(s)},width);await page.locator('#presentation-capture').screenshot({path:`presentations/lab19/assets/${file}`});await page.locator('#presentation-capture').evaluate(e=>e.remove())}
 await capture(page.locator('.lab-controls').filter({has:page.getByRole('button',{name:'Start offline session'})}),'controls.png');
 await page.getByRole('button',{name:'Start offline session'}).click(); await page.getByRole('button',{name:'Send another turn'}).waitFor({state:'visible'});
 await page.getByRole('button',{name:'Send another turn'}).click(); await page.getByRole('button',{name:'Derive conversation'}).waitFor({state:'visible'});
 await page.getByRole('button',{name:'Derive conversation'}).click();
 const handoff=page.getByText('Explicit summary handoff:',{exact:false});await handoff.waitFor({timeout:30000});
 await capture(handoff,'handoff.png');
 await capture(page.getByRole('heading',{name:'Owned conversation inventory'}).locator('xpath=following-sibling::ul[1]'),'inventory.png');
 await page.getByRole('button',{name:'Reset offline fixtures'}).click();
 console.log('Captured Lab 19 offline branch evidence.');
}finally{await browser.close()}
