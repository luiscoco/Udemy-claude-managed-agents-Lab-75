// Capture authored recovery decks with measured highlight rectangles. No provider calls.
import {captureBrowser} from './walkthrough-capture-browser.mjs';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const lab = Number(process.argv[2]);
if (!Number.isInteger(lab) || lab < 46 || lab > 75) throw Error('Usage: node scripts/capture-recovered-walkthrough-slides.mjs 46..75');
const dir = path.resolve(`presentations/managed-agents-lab${lab}-walkthrough`);
const out = path.join(dir, '.build/video/slides');
await mkdir(out, {recursive:true});
const capture = await captureBrowser();
const {browser} = capture;
try {
  const page = await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await page.goto(pathToFileURL(path.join(dir, `lab${lab}-walkthrough.html`)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(im => im.decode())));
  const geometry = [];
  const count = await page.locator('.slide').count();
  for (let i = 0; i < count; i++) {
    await page.evaluate(n => document.querySelectorAll('.slide').forEach((el,j) => el.classList.toggle('active',j===n)),i);
    const rects = await page.locator('.active [data-cue]').evaluateAll(nodes => nodes.map(el => {
      const r = el.getBoundingClientRect();
      if (r.width<1 || r.height<1 || r.x<8 || r.y<8 || r.right>1912 || r.bottom>1072 || el.scrollWidth>el.clientWidth+1)
        throw Error(`Clipped or empty target ${el.dataset.cue}: ${JSON.stringify([r.x,r.y,r.width,r.height])}`);
      return {id:el.dataset.cue,text:el.dataset.visible??el.innerText,rect:[r.x,r.y,r.width,r.height]};
    }));
    await page.screenshot({path:path.join(out,`slide-${String(i+1).padStart(2,'0')}.png`)});
    geometry.push({slide:i+1,shapes:[],rects});
  }
  await writeFile(path.join(out,'geometry.json'),JSON.stringify(geometry,null,2));
  console.log(`Captured ${count} full-HD Lab ${lab} scenes.`);
} finally { await capture.close(); }
// The Playwright driver can retain a Windows pipe after its owned browser exits.
// All captures and geometry have been awaited before closing the process.
process.exit(0);
