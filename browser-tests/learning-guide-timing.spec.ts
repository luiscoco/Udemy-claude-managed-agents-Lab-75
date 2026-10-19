import { test, expect, type Page } from '@playwright/test';
import { learningGuide } from '../shared/learning-guide';
import { alignNarration, narrationText, type NarrationTimeline } from '../shared/learning-narration';
import { createHash } from 'node:crypto';
import type { NarrationManifest } from '../shared/learning-recordings';
import { silentNarration } from './narration-fixture';

async function fixture(page: Page) {
  const timelines = new Map<string, NarrationTimeline>();
  const clips: NarrationManifest['clips'] = {};
  const hash = createHash('sha256').update(silentNarration).digest('hex');
  let recordings = 0, exercises = 0;
  let current: NarrationTimeline | undefined;
  for (const lessonId of [1, 65, 75]) for (const step of learningGuide(lessonId)) {
    const words = narrationText(step).split(/\s+/);
    const timeline = alignNarration(lessonId, step, { wordAlignment: {
      words, wordStartTimeSeconds: words.map((_, index) => index * 5.5 / words.length),
      wordEndTimeSeconds: words.map((_, index) => (index + 0.95) * 5.5 / words.length),
    } });
    const stem = `audio/guides/tour-${lessonId}-${step.id}-${hash.slice(0, 16)}`;
    clips[`${lessonId}:${step.id}`] = { file: `${stem}.mp3`, timingFile: `${stem}.json`, text: narrationText(step), sha256: hash, durationSeconds: 6 };
    timelines.set(`${stem}.json`, timeline);
  }
  page.on('request', request => { if (request.method() === 'POST' && /\/api\/c\d+\//.test(request.url())) exercises++; });
  await page.route('**/api/learning-guide/**', route => { throw new Error(`Student playback must not call author API: ${route.request().url()}`); });
  await page.route('**/audio/guides/manifest.json', route => route.fulfill({ json: {
    version: 1, provider: 'inworld', voiceId: 'synthetic-test', modelId: 'fixture', recordedOn: 'test', clips,
  } }));
  await page.route('**/audio/guides/*.mp3', route => { recordings++; return route.fulfill({ body: silentNarration, contentType: 'audio/mpeg' }); });
  await page.route('**/audio/guides/tour-*.json', route => {
    current = timelines.get(`audio/guides/${route.request().url().split('/audio/guides/')[1]}`);
    return route.fulfill({ json: current });
  });
  return { counts: () => ({ recordings, exercises }), timeline: () => current! };
}

test('media-clock rectangles follow pause, seek and replay without refetching recordings', async ({ page }) => {
  const state = await fixture(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?lesson=1');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start guided tour', exact: true }).click();
  expect(state.counts().recordings).toBe(0);
  await guide.getByRole('button', { name: 'Play narration', exact: true }).click();
  const audio = guide.locator('audio');
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.2);
  await guide.getByRole('button', { name: 'Pause narration', exact: true }).click();
  const cue = state.timeline().cues[2]!;
  await audio.evaluate((element: HTMLAudioElement, time) => { element.currentTime = time; }, cue.start + 0.01);
  const highlighted = page.locator(`[data-guide-cue="${cue.id}"]`);
  await expect(highlighted).toHaveClass(/learning-guide-cue-highlight/);
  const paused = await audio.evaluate((element: HTMLAudioElement) => element.currentTime);
  await page.waitForTimeout(350); // Verify a paused media clock does not advance the rectangle.
  expect(await audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBe(paused);
  await expect(highlighted).toHaveClass(/learning-guide-cue-highlight/);
  const first = state.timeline().cues[0]!;
  await audio.evaluate((element: HTMLAudioElement, time) => { element.currentTime = time; }, first.start + 0.01);
  await expect(page.locator(`[data-guide-cue="${first.id}"]`)).toHaveClass(/learning-guide-cue-highlight/);
  await guide.getByRole('button', { name: 'Replay narration', exact: true }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => !element.paused)).toBe(true);
  expect(state.counts().recordings).toBe(1);
  await guide.getByRole('button', { name: 'Next section', exact: true }).click();
  await expect(audio).not.toHaveAttribute('src');
  await expect(page.locator('.learning-guide-cue-highlight')).toHaveCount(0);
  await guide.getByRole('button', { name: 'Close guide', exact: true }).click();
  await expect(page.locator('.learning-guide-highlight')).toHaveCount(0);
  expect(state.counts().exercises).toBe(0);
});

test('damaged recordings fail closed and leave written guidance usable without author API calls', async ({ page }) => {
  await fixture(page);
  await page.route('**/audio/guides/*.mp3', route => route.fulfill({ body: Buffer.from('damaged MP3'), contentType: 'audio/mpeg' }));
  await page.goto('/?lesson=1');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start guided tour', exact: true }).click();
  await guide.getByRole('button', { name: 'Play narration', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Learning Guide status' })).toContainText('integrity check failed');
  await expect(guide.locator('audio')).not.toHaveAttribute('src');
  await guide.getByRole('button', { name: 'Next section', exact: true }).click();
  await expect(page.locator('[data-guide-target="preparation"]')).toHaveClass(/learning-guide-highlight/);
});

test('narrated continuation plays explanations and waits at learner actions', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/?lesson=1');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start narrated tour', exact: true }).click();
  const audio = guide.locator('audio');
  for (const title of ['Understand the goal', 'Prepare your experiment', 'Choose your example']) {
    await expect(guide.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.duration > 0 && !element.paused)).toBe(true);
    await audio.evaluate((element: HTMLAudioElement) => { element.currentTime = element.duration - 0.02; });
  }
  await expect(page.getByRole('status', { name: 'Learning Guide status' })).toContainText('Your turn.');
  await page.waitForTimeout(350);
  expect(state.counts()).toEqual({ recordings: 3, exercises: 0 });
  await expect(guide.getByRole('heading', { name: 'Choose your example', exact: true })).toBeVisible();
  await guide.getByRole('button', { name: 'Next section', exact: true }).click();
  await expect.poll(() => state.counts().recordings).toBe(4);
  await guide.getByRole('button', { name: 'Close guide', exact: true }).click();
  expect(state.counts().exercises).toBe(0);
});

test('phone narration keeps the highlighted explanation above its compact player', async ({ page }) => {
  const state = await fixture(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lesson=65');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start narrated tour', exact: true }).click();
  await expect.poll(() => guide.locator('audio').evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.1);
  await guide.getByRole('button', { name: 'Pause narration', exact: true }).click();
  const cue = state.timeline().cues.at(-2)!;
  await guide.locator('audio').evaluate((element: HTMLAudioElement, time) => { element.currentTime = time; }, cue.start + 0.01);
  const target = page.locator(`[data-guide-cue="${cue.id}"]`);
  await expect(target).toHaveClass(/learning-guide-cue-highlight/);
  await expect(guide.getByRole('button', { name: 'Replay narration', exact: true })).toBeInViewport();
  const bounds = await target.boundingBox(), player = await guide.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(player!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/learning-guide/timed-narration-mobile.png' });
  expect(state.counts().exercises).toBe(0);
});
