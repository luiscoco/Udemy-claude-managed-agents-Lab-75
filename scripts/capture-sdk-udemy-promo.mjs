import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const name='agent-sdk-udemy-promo-88s-v1',dir=path.resolve('presentations',name),out=path.join(dir,'.build/video/slides');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.join(dir,'promo-slides.html')).href);await page.evaluate(()=>document.fonts.ready);
 const rows=[];
 for(let n=1;n<=6;n++){
  await page.evaluate(n=>window.showSlide(n),n);
  const rects=await page.locator('.active [data-cue]').evaluateAll(nodes=>nodes.map(el=>{
   const r=el.getBoundingClientRect();
   if(r.x<8||r.right>1912||r.y<8||r.bottom>1010||el.scrollWidth>el.clientWidth+1)throw Error('Clipped promo text: '+el.innerText);
   const parent=el.closest('.topic,.learner-card,.instructor,.skill');
   if(parent){const p=parent.getBoundingClientRect();if(r.right>p.right-12||r.bottom>p.bottom-12)throw Error('Clipped card copy: '+el.innerText);}
   return {id:el.dataset.cue,text:el.innerText,rect:[r.x,r.y,r.width,r.height]};
  }));
  await page.screenshot({path:path.join(out,`slide-${String(n).padStart(2,'0')}.png`)});
  rows.push({slide:n,shapes:[],rects});
 }
 await writeFile(path.join(out,'geometry.json'),JSON.stringify(rows,null,2));console.log('Exported six promo scenes; all text bounds fit.');
}finally{await browser.close();}
