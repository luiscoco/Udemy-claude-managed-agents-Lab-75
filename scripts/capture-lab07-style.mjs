import { chromium } from 'playwright';
import { captureComponent } from './presentation-browser.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1400,height:1000}}),stage=await browser.newPage();
 await page.route('**/*',async route=>{
  if(!['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname))return route.abort();
  if(/"mode"\s*:\s*"live"/.test(route.request().postData()??''))throw Error('Only offline capture is permitted.');
  await route.continue();
 });
 for(const n of [7,8]){
  await page.goto(`http://127.0.0.1:5174/?lesson=${n}`);
  await page.getByRole('tab',{name:'Run the exercise',exact:true}).click();
  const section=page.locator(`section[aria-labelledby="c${n}-heading"]`);
  if(n===7)await page.locator('#c7-policy').selectOption('deny-write');
  await captureComponent(section.locator('fieldset').first(),`presentations/lab0${n}/assets/style-controls.png`,stage,1080);
  await section.getByRole('button',{name:n===7?'Run offline fixture':'Run offline delegation',exact:true}).click();
  const table=page.getByRole('table',{name:n===7?'Policy audit':'Effect ledger',exact:true});
  await table.waitFor({timeout:30000});
  await captureComponent(table,`presentations/lab0${n}/assets/style-evidence.png`,stage,1080);
  if(n===8)await captureComponent(page.getByRole('table',{name:'Session threads',exact:true}),'presentations/lab08/assets/style-threads.png',stage,1080);
  console.log(`Lab ${n}: complete controls and offline evidence captured.`);
 }
}finally{await browser.close()}
