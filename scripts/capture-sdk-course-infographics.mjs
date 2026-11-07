import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const name='agent-sdk-course-concepts-and-app-v4',dir=path.resolve('presentations',name),out=path.join(dir,'.build/video/slides');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await page.goto(pathToFileURL(path.join(dir,'infographics.html')).href);await page.evaluate(()=>document.fonts.ready);
let rows=[];
for(let n=1;n<=6;n++){
 await page.evaluate(n=>window.showSlide(n),n);
 const rects=await page.locator('.active .copy').evaluateAll(nodes=>nodes.map(el=>{
  const r=el.getBoundingClientRect(),card=el.closest('.card').getBoundingClientRect();
  if(r.bottom>card.bottom-12||r.right>card.right-12||el.scrollHeight>el.clientHeight+1)throw Error('Clipped infographic content');
  return {id:el.dataset.cue,text:el.innerText,rect:[r.x,r.y,r.width,r.height]};
 }));
 const file=path.join(out,`slide-${String(n).padStart(2,'0')}.png`);await page.screenshot({path:file});
 rows.push({slide:n,shapes:[],rects});
}
await writeFile(path.join(out,'geometry.json'),JSON.stringify(rows,null,2));await browser.close();console.log('Exported six full-HD images; all card copy fits.');
