import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
try {
 await page.goto('http://127.0.0.1:5174/?lesson=17'); await page.getByRole('tab',{name:'Run the exercise'}).click();
 async function capture(locator,file,width=1050){await locator.evaluate((el,width)=>{const s=document.createElement('div');s.id='presentation-capture';Object.assign(s.style,{position:'fixed',zIndex:'999999',top:'0',left:'0',width:`${width}px`,padding:'16px',background:'#fffdf7',color:'#18242a'});const copy=el.cloneNode(true);const original=el.querySelectorAll('select,textarea,input');copy.querySelectorAll('select,textarea,input').forEach((node,i)=>{node.value=original[i].value});s.append(copy);document.body.append(s)},width);await page.locator('#presentation-capture').screenshot({path:`presentations/lab17/assets/${file}`});await page.locator('#presentation-capture').evaluate(e=>e.remove())}
 await page.getByRole('button',{name:'Start offline fixture session'}).click();
 const snapshot=page.getByRole('button',{name:'Take host snapshot'});await snapshot.waitFor();await snapshot.click();
 await page.getByRole('combobox',{name:'Snapshot'}).locator('option').nth(1).waitFor({state:'attached'});
 await capture(page.getByRole('group',{name:'Bounded host handler and conversation turn'}),'controls.png');
 await page.getByRole('button',{name:'Send turn and run host handler'}).click();
 await page.getByRole('button',{name:'Send turn and run host handler'}).waitFor({state:'visible'});
 await page.getByText('Edited tracked notes.md on the host.').waitFor({timeout:30000});
 await page.getByRole('combobox',{name:'Host action'}).selectOption('create-draft');
 await page.getByRole('button',{name:'Send turn and run host handler'}).click();
 await page.getByText('Created tracked draft.md on the host.').waitFor({timeout:30000});
 await page.getByRole('button',{name:'Dry-run restore'}).click();
 const plan=page.getByRole('article',{name:'Restore plan'});await plan.waitFor();await capture(plan,'plan.png',1100);
 await page.getByRole('button',{name:'Confirm restore'}).click();
 await page.getByText(/Restored tracked host files only/).waitFor({timeout:30000});
 await capture(page.getByRole('article',{name:'notes.md'}),'restored.png',850);
 await page.getByRole('button',{name:'Close session'}).click();
 console.log('Captured Lab 17 offline snapshot and restore evidence.');
}finally{await browser.close()}
