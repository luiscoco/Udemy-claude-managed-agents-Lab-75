import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
try {
 await page.goto('http://127.0.0.1:5174/?lesson=18'); await page.getByRole('tab',{name:'Run the exercise'}).click();
 async function capture(locator,file,width=1050){await locator.evaluate((el,width)=>{const s=document.createElement('div');s.id='presentation-capture';Object.assign(s.style,{position:'fixed',zIndex:'999999',top:'0',left:'0',width:`${width}px`,padding:'16px',background:'#fffdf7',color:'#18242a'});const copy=el.cloneNode(true);const original=el.querySelectorAll('select,textarea,input');copy.querySelectorAll('select,textarea,input').forEach((node,i)=>{node.value=original[i].value});s.append(copy);document.body.append(s)},width);await page.locator('#presentation-capture').screenshot({path:`presentations/lab18/assets/${file}`});await page.locator('#presentation-capture').evaluate(e=>e.remove())}
 await capture(page.locator('.lab-controls').filter({has:page.getByRole('combobox',{name:'Offline policy scenario'})}),'controls.png');
 for(const [scenario,file] of [['allowed-mount','allowed.png'],['outside-mount','denied.png'],['missing-environment','missing.png']]){
  await page.getByRole('combobox',{name:'Offline policy scenario'}).selectOption(scenario);
  await page.getByRole('button',{name:'Run offline host test'}).click();
  await page.getByLabel('Sandbox evidence').getByText(`Scenario: ${scenario}`,{exact:false}).waitFor({timeout:30000});
  const evidence=page.getByLabel('Sandbox evidence');
  await capture(evidence.locator('p').first(),file);
 }
 console.log('Captured Lab 18 offline controls and evidence.');
}finally{await browser.close()}
