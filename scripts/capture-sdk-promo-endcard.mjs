import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const p=path.resolve('presentations/agent-sdk-udemy-promo-extended-v2'),out=path.join(p,'.build/video/slides');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});await page.goto(pathToFileURL(path.join(p,'endcard.html')).href);await page.evaluate(()=>document.fonts.ready);
 const rects=await page.locator('[data-cue]').evaluateAll(nodes=>nodes.map(el=>{
  const r=el.getBoundingClientRect();if(r.x<8||r.right>1912||r.bottom>1010||el.scrollWidth>el.clientWidth+1)throw Error('Clipped end-card text: '+el.innerText);
  const card=el.closest('.metric-card');if(card&&r.bottom>card.getBoundingClientRect().bottom-14)throw Error('Clipped metric');
  return {id:el.dataset.cue,text:el.innerText,rect:[r.x,r.y,r.width,r.height]};
 }));
 await page.screenshot({path:path.join(out,'slide-01.png')});await writeFile(path.join(out,'geometry.json'),JSON.stringify([{slide:1,shapes:[],rects}],null,2));console.log('Exported end card; all text fits.');
}finally{await browser.close();}
