import { test, expect } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Explicit local artifact opt-in: reuse an existing provider recording, never synthesize during this test.
test('existing Inworld recording plays, pauses and replays in the actual guide', async ({ page }) => {
  const clip = process.env.LEARNING_GUIDE_AUDIO_CLIP;
  test.skip(!clip, 'Set LEARNING_GUIDE_AUDIO_CLIP to an existing authorized MP3 to verify playback without provider calls.');
  let requests = 0;
  await page.route('**/api/learning-guide/status', route => route.fulfill({ json: { ready: true, voiceId: 'Yash', missing: [] } }));
  await page.route('**/api/learning-guide/audio', route => {
    requests++; return route.fulfill({ path: resolve(clip!), contentType: 'audio/mpeg' });
  });
  await page.goto('/?lesson=65');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start guided tour' }).click();
  await guide.getByRole('button', { name: 'Play narration', exact: true }).click();
  const audio = guide.locator('audio');
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.2);
  await guide.getByRole('button', { name: 'Pause narration', exact: true }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
  await guide.getByRole('combobox', { name: 'Playback speed' }).selectOption('1.25');
  await guide.getByRole('button', { name: 'Replay narration', exact: true }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false);
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.playbackRate)).toBe(1.25);
  expect(requests).toBe(1);
  await guide.getByRole('button', { name: 'Next section' }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
  await expect(audio).not.toHaveAttribute('src');
  await mkdir('artifacts/learning-guide', { recursive: true });
  await writeFile('artifacts/learning-guide/browser-playback.json', JSON.stringify({
    played: true, pauseVerified: true, replayVerified: true, speedVerified: 1.25,
    sectionChangeStopsAudio: true, cachedAudioRequests: requests, providerRequests: 0,
    note: 'Playback uses the existing authorized recording; this is not a subjective listening assessment.' }, null, 2));
});
