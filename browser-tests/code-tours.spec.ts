import { test, expect } from '@playwright/test';

for (const width of [320, 1280]) test(`Play reveals a visible timed code rectangle and follows real audio at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?lesson=1');
  await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
  await page.getByRole('button', { name: 'Play code tour', exact: true }).click();
  const media = page.locator('audio[aria-label="TypeScript code narration"]');
  const viewport = page.getByRole('region', { name: 'Narrated TypeScript source', exact: true });
  const rectangle = page.locator('.code-tour-rectangle');
  async function expectVisibleFrame(cue: string) {
    await expect(rectangle).toHaveAttribute('data-code-cue', cue);
    await expect.poll(() => rectangle.evaluate(el => {
      const r = el.getBoundingClientRect(), panel = el.parentElement!.querySelector('.code-tour-viewport')!.getBoundingClientRect();
      const header = document.querySelector('.topbar')!, fixed = ['sticky', 'fixed'].includes(getComputedStyle(header).position);
      return r.width > 50 && r.height > 10 && r.top >= Math.max(fixed ? header.getBoundingClientRect().bottom : 0, panel.top) && r.bottom <= Math.min(innerHeight, panel.bottom) && r.left >= 0 && r.right <= innerWidth;
    })).toBe(true);
  }
  await expectVisibleFrame('code-0');
  await expect(viewport).toBeFocused();
  const startScroll = await viewport.evaluate(el => el.scrollTop);
  const manifest = await page.request.get('/audio/code/manifest.json').then(response => response.json());
  const timing = await page.request.get(`/${manifest.recordings['1'].timingFile}`).then(response => response.json());
  // Cross an actual audio boundary while playing, rather than only dispatching a synthetic event.
  await media.evaluate((el, seconds) => { (el as HTMLAudioElement).currentTime = seconds; }, timing.cues[1].start - .4);
  await expectVisibleFrame('code-1');
  await expect.poll(() => viewport.evaluate(el => el.scrollTop)).toBeGreaterThan(startScroll);
  await media.evaluate((el, seconds) => { (el as HTMLAudioElement).currentTime = seconds; }, timing.cues[2].start - .4);
  await expectVisibleFrame('code-2');
  await page.getByRole('button', { name: 'Pause code narration', exact: true }).click();
  await expectVisibleFrame('code-2');
  if (width === 1280) {
    await page.setViewportSize({ width, height: 390 });
    await expectVisibleFrame('code-2');
    await page.setViewportSize({ width, height: 844 });
    await expectVisibleFrame('code-2');
  }
  await page.screenshot({ path: `artifacts/learning-guide/code-follow-visible-${width}.png` });
  await page.getByRole('button', { name: 'Replay code tour', exact: true }).click();
  await expectVisibleFrame('code-0');
});

test('main concept narration is available without automatically loading audio or running a lab', async ({ page }) => {
  let posts = 0, audio = 0;
  page.on('request', request => { if (request.method() === 'POST') posts++; if (/audio\/code\/.*\.mp3/.test(request.url())) audio++; });
  for (const id of [1, 12, 50, 64, 75]) {
    await page.goto(`/?lesson=${id}`);
    await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Play code tour', exact: true })).toBeVisible();
    await expect(page.locator('.code-highlight-start')).toHaveCount(1);
    await page.getByRole('combobox', { name: 'Source file', exact: true }).selectOption('shared/contracts.ts');
    await expect(page.getByRole('button', { name: 'Play code tour', exact: true })).toHaveCount(0);
  }
  expect(posts).toBe(0); expect(audio).toBe(0);
});

test('real code narration synchronizes source rectangles with seek, pause, speed and replay', async ({ page }) => {
  await page.goto('/?lesson=1');
  await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
  await page.getByRole('button', { name: 'Play code tour', exact: true }).click();
  const media = page.locator('audio[aria-label="TypeScript code narration"]');
  await expect.poll(() => media.evaluate(el => !(el as HTMLAudioElement).paused && (el as HTMLAudioElement).currentTime > 0)).toBe(true);
  const data = await page.request.get('/code-tours/catalog.json').then(response => response.json());
  const manifest = await page.request.get('/audio/code/manifest.json').then(response => response.json());
  const timing = await page.request.get(`/${manifest.recordings['1'].timingFile}`).then(response => response.json());
  await page.getByRole('checkbox', { name: 'Follow the narrated code inside the source panel' }).uncheck();
  await page.locator('.code-tour-viewport').evaluate(el => el.scrollTop = 80);
  const unfollowedPageY = await page.evaluate(() => scrollY);
  await media.evaluate((el, seconds) => { (el as HTMLAudioElement).pause(); (el as HTMLAudioElement).currentTime = seconds; }, timing.cues[2].start + .1);
  await expect(page.locator('.code-highlight-start')).toHaveAttribute('data-code-line', String(data.tours[0].sections[2].startLine));
  expect(await page.locator('.code-tour-viewport').evaluate(el => el.scrollTop)).toBeGreaterThanOrEqual(70);
  expect(await page.locator('.code-tour-viewport').evaluate(el => el.scrollTop)).toBeLessThanOrEqual(90);
  expect(await page.evaluate(() => scrollY)).toBe(unfollowedPageY);
  await page.getByRole('checkbox', { name: 'Follow the narrated code inside the source panel' }).check();
  await page.getByRole('combobox', { name: 'Code narration speed' }).selectOption('1.5');
  expect(await media.evaluate(el => (el as HTMLAudioElement).playbackRate)).toBe(1.5);
  await page.getByRole('button', { name: 'Replay code tour', exact: true }).click();
  await expect(page.locator('.code-highlight-start')).toHaveAttribute('data-code-line', String(data.tours[0].sections[0].startLine));
  await page.getByRole('button', { name: 'Pause code tour', exact: true }).click();
  await expect.poll(() => media.evaluate(el => (el as HTMLAudioElement).paused)).toBe(true);
  await page.getByRole('tab', { name: 'Learn', exact: true }).click();
  expect(await media.evaluate(el => (el as HTMLAudioElement).paused)).toBe(true);
  await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
  await page.getByRole('button', { name: 'Play code tour', exact: true }).click();
  await expect.poll(() => media.evaluate(el => !(el as HTMLAudioElement).paused)).toBe(true);
  const previousAudio = await media.elementHandle();
  await page.getByRole('combobox', { name: 'Source file', exact: true }).selectOption('shared/contracts.ts');
  await expect.poll(() => previousAudio!.evaluate(el => (el as HTMLAudioElement).paused)).toBe(true);
});

test('source changes and damaged recordings leave readable code and transcripts', async ({ page }) => {
  await page.route('**/code-tours/catalog.json', async route => {
    const response = await route.fetch(); const json = await response.json(); json.tours[0].sourceSha256 = '0'.repeat(64);
    await route.fulfill({ response, json });
  });
  await page.goto('/?lesson=1'); await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
  await expect(page.getByText('This code changed after narration was authored.', { exact: false })).toBeVisible();
  await expect(page.locator('.source-card pre')).toBeVisible();
  await page.unroute('**/code-tours/catalog.json');
  await page.route('**/audio/code/*.mp3', route => route.fulfill({ body: 'damaged', contentType: 'audio/mpeg' }));
  await page.reload(); await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
  await page.getByRole('button', { name: 'Play code tour', exact: true }).click();
  await expect(page.getByText('Code media integrity check failed. Use the transcript.')).toBeVisible();
  await page.getByText('Read code tour transcript', { exact: true }).click();
  await expect(page.locator('.code-tour-controls ol')).toBeVisible();
});

test('phone source tour fits and cover preserves its original aspect ratio', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await page.goto('/');
  const image = page.locator('.portal-intro-image');
  expect(await image.evaluate(img => { const el = img as HTMLImageElement, rect = el.getBoundingClientRect(); return Math.abs(rect.width / rect.height - el.naturalWidth / el.naturalHeight) < .002; })).toBe(true);
  await expect(page.getByRole('link', { name: 'Open cover at original resolution', exact: false })).toHaveAttribute('href', /images\/portal-welcome.png$/);
  await page.goto('/?lesson=1'); await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play code tour', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.code-tour-viewport').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/learning-guide/code-tour-phone.png' });
});

for (const width of [320, 1280]) test(`code reader font, wrap and full-screen controls preserve real highlights at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/?lesson=1');
  await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
  const viewport = page.getByRole('region', { name: 'Narrated TypeScript source', exact: true });
  await page.getByRole('combobox', { name: 'Code font size', exact: true }).selectOption('24');
  await expect(viewport.locator('pre')).toHaveCSS('font-size', '24px');
  await page.getByRole('button', { name: 'Wrap code', exact: true }).click();
  await expect.poll(() => viewport.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Enter full-screen code', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Full-screen code reader' });
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await expect(viewport).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.getByRole('button', { name: 'Play code tour in full screen', exact: true }).click();
  const media = page.locator('audio[aria-label="TypeScript code narration"]');
  await expect.poll(() => media.evaluate(el => !(el as HTMLAudioElement).paused && (el as HTMLAudioElement).currentTime > 0)).toBe(true);
  const manifest = await page.request.get('/audio/code/manifest.json').then(response => response.json());
  const timing = await page.request.get(`/${manifest.recordings['1'].timingFile}`).then(response => response.json());
  await media.evaluate((el, seconds) => { (el as HTMLAudioElement).currentTime = seconds; }, timing.cues[2].start - .4);
  await expect(page.locator('.code-tour-rectangle')).toHaveAttribute('data-code-cue', 'code-2');
  async function frameFits() {
    await expect.poll(() => page.locator('.code-tour-rectangle').evaluate(el => {
      const r = el.getBoundingClientRect(), v = el.parentElement!.querySelector('.code-tour-viewport')!.getBoundingClientRect();
      return r.width > 20 && r.height > 10 && r.top >= Math.max(0, v.top) && r.bottom <= Math.min(innerHeight, v.bottom) && r.left >= 0 && r.right <= innerWidth;
    })).toBe(true);
  }
  await frameFits();
  await page.getByRole('button', { name: 'Wrap code', exact: true }).click();
  await page.getByRole('combobox', { name: 'Code font size', exact: true }).selectOption('16');
  await frameFits();
  await page.getByRole('button', { name: 'Pause code narration', exact: true }).click();
  await page.getByRole('button', { name: 'Follow code narration', exact: true }).click();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => viewport.evaluate(el => el.getBoundingClientRect().height <= innerHeight)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Enter full-screen code', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
