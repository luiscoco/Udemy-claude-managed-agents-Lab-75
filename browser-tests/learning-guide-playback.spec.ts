import { test, expect } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

// Plays the committed course recording; no author credentials or synthesis routes.
test('existing Inworld recording plays, pauses and replays in the actual guide', async ({ page }) => {
  let requests = 0, providerRequests = 0;
  page.on('request', request => {
    if (request.url().includes('/audio/guides/') && request.url().endsWith('.mp3')) requests++;
    if (request.url().includes('/api/learning-guide/') || request.url().includes('api.inworld.ai')) providerRequests++;
  });
  await page.goto('/?lesson=1');
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
  expect(requests).toBe(1); expect(providerRequests).toBe(0);
  await guide.getByRole('button', { name: 'Next section' }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
  await expect(audio).not.toHaveAttribute('src');
  await mkdir('artifacts/learning-guide', { recursive: true });
  await writeFile('artifacts/learning-guide/browser-playback.json', JSON.stringify({
    played: true, pauseVerified: true, replayVerified: true, speedVerified: 1.25,
    sectionChangeStopsAudio: true, cachedAudioRequests: requests, providerRequests: 0,
    note: 'Playback uses the existing authorized recording; this is not a subjective listening assessment.' }, null, 2));
});
