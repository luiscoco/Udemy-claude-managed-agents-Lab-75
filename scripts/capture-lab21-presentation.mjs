import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
try {
 await page.goto('http://127.0.0.1:5174/?lesson=21');await page.getByRole('tab',{name:'Run the exercise'}).click();
 async function capture(locator,file,width=1050){await locator.evaluate((el,width)=>{const s=document.createElement('div');s.id='presentation-capture';Object.assign(s.style,{position:'fixed',zIndex:'999999',top:'0',left:'0',width:`${width}px`,padding:'16px',background:'#fffdf7',color:'#18242a'});const copy=el.cloneNode(true);const original=el.querySelectorAll('select,textarea,input');copy.querySelectorAll('select,textarea,input').forEach((node,i)=>{node.value=original[i].value});s.append(copy);document.body.append(s)},width);await page.locator('#presentation-capture').screenshot({path:`presentations/lab21/assets/${file}`});await page.locator('#presentation-capture').evaluate(e=>e.remove())}
 await page.getByRole('button',{name:'Prepare offline session'}).click();
 await capture(page.locator('.lab-controls').filter({has:page.getByRole('combobox',{name:'Host command'})}),'controls.png');
 await page.getByRole('button',{name:'Run host command'}).click();const result=page.getByRole('region',{name:'Command result'});await result.getByText('model command result').waitFor({timeout:30000});await capture(result,'model.png');
 await page.getByRole('button',{name:'Inspect local history'}).click();await result.getByText('local command result').waitFor({timeout:30000});await capture(result,'local.png');
 await page.getByRole('button',{name:'Close command session'}).click();console.log('Captured Lab 21 offline commands.');
}finally{await browser.close()}
