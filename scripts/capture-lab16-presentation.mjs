import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
try {
 await page.goto('http://127.0.0.1:5174/?lesson=16');
 await page.getByRole('tab',{name:'Run the exercise'}).click();
 async function capture(locator,file,width=1050){
  await locator.evaluate((el,width)=>{const s=document.createElement('div');s.id='presentation-capture';Object.assign(s.style,{position:'fixed',zIndex:'999999',top:'0',left:'0',width:`${width}px`,padding:'16px',background:'#fffdf7',color:'#18242a'});const copy=el.cloneNode(true);const originals=el.querySelectorAll('select,textarea,input');copy.querySelectorAll('select,textarea,input').forEach((node,i)=>{node.value=originals[i].value});s.append(copy);document.body.append(s)},width);
  await page.locator('#presentation-capture').screenshot({path:`presentations/lab16/assets/${file}`});
  await page.locator('#presentation-capture').evaluate(e=>e.remove());
 }
 await capture(page.locator('fieldset').filter({hasText:'Application-defined host layers'}),'controls.png');
 await page.getByRole('combobox',{name:'Session region override'}).selectOption('north');
 await page.getByRole('button',{name:'Resolve host settings'}).click();
 const region=page.getByRole('article',{name:'OBSERVATION_REGION'});await region.waitFor();
 await capture(region,'region.png',850);
 await capture(page.getByRole('article',{name:'field-guide.txt'}),'mount.png',850);
 await page.getByRole('button',{name:'Compare three layers'}).click();
 await page.getByRole('heading',{name:'Layer comparison'}).waitFor();
 await capture(page.getByRole('heading',{name:'Layer comparison'}).locator('xpath=following-sibling::ol[1]'),'layers.png',900);
 await page.getByRole('combobox',{name:'Candidate path'}).selectOption('/etc/passwd');
 await page.getByRole('button',{name:'Inspect host path policy'}).click();
 await page.getByLabel('Path policy result').waitFor();
 await capture(page.getByLabel('Path policy result'),'path.png',1050);
 console.log('Captured Lab 16 offline controls and evidence.');
}finally{await browser.close()}
