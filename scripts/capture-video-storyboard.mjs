import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const project = process.argv[process.argv.indexOf('--project') + 1];
if (!/^[a-z0-9][a-z0-9.-]*$/.test(project ?? '')) throw Error('--project is required.');
const base = path.resolve('presentations', project), out = path.join(base, '.build/video/slides');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(base, 'walkthrough.html')).href);
  await page.evaluate(() => document.fonts.ready);
  const count = await page.locator('.slide').count(), geometry = [];
  for (let index = 0; index < count; index++) {
    await page.evaluate(n => document.querySelectorAll('.slide').forEach((el, i) => el.classList.toggle('active', i === n)), index);
    const rects = await page.locator('.active [data-cue]').evaluateAll(nodes => nodes.map(el => {
      const r = el.getBoundingClientRect();
      if (r.x < 8 || r.y < 8 || r.right > 1912 || r.bottom > 1072 || el.scrollWidth > el.clientWidth + 1) throw Error('Clipped text: ' + el.innerText);
      return { id: el.dataset.cue, text: el.dataset.visible || el.innerText, rect: [r.x, r.y, r.width, r.height] };
    }));
    await page.screenshot({ path: path.join(out, `slide-${String(index+1).padStart(2, '0')}.png`) });
    geometry.push({ slide: index+1, shapes: [], rects });
  }
  await writeFile(path.join(out, 'geometry.json'), JSON.stringify(geometry, null, 2));
  console.log(`Exported ${count} full-HD scenes with measured text targets.`);
} finally { await browser.close(); }
