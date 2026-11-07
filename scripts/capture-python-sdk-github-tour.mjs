import {chromium} from 'playwright';import {mkdir,readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
const dir=path.resolve('presentations/agent-sdk-python-github-tour'),out=path.join(dir,'.build/video/slides');await mkdir(out,{recursive:true});
const story=JSON.parse(await readFile(path.join(dir,'storyboard.json'),'utf8'));const b=await chromium.launch({channel:'msedge',headless:true});
const geometry=[],sources=[];try{
 const cover=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});await cover.goto(pathToFileURL(path.join(dir,'cover.html')).href);await cover.evaluate(()=>document.fonts.ready);await cover.screenshot({path:path.join(out,'slide-01.png')});geometry.push({slide:1,shapes:[],rects:[await cover.locator('#cover-cue').evaluate(el=>{let r=el.getBoundingClientRect();return{id:'cover',text:el.innerText,rect:[r.x,r.y,r.width,r.height]}})]});await cover.close();
 const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1.5});let current='';
 for(let i=1;i<story.length;i++){
  const s=story[i];if(current!==s.url){await p.goto(s.url,{waitUntil:'load'});current=s.url;await p.locator('main').first().waitFor();await p.evaluate(()=>document.fonts.ready);await p.locator('article img').evaluateAll(imgs=>Promise.all(imgs.map(im=>im.decode().catch(()=>{}))));await p.waitForTimeout(500);}
  const targets=[];for(const c of s.segments){let loc=p.locator(c.selector+':visible').filter({hasText:c.match}).first();await loc.waitFor();targets.push({cue:c,loc});}
  if(s.url.includes('/tree/'))await targets[0].loc.scrollIntoViewIfNeeded();
  const bounds=await Promise.all(targets.map(async t=>t.loc.evaluate(el=>{let r=el.getBoundingClientRect();return{y:r.y+scrollY,b:r.bottom+scrollY}})));
  let top=Math.min(...bounds.map(x=>x.y)),bottom=Math.max(...bounds.map(x=>x.b));
  if(!s.url.includes('/tree/')&&s.anchor){const heading=p.locator('article h2:visible,article h3:visible').filter({hasText:s.anchor}).first();if(await heading.count()){const y=await heading.evaluate(el=>el.getBoundingClientRect().y+scrollY);if(y<=top&&bottom-y<=620)top=y;}}
  if(bottom-top>620)throw Error(`Scene ${i+1} too tall: ${bottom-top}`);
  if(i===1)await p.evaluate(()=>scrollTo(0,0));else if(s.url.includes('/tree/'))await targets[0].loc.evaluate(el=>el.scrollIntoView({block:'center'}));else await p.evaluate(y=>scrollTo(0,y),Math.max(0,top-85));
  await p.waitForTimeout(350);const rects=[];
  for(const {cue,loc} of targets){const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();return{text:el.innerText||el.textContent,rect:[r.x*1.5,r.y*1.5,r.width*1.5,r.height*1.5]}});const [x,y,w,h]=box.rect;if(x<8||y<12||x+w>1912||y+h>1065)throw Error(`Clipped scene ${i+1} ${cue.id}: ${box.rect}`);rects.push({id:cue.id,...box});}
  await p.screenshot({path:path.join(out,`slide-${String(i+1).padStart(2,'0')}.png`)});geometry.push({slide:i+1,shapes:[],rects});sources.push({slide:i+1,title:s.title,url:p.url(),capturedAtUtc:new Date().toISOString(),viewport:{width:1280,height:720,deviceScaleFactor:1.5},scrollY:await p.evaluate(()=>scrollY)});console.log(`${i+1}/${story.length} ${s.title}`);
 }
 await writeFile(path.join(out,'geometry.json'),JSON.stringify(geometry,null,2));await writeFile(path.join(dir,'screenshot-provenance.json'),JSON.stringify(sources,null,2));
}finally{await b.close()}
