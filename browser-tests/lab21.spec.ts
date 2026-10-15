import { expect, test } from '@playwright/test';

test('host commands expand on a retained offline session and local actions do not send', async ({ page }) => {
  let liveRuns = 0;
  page.on('request', request => { if (request.url().endsWith('/api/c21/session') && request.postDataJSON()?.mode === 'live') liveRuns++; });
  await page.goto('/?lesson=21'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Prepare offline session' }).click();
  await expect(page.getByRole('status', { name: 'Command status' })).toContainText('Owned command session prepared');
  await page.getByRole('button', { name: 'Run host command' }).click();
  await expect(page.getByLabel('Command result')).toContainText('Format a fictional observation note. Species: Aurora Finch. Count: 3. Location: north marsh.');
  await expect(page.getByLabel('Command result')).toContainText('Session message count: 1');
  await page.getByRole('button', { name: 'Try invalid args' }).click();
  await expect(page.getByRole('status', { name: 'Command status' })).toContainText('Invalid command arguments');
  await page.getByRole('button', { name: 'Try unknown command' }).click();
  await expect(page.getByRole('status', { name: 'Command status' })).toContainText('Unknown command rejected');
  await page.getByRole('button', { name: 'Inspect local history' }).click();
  await expect(page.getByLabel('Command result')).toContainText('This action provider sends: 0');
  await page.getByRole('button', { name: 'Reset local history' }).click();
  await expect(page.getByLabel('Command result')).toContainText('Local history: empty');
  await page.getByRole('button', { name: 'Close command session' }).click();
  await expect(page.getByRole('status', { name: 'Command status' })).toContainText('closed');
  expect(liveRuns).toBe(0);
});

test('phone layout fits and live setup inspection sends no command', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await page.goto('/?lesson=21');
  await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Run live' }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('isolated server API key');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
