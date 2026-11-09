import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const project = process.argv[process.argv.indexOf('--project') + 1];
if (!/^[a-z0-9][a-z0-9.-]*$/.test(project ?? '')) throw Error('--project is required.');
const root = path.resolve('videos', project);
const timeline = JSON.parse(await readFile(path.join(root, 'timeline.json'), 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.locator('video').evaluate(video => { video.preload = 'auto'; video.load(); });
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1);
  const metadata = await page.locator('video').evaluate(video => ({ width: video.videoWidth, height: video.videoHeight, duration: video.duration, error: video.error?.message ?? null }));
  if (metadata.width !== 1920 || metadata.height !== 1080 || metadata.error || Math.abs(metadata.duration - timeline.duration) > .1) throw Error('Unexpected player metadata.');
  const count = await page.locator('[data-seek]').count();
  if (count !== timeline.slides.length) throw Error('Chapter count mismatch.');
  await page.locator('[data-seek]').first().click();
  await page.waitForFunction(() => { const video = document.querySelector('video'); return !video.paused && video.currentTime > .3; });
  for (const index of [Math.floor(count/2), count-1]) {
    await page.locator('[data-seek]').nth(index).click();
    await page.waitForFunction(start => Math.abs(document.querySelector('video').currentTime - start) < 3, timeline.slides[index].start);
  }
  await page.locator('video').evaluate(video => video.pause());
  await page.setViewportSize({ width: 390, height: 844 });
  const width = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (width.actual > width.viewport+1) throw Error('Player overflows narrow viewport.');
  let application;
  if (process.argv.includes('--application-url')) {
    const origin = process.argv[process.argv.indexOf('--application-url') + 1];
    let httpCredentials;
    const local=['127.0.0.1', 'localhost'].includes(new URL(origin).hostname);
    if(!local){
      if(!process.argv.includes('--azure-recording')||new URL(origin).protocol!=='https:'||!new URL(origin).hostname.endsWith('.azurecontainerapps.io'))throw Error('Only a local or explicitly verified Azure recording deployment may be checked.');
      const state=JSON.parse(await readFile('artifacts/azure-deployment/deployment-status.json','utf8'));
      const access=JSON.parse(await readFile('artifacts/azure-deployment/recording-access.json','utf8'));
      if(state.origin!==origin||access.origin!==origin||state.accessMode!=='password')throw Error('Azure recording credentials do not match this deployment.');
      httpCredentials={username:access.username,password:access.password,origin};
    }
    const livePage = await browser.newPage({ viewport: { width: 1920, height: 1080 },...(httpCredentials?{httpCredentials}:{}) });
    const errors = []; livePage.on('pageerror', error => errors.push(error.message));
    await livePage.goto(origin, { waitUntil: 'networkidle' });
    await livePage.locator('.portal-intro-image').waitFor();
    const response = await livePage.request.get(origin + '/api/health');
    if (!response.ok() || errors.length) throw Error('Final deployed application check failed.');
    await livePage.screenshot({ path: path.join(root, 'final-deployed-application.png') });
    application = { origin, health: await response.json(), browserErrors: errors, screenshot: 'final-deployed-application.png' };
  }
  await writeFile(path.join(root, 'player-validation.json'), JSON.stringify({ metadata, playback: 'passed', chapterSeeking: 'passed', chapters: count, narrowViewport: 'passed', ...(application ? { application } : {}) }, null, 2));
  console.log(`Player playback, ${count} chapter links and narrow layout passed.`);
} finally { await browser.close(); }
