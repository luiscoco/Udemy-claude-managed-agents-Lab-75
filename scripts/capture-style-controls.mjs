import { chromium } from 'playwright';
import { captureComponent } from './presentation-browser.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1400,height:1000}}),stage=await browser.newPage();
 await page.route('**/*',async route=>{
  if(!['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname))return route.abort();
  if(/"mode"\s*:\s*"live"/.test(route.request().postData()??''))throw Error('Offline captures only.');
  await route.continue();
 });
 for(const n of [7,8,29]){
  await page.goto(`http://127.0.0.1:5174/?lesson=${n}`);
  await page.getByRole('tab',{name:'Run the exercise',exact:true}).click();
  if(n===7)await page.locator('#c7-policy').selectOption('deny-write');
  const root=page.locator(`section[aria-labelledby="${n<10?'c':'lab'}${n}-heading"]`);
  const component=root.locator(n===29?'.lab-controls':'fieldset').first();
  const path=`presentations/lab${String(n).padStart(2,'0')}/assets/style-controls.png`;
  await captureComponent(component,path,stage,1080);
  // Reflow only the detached presentation stage; preserve real labels/values.
  await stage.addStyleTag({content:`
   textarea{width:100%!important;min-height:100px!important;resize:none}
   fieldset label{display:block!important;margin-top:10px!important}
   fieldset select{min-width:320px!important;max-width:100%!important}
   .lab-controls{display:flex!important;flex-wrap:wrap!important;align-items:flex-end!important;gap:14px!important}
   .lab-controls>label{flex:1 0 300px!important;display:block!important}
   .lab-controls input,.lab-controls select{width:100%!important}
   button{flex:0 0 auto!important;min-width:200px!important;white-space:nowrap!important;padding:12px!important}
  `});
  await stage.locator('#capture').screenshot({path});
  console.log(`Lab ${n}: complete readable control layout captured.`);
 }
}finally{await browser.close()}
