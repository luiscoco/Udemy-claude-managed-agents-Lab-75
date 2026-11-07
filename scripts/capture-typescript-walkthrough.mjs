// Capture the running learning platform for the TypeScript code narration walkthrough video.
// Requires `npm run dev`. Uses a fresh browser context; no lab request or provider call is made.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-typescript-walkthrough/platform');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const evidence={origin,viewport:{width:1920,height:1080},deviceScaleFactor:1,browserZoom:1,liveExecution:false,shots:[],labRequests:[],actions:[],errors:[]};
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light',forcedColors:'none'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST')evidence.labRequests.push(r.url());});
 const act=a=>evidence.actions.push(a);
 const tour=page.getByRole('region',{name:'Main concept code narration'});
 const quick=page.locator('.code-tour-quick-controls');
 const clock=tour.getByText(/^Section \d+ \/ \d+/).first();
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(400);}
 async function section(n){await quick.locator('strong').filter({hasText:new RegExp(`^Section ${n}:`)}).waitFor({timeout:90000});await page.waitForTimeout(1500);}
 async function shot(id,targets,minY=90){
  await page.waitForTimeout(300);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button,audio')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||el.getAttribute('aria-label')||'').trim(),rect:[r.x,r.y,r.width,r.height]};});const [x,y,w,h]=box.rect;if(w<4||h<4||x<0||y<minY||x+w>1920||y+h>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  const status=await clock.innerText().catch(()=>null);
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots.push({id,url:page.url(),status,cues});await writeFile(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));console.log('Captured '+id+' · '+status);
 }
 await page.goto(origin+'/?lesson=1',{waitUntil:'networkidle'});
 await page.getByRole('tab',{name:'TypeScript source',exact:true}).click();act('Opened the Lab 01 TypeScript source tab');
 const sourceFile=page.getByLabel('Source file',{exact:true});
 evidence.sourceFiles=await sourceFile.locator('option').allInnerTexts();
 await top(page.getByRole('heading',{name:'Read the real source',exact:true}),130);
 await shot('source',[['source-file',sourceFile],['source-only',page.getByText("Only this lab's main TypeScript concept file",{exact:false}).first()]]);
 await top(tour,110);
 await shot('panel',[['panel-intro',tour.getByText('One narrated file for this lab',{exact:false})],['panel-actions',tour.getByRole('button',{name:'Play code tour',exact:true}).locator('..')]]);
 // Listen and follow: Play reveals the reading area and the rectangle follows the media clock.
 await tour.getByRole('button',{name:'Play code tour',exact:true}).click();act('Pressed Play code tour');
 await section(1);await page.waitForTimeout(3000);
 await shot('play',[['play-section',quick.locator('strong')],['play-pause',quick.getByRole('button',{name:'Pause code narration'})]]);
 await section(2);act('Narration continued automatically into section 2');
 await shot('continue',[['continue-section',quick.locator('strong')]]);
 await top(clock,130);
 await shot('explain',[['explain-clock',clock],['explain-text',tour.locator('p').filter({has:page.locator('strong')}).last()]]);
 await tour.locator('select').nth(1).selectOption({index:3});act('Chose section 4 from the explanation selector');
 await page.waitForTimeout(2500);await top(clock,130);
 await shot('select',[['select-menu',tour.locator('select').nth(1)],['select-clock',clock]]);
 // Continue each explanation: Next, Pause and Resume.
 await quick.getByRole('button',{name:'Next code explanation'}).click();act('Pressed Next in the quick controls');
 await section(5);await top(quick,110);
 await shot('next',[['next-section',quick.locator('strong')],['next-button',quick.getByRole('button',{name:'Next code explanation'})]]);
 await quick.getByRole('button',{name:'Pause code narration'}).click();act('Paused the narration');
 await shot('pause',[['pause-resume',quick.getByRole('button',{name:'Resume code narration'})],['pause-previous',quick.getByRole('button',{name:'Previous code explanation'})]]);
 await quick.getByRole('button',{name:'Resume code narration'}).click();act('Resumed the narration from the same point');
 await tour.locator('select').nth(0).selectOption('1.25');act('Changed narration speed to 1.25x');
 await page.waitForTimeout(2500);await top(tour.locator('select').nth(0),130);
 await shot('speed',[['speed-select',tour.locator('select').nth(0)],['speed-audio',tour.locator('audio')]]);
 const follow=tour.getByLabel('Follow the narrated code inside the source panel',{exact:true});
 await follow.uncheck();act('Turned Follow off');await page.locator('.code-tour-viewport').evaluate(e=>e.scrollTop=0);
 await page.waitForTimeout(1500);await top(tour.locator('.guide-checkpoint'),130);
 await shot('follow',[['follow-toggle',tour.locator('.guide-checkpoint')]]);
 await follow.check();await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();act('Turned Follow on and paused');
 const transcript=tour.locator('details').filter({hasText:'Read code tour transcript'});await transcript.evaluate(e=>e.open=true);act('Opened the code tour transcript');
 await top(transcript,110);
 await shot('transcript',[['transcript-summary',transcript.locator('summary')],['transcript-first',transcript.locator('li').first().locator('strong')]]);
 // Reading controls and the full-screen reader.
 await page.getByLabel('Code font size').selectOption('24');await page.getByRole('button',{name:'Wrap code',exact:true}).click();act('Code font 24px with wrapping off');
 await top(page.locator('.code-reader-toolbar'),110);
 await shot('reading',[['reading-font',page.getByLabel('Code font size')],['reading-wrap',page.getByRole('button',{name:'Wrap code',exact:true})]]);
 await page.getByLabel('Code font size').selectOption('20');await page.getByRole('button',{name:'Wrap code',exact:true}).click();
 await page.getByRole('button',{name:'Enter full-screen code',exact:true}).click();act('Entered full-screen code at 20px with wrapping on');
 await quick.getByRole('button',{name:'Resume code narration'}).click();await page.waitForTimeout(4000);act('Resumed narration inside the full-screen reader');
 await shot('fullscreen',[['full-toolbar',page.locator('.code-reader-toolbar')],['full-quick',quick.locator('strong')]],8);
 await page.keyboard.press('Escape');await page.waitForTimeout(500);act('Pressed Escape to exit full screen');
 await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
 // Supporting files are readable without narration.
 const supporting=evidence.sourceFiles.find(t=>!t.includes('narrated main concept'));
 await sourceFile.selectOption({label:supporting});act('Selected supporting file '+supporting);
 await top(page.getByRole('heading',{name:'Read the real source',exact:true}),130);
 await shot('supporting',[['supporting-file',sourceFile],['supporting-note',page.getByText('Supporting files are available for reading',{exact:false}).first()]]);
 // Every lab has one narrated main concept file.
 await page.goto(origin+'/?lesson=75',{waitUntil:'networkidle'});
 await page.getByRole('tab',{name:'TypeScript source',exact:true}).click();
 await tour.getByRole('button',{name:'Play code tour',exact:true}).click();act('Played the Lab 75 code tour');
 await section(1);await page.waitForTimeout(4000);
 await shot('lab75',[['lab75-section',quick.locator('strong')]]);
 await tour.getByRole('button',{name:'Pause code tour',exact:true}).click();
 if(evidence.labRequests.length)throw Error('Unexpected POST requests: '+evidence.labRequests.join(', '));
 await writeFile(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify({shots:evidence.shots.map(s=>s.id),errors:evidence.errors,sourceFiles:evidence.sourceFiles}));
}finally{await browser.close()}
