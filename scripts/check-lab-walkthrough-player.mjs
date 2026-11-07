// Check a published Lab NN video player: MP4 metadata, chapter count and chapter seeking.
// Usage: node scripts/check-lab-walkthrough-player.mjs <lab number>
import {captureBrowser} from './walkthrough-capture-browser.mjs';import {pathToFileURL} from 'node:url';import path from 'node:path';import {writeFile,readFile} from 'node:fs/promises';
const nn=String(Number(process.argv[2])).padStart(2,'0');const dir=path.resolve(`videos/managed-agents-lab${nn}-walkthrough`);
const expected=JSON.parse(await readFile(path.join(dir,'validation.json'),'utf8')),timeline=JSON.parse(await readFile(path.join(dir,'timeline.json'),'utf8'));
const count=timeline.slides.length,target=Math.floor(count*0.6),seekTo=timeline.slides[target].start;
const capture=await captureBrowser();const {browser}=capture;
try{const p=await browser.newPage();await p.goto(pathToFileURL(path.join(dir,'index.html')).href);await p.locator('video').evaluate(v=>{v.preload='auto';v.load()});await p.waitForFunction(()=>document.querySelector('video').readyState>=1);
 const metadata=await p.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,error:v.error?.message||null}));
 if(metadata.width!==1920||metadata.height!==1080||metadata.error||Math.abs(metadata.duration-expected.durationSeconds)>.1)throw Error(JSON.stringify(metadata));
 const chapters=p.locator('ol button');if(await chapters.count()!==count)throw Error(`Expected ${count} chapters`);
 await chapters.nth(target).click();await p.waitForFunction(t=>document.querySelector('video').currentTime>=t-0.5,seekTo);await p.locator('video').evaluate(v=>v.pause());
 await writeFile(path.join(dir,'player-check.json'),JSON.stringify({metadata,chapterLinks:count,chapterSeeking:'passed'},null,2));console.log(`Lab ${nn} MP4 playback and ${count} chapter links passed.`);
}finally{await capture.close();}
process.exit(0);
