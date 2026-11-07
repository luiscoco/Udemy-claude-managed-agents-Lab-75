import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const p=path.resolve('presentations/agent-sdk-bonus-course'),out=path.join(p,'.build/video/slides');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.join(p,'bonus.html')).href);await page.evaluate(()=>document.fonts.ready);const geometry=[];
 for(let i=0;i<3;i++){
  await page.evaluate(n=>document.querySelectorAll('.slide').forEach((el,j)=>el.classList.toggle('active',j===n)),i);
  const rects=await page.locator('.active [data-cue]').evaluateAll(nodes=>nodes.map(el=>{
   const r=el.getBoundingClientRect();if(r.x<16||r.right>1904||r.bottom>1000||el.scrollWidth>el.clientWidth+1)throw Error('Clipped text: '+el.innerText);
   return {id:el.dataset.cue,text:el.innerText,rect:[r.x,r.y,r.width,r.height]};
  }));
  await page.screenshot({path:path.join(out,`slide-${String(i+1).padStart(2,'0')}.png`)});geometry.push({slide:i+1,shapes:[],rects});
 }
 await writeFile(path.join(out,'geometry.json'),JSON.stringify(geometry,null,2));console.log('Exported 3 full-HD Bonus Lecture slides; text bounds checked.');
}finally{await browser.close();}
