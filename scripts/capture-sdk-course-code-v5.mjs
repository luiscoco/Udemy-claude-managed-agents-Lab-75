import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const name='agent-sdk-course-index-code-and-app-v5',dir=path.resolve('presentations',name),out=path.join(dir,'.build/video/slides');
const data=JSON.parse(await readFile(path.join(dir,'curriculum.json'),'utf8'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await page.goto(pathToFileURL(path.join(dir,'infographics.html')).href);await page.evaluate(()=>document.fonts.ready);
const rows=[];
for(let n=1;n<=data.totalSlides;n++){
 await page.evaluate(n=>window.showSlide(n),n);
 const rects=await page.locator('.active [data-lecture], .active [data-explanation], .active [data-code]').evaluateAll(nodes=>nodes.map(el=>{
  const r=el.getBoundingClientRect(),parent=el.closest('.learn-card,.code-panel,.index-col').getBoundingClientRect();
  if(r.bottom>parent.bottom-12||r.right>parent.right-12||el.scrollWidth>el.clientWidth+1||r.bottom>928)throw Error('Clipped text: '+el.innerText);
  const id=el.dataset.lecture?'lecture-'+el.dataset.lecture:el.dataset.explanation?el.dataset.explanation+'-explanation':el.dataset.code+'-code';
  return {id,text:el.innerText,rect:[r.x,r.y,r.width,r.height]};
 }));
 const footer=n===1?null:await page.locator('.active .takeaway').boundingBox();
 if(footer&&rects.some(r=>r.rect[1]+r.rect[3]>footer.y-14))throw Error('Text overlaps takeaway');
 await page.screenshot({path:path.join(out,`slide-${String(n).padStart(2,'0')}.png`)});
 rows.push({slide:n,shapes:[],rects});
}
await writeFile(path.join(out,'geometry.json'),JSON.stringify(rows,null,2));
console.log('Exported '+rows.length+' full-HD slides. All index entries, explanation cards, and code passages fit.');
} finally {await browser.close();}
