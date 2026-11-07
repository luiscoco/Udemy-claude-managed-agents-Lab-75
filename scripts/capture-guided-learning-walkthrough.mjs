// Capture the running learning platform for the guided-learning walkthrough video.
// Requires `npm run dev`. Uses a fresh browser context and offline fixtures only.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
const out=path.resolve('presentations/managed-agents-guided-learning-walkthrough/platform');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const evidence={origin,viewport:{width:1920,height:1080},deviceScaleFactor:1,browserZoom:1,liveExecution:false,shots:[],runs:[],actions:[],errors:[]};
try{
 const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light',forcedColors:'none'});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/c1/query')){const b=r.postDataJSON();if(b.mode!=='scripted')throw Error('Only offline fixtures are permitted');evidence.runs.push(b);}});
 const act=a=>evidence.actions.push(a);
 const tab=t=>page.getByRole('tab',{name:t,exact:true});
 const guide=page.locator('.learning-voice-guide');
 async function top(loc,offset=110){await loc.waitFor({state:'visible'});await loc.evaluate((e,o)=>window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-o)),offset);await page.waitForTimeout(400);}
 async function shot(id,targets,minY=90){
  await page.waitForTimeout(300);const cues=[];
  for(const [name,loc] of targets){await loc.waitFor({state:'visible'});const box=await loc.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=el.matches('textarea,input,select,button')?el.getBoundingClientRect():range.getBoundingClientRect();return {text:(el.innerText||el.value||'').trim(),rect:[r.x,r.y,r.width,r.height]};});const [x,y,w,h]=box.rect;if(w<4||h<4||x<0||y<minY||x+w>1920||y+h>1068)throw Error('Offscreen target '+id+' '+name+' '+JSON.stringify(box));cues.push({id:name,...box});}
  await page.screenshot({path:path.join(out,id+'.png')});evidence.shots.push({id,url:page.url(),cues});await writeFile(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));console.log('Captured '+id);
 }
 // Study: lesson entry points and the Learning Guide.
 await page.goto(origin+'/?lesson=1',{waitUntil:'networkidle'});
 const lessonTitle=page.getByRole('heading',{name:'Session event streaming',exact:true,level:1});
 await top(lessonTitle,150);
 await shot('lesson',[['lesson-actions',page.getByRole('button',{name:'Open Learning Guide',exact:true}).locator('..')],['lesson-promise',page.getByText('Optional voice narration, highlighted steps',{exact:false}).first()]]);
 await page.getByRole('button',{name:'Start guided tour',exact:true}).click();act('Started the guided tour');
 await page.getByRole('button',{name:'Show section',exact:true}).click();act('Pressed Show section');
 await shot('guide',[['guide-step',guide.getByRole('heading',{name:'Understand the goal',exact:true})],['guide-turn',guide.locator('p.guide-your-turn').first()]]);
 await page.getByRole('button',{name:'Close guide',exact:true}).click();
 await page.getByRole('button',{name:'Start narrated tour',exact:true}).click();act('Started the narrated tour');
 await page.waitForTimeout(7000);
 await shot('narrated',[['narrated-clock',guide.getByText(/seconds/).first()],['narrated-controls',guide.getByRole('button',{name:'Replay narration',exact:true})]]);
 await page.getByRole('button',{name:'Pause narration',exact:true}).click().catch(()=>{});
 await page.getByRole('button',{name:'Close guide',exact:true}).click();
 // Study: illustrated tours and narrated source.
 for(const [id,name] of [['map','Concept map'],['walk','Lab walkthrough']]){
  await tab(name).click();const region=page.locator('.lesson-infographic');
  await region.getByRole('button',{name:'Play visual tour',exact:true}).click();act('Played the '+name+' visual tour');
  await page.waitForTimeout(9000);await top(region.locator('.infographic-follow'),130);
  await shot(id,[[id+'-clock',region.locator('.infographic-clock')],[id+'-follow',region.locator('.infographic-follow')]]);
  await region.getByRole('button',{name:'Pause visual tour',exact:true}).click();
 }
 await tab('TypeScript source').click();
 const codeTour=page.getByRole('region',{name:'Main concept code narration'});
 await codeTour.getByRole('button',{name:'Play code tour',exact:true}).click();act('Played the code tour');
 await page.waitForTimeout(10000);const codeClock=codeTour.getByText(/^Section \d+ \/ \d+/).first();await top(codeClock,130);
 await shot('code',[['code-clock',codeClock],['code-toolbar',page.locator('.code-reader-toolbar')]]);
 await codeTour.getByRole('button',{name:'Pause code tour',exact:true}).click();
 await page.getByLabel('Code font size').selectOption('20');await page.getByRole('button',{name:'Wrap code',exact:true}).click();act('Code font 20px with wrapping');
 await page.getByRole('button',{name:'Enter full-screen code',exact:true}).click();act('Entered full-screen code');
 await page.waitForTimeout(600);
 await shot('reader',[['reader-toolbar',page.locator('.code-reader-toolbar')]],8);
 await page.keyboard.press('Escape');await page.getByRole('button',{name:/full-screen/i}).filter({hasText:/Exit/}).click().catch(()=>{});
 // Practice: one offline exercise run and the knowledge check.
 await tab('Run the exercise').click();
 await page.getByRole('button',{name:'Run offline fixture',exact:true}).click();act('Ran the Normal turn offline fixture');
 const outcome=page.getByRole('group',{name:'Turn outcome',exact:true});await outcome.waitFor({timeout:30000});
 evidence.normalOutcome=await outcome.innerText();if(!evidence.normalOutcome.includes('completed'))throw Error('Normal fixture did not complete');
 await top(page.getByRole('heading',{name:'4. Turn outcome',exact:true}),130);
 await shot('practice',[['practice-outcome',outcome.locator('p').first()]]);
 await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();
 const knowledge=page.locator('#knowledge-check-1');
 await knowledge.getByLabel('Any answer text arriving in the stream.').check();await knowledge.getByRole('button',{name:'Check answer',exact:true}).click();act('Lab 01 knowledge check answered incorrectly on purpose');
 await top(knowledge.getByRole('group').first(),130);
 await shot('knowledge',[['knowledge-question',knowledge.locator('legend').first()],['knowledge-feedback',knowledge.getByText('Review this concept',{exact:true})],['knowledge-saved',knowledge.getByText('Answer checked and saved in this browser.',{exact:true})]]);
 // Track: notebook, bookmark and checklist.
 await page.getByRole('link',{name:'Open notebook',exact:true}).click();
 const notebook=page.locator('#lesson-notebook-1');await notebook.evaluate(e=>e.open=true);
 await page.getByLabel('Notes for Lab 01',{exact:true}).fill('Answer text can arrive before the turn ends. Check the turn outcome and lifecycle events before calling it complete.');
 await page.getByRole('button',{name:'Save note',exact:true}).click();await page.getByLabel('Bookmark this lesson for review',{exact:true}).check();act('Saved a Lab 01 note and bookmark');
 await top(notebook,130);
 await shot('notebook',[['notebook-note',page.getByLabel('Notes for Lab 01',{exact:true})],['notebook-saved',page.getByRole('status',{name:'Notebook status'})]]);
 await page.getByRole('link',{name:'Open checklist',exact:true}).click();
 const checklist=page.locator('#lesson-checklist-1');await checklist.evaluate(e=>e.open=true);
 for(const box of await checklist.locator('input[type=checkbox]').all())await box.check();act('Completed the Lab 01 checklist');
 await top(checklist,130);
 await shot('checklist',[['checklist-summary',checklist.locator('summary')]]);
 // Lab 02: a correct knowledge answer and an in-progress checklist.
 await page.goto(origin+'/?lesson=2',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Open knowledge check',exact:true}).click();
 const k2=page.locator('#knowledge-check-2');const correct=await k2.evaluate(e=>e.dataset.correct??null);
 const options=await k2.locator('input[type=radio]').all();let answered=false;
 for(const option of options){await option.check();await k2.getByRole('button',{name:'Check answer',exact:true}).click();await page.waitForTimeout(200);if(!(await k2.getByText('Review this concept',{exact:true}).count())){answered=true;break;}}
 if(!answered)throw Error('No Lab 02 option was accepted');act('Lab 02 knowledge check answered correctly'+(correct?'':' after retries'));
 await top(k2.getByRole('group').first(),130);
 await shot('knowledge-correct',[['correct-question',k2.locator('legend').first()],['correct-feedback',k2.locator('[aria-label="Knowledge check feedback"]')]]);
 const c2=page.locator('#lesson-checklist-2');await c2.evaluate(e=>e.open=true);await c2.locator('input[type=checkbox]').first().check();act('Ticked one Lab 02 checklist item');
 // Track: Home progress, paths, review queue, milestones and backup.
 await page.goto(origin+'/',{waitUntil:'networkidle'});
 const progress=page.locator('#course-progress');await top(progress,110);
 await shot('progress',[['progress-heading',page.locator('#course-progress-heading')],['progress-continue',page.getByRole('link',{name:/^Continue learning/})]]);
 await page.getByRole('button',{name:'Learning paths',exact:true}).click();
 await page.getByRole('button',{name:'Choose: Managed Agents foundations',exact:true}).click();act('Chose the Managed Agents foundations path');
 await top(page.locator('#course-learning-paths'),110);
 await shot('paths',[['paths-heading',page.locator('#learning-paths-heading')],['paths-status',page.getByRole('status',{name:'Learning path status'}).or(page.locator('[aria-label="Learning path status"]')).first()]]);
 await page.getByRole('button',{name:'Review queue',exact:true}).click();
 const review=page.locator('#course-review-queue');await top(review,110);
 await shot('review',[['review-heading',page.locator('#review-queue-heading')],['review-items',review.locator('li').first()]]);
 await page.getByRole('button',{name:'Milestone projects',exact:true}).click();
 const milestones=page.locator('#course-learning-milestones');await top(milestones,110);
 await shot('milestones',[['milestones-heading',page.locator('#milestones-heading')],['milestones-first',milestones.locator('h4,h3').filter({hasText:'Event stream evidence viewer'}).first()]]);
 const backup=page.locator('#course-learning-backup');await backup.evaluate(e=>e.open=true);await top(backup,110);
 await shot('backup',[['backup-summary',backup.locator('summary')]]);
 await writeFile(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify({shots:evidence.shots.map(s=>s.id),runs:evidence.runs.length,errors:evidence.errors}));
}finally{await browser.close()}
