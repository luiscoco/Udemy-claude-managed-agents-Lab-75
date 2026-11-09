import { test, expect } from './fixtures/diagnostic-test';
import { readFile, mkdir } from 'node:fs/promises';
import { lessonInfographics, infographicKey } from '../shared/learning-infographics';
import { infographicManifestSchema } from '../shared/infographic-assets';
import { narrationTimelineSchema } from '../shared/learning-narration';

for (const visual of lessonInfographics) test(`Lab ${visual.lessonId} ${visual.kind} image, study links and source navigation need no provider action`, async ({ page }) => {
  let posts = 0, providers = 0;
  page.on('request', request => { if (request.method() === 'POST') posts++; if (/api\.inworld\.ai|\/api\/learning-guide\//.test(request.url())) providers++; });
  await page.goto(`/?lesson=${visual.lessonId}`);
  // Give the real workspace its loading budget before making fast UI assertions.
  await expect(page.getByRole('tab', { name: 'Learn', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('tab')).toHaveText([
    'Learn', 'Run the exercise', 'TypeScript source', 'Concept map', 'Lab walkthrough', 'AI Tutor',
  ]);
  const name = visual.kind === 'concepts' ? 'Concept map' : 'Lab walkthrough';
  await page.getByRole('tab', { name, exact: true }).click();
  const panel = page.getByRole('tabpanel', { name, exact: true });
  const image = panel.locator('img'); await expect(image).toBeVisible();
  const manifest = infographicManifestSchema.parse(JSON.parse(await readFile('public/infographics/pilot-manifest.json', 'utf8')));
  const asset = manifest.assets[infographicKey(visual.lessonId, visual.kind)]!;
  expect(await image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight])).toEqual([asset.image.width, asset.image.height]);
  await panel.getByRole('button', { name: 'Next region', exact: true }).click();
  await expect(panel.locator('[data-visual-region]')).toHaveAttribute('data-visual-region', visual.regions[1]!.id);
  await panel.getByRole('button', { name: '100%', exact: true }).click();
  const viewer = panel.getByRole('region', { name: `${visual.title} image viewer` });
  expect(await viewer.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await viewer.focus(); await page.keyboard.press('+');
  await expect(panel.getByRole('slider', { name: 'Zoom', exact: true })).toHaveValue('110');
  await panel.getByRole('button', { name: 'Fit image', exact: true }).click();
  const download = page.waitForEvent('download'); await panel.getByRole('link', { name: 'Download PNG image' }).click();
  expect((await download).suggestedFilename()).toBe(`lab-${String(visual.lessonId).padStart(2, '0')}-${visual.kind}.png`);
  await panel.getByText('Read visual tour transcript', { exact: true }).click();
  await expect(panel.locator('.infographic-transcript li')).toHaveCount(6);
  await panel.getByRole('button', { name: 'Open corresponding source', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'TypeScript source', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('combobox', { name: 'Source file', exact: true })).toHaveValue(visual.regions[1]!.source);
  await page.getByRole('combobox', { name: 'Source file', exact: true }).selectOption('shared/contracts.ts');
  await page.getByRole('tab', { name, exact: true }).click();
  await panel.getByRole('button', { name: 'Next region', exact: true }).click();
  await panel.getByRole('button', { name: 'Open corresponding source', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Source file', exact: true })).toHaveValue(visual.regions[1]!.source);
  expect(posts).toBe(0); expect(providers).toBe(0);
});

for (const lessonId of [1, 2, 3, 12, 65, 75].filter(id => lessonInfographics.some(visual => visual.lessonId === id))) test(`Lab ${lessonId} committed visual narration follows real region gaps and stops on tab change`, async ({ page }) => {
  await page.setViewportSize({ width: [2, 65, 75].includes(lessonId) ? 390 : 1280, height: 900 });
  const kind = lessonId === 65 ? 'lab' : 'concepts';
  const name = kind === 'concepts' ? 'Concept map' : 'Lab walkthrough';
  const manifest = infographicManifestSchema.parse(JSON.parse(await readFile('public/infographics/pilot-manifest.json', 'utf8')));
  const asset = manifest.assets[infographicKey(lessonId, kind)]!;
  const timeline = narrationTimelineSchema.parse(JSON.parse(await readFile(`public/${asset.recording.timingFile}`, 'utf8')));
  let posts = 0, recordings = 0;
  page.on('request', request => { if (request.method() === 'POST') posts++; if (request.url().endsWith('.mp3')) recordings++; });
  await page.goto(`/?lesson=${lessonId}`); await page.getByRole('tab', { name, exact: true }).click();
  const panel = page.getByRole('tabpanel', { name, exact: true });
  await expect(panel.locator('img')).toBeVisible();
  await panel.getByRole('button', { name: 'Next region', exact: true }).click();
  await panel.getByRole('button', { name: 'Next region', exact: true }).click();
  await panel.getByRole('button', { name: 'Play visual tour', exact: true }).click();
  const media = panel.locator('audio');
  await expect.poll(() => media.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(timeline.cues[2]!.start);
  await panel.getByRole('button', { name: 'Pause visual narration', exact: true }).click();
  await expect(media).toHaveJSProperty('paused', true);
  const handle = await media.elementHandle();
  for (let index = 1; index < 6; index++) {
    const previous = timeline.cues[index - 1]!, next = timeline.cues[index]!;
    await media.evaluate((element: HTMLAudioElement, time) => { element.currentTime = time; }, (previous.end + next.start) / 2);
    const highlighted = panel.locator('[data-visual-region]');
    await expect(highlighted).toHaveAttribute('data-visual-region', next.id);
    await expect(highlighted).toHaveCSS('border-top-color', 'rgb(237, 36, 36)');
  }
  const viewport = panel.locator('.infographic-viewport'), highlighted = panel.locator('[data-visual-region]');
  await expect.poll(async () => { const box = await highlighted.boundingBox(), view = await viewport.boundingBox();
    return !!box && !!view && box.x >= view.x && box.y >= view.y && box.x + box.width <= view.x + view.width && box.y + box.height <= view.y + view.height; }).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir('artifacts/learning-guide/infographics', { recursive: true });
  await page.screenshot({ path: `artifacts/learning-guide/infographics/narrated-${lessonId}.png` });
  await panel.getByRole('button', { name: 'Replay visual tour', exact: true }).click();
  await expect.poll(() => media.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeLessThan(2);
  await page.getByRole('tab', { name: 'Learn', exact: true }).click();
  expect(await handle!.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
  expect(posts).toBe(0); expect(recordings).toBe(1);
});

test('missing image keeps the complete text and links available', async ({ page }) => {
  await page.route('**/infographics/*.png', route => route.fulfill({ status: 404 }));
  await page.goto('/?lesson=12'); await page.getByRole('tab', { name: 'Concept map', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Infographic status' })).toContainText('unavailable');
  await page.getByText('Read visual tour transcript', { exact: true }).click();
  await expect(page.locator('.infographic-transcript li')).toHaveCount(6);
  await page.getByRole('button', { name: 'Open related explanation', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Learn', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-guide-target="goal"]')).toHaveAttribute('open', '');
});

test('pilot infographic views preserve exercise inputs', async ({ page }) => {
  await page.goto('/browser-tests/harness.html?lesson=1');
  await page.getByRole('tab', { name: 'Run the exercise', exact: true }).click();
  await page.getByRole('textbox', { name: 'Test text' }).fill('keep my experiment');
  for (const name of ['Concept map', 'Lab walkthrough', 'Run the exercise']) await page.getByRole('tab', { name, exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Test text' })).toHaveValue('keep my experiment');
});
