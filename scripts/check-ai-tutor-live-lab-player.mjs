import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = 'videos/ai-tutor-live-lab';
const timeline = JSON.parse(await readFile(`${root}/timeline.json`, 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(pathToFileURL(path.resolve(root, 'index.html')).href);
  await page.locator('video').evaluate(video => { video.preload = 'auto'; video.load(); });
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1);
  const count = await page.locator('[data-seek]').count();
  if (count !== timeline.slides.length) throw Error('Chapter count mismatch.');
  await page.locator('[data-seek]').first().click();
  await page.waitForFunction(() => { const video = document.querySelector('video'); return !video.paused && video.currentTime > .3; });
  await page.locator('[data-seek]').nth(Math.floor(count / 2)).click();
  await page.waitForFunction(start => Math.abs(document.querySelector('video').currentTime - start) < 3, timeline.slides[Math.floor(count / 2)].start);
  await page.locator('[data-seek]').last().click();
  await page.waitForFunction(start => Math.abs(document.querySelector('video').currentTime - start) < 3, timeline.slides.at(-1).start);
  await page.locator('video').evaluate(video => video.pause());
  await page.setViewportSize({ width: 390, height: 844 });
  const width = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (width.actual > width.viewport + 1) throw Error('Player overflows narrow viewport.');
  await writeFile(`${root}/player-validation.json`, JSON.stringify({ playback: 'passed', chapterSeeking: 'passed', chapters: count, narrowViewport: 'passed' }, null, 2));
  console.log('Player playback, chapter seeking and narrow layout passed.');
} finally { await browser.close(); }
