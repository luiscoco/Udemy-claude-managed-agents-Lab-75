import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=18'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}

test('offline host policy separates one real file read from denied path, network and missing environment', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Run offline host test' }).click();
  await expect(page.getByLabel('Sandbox evidence')).toContainText('Read calls: 1');
  await expect(page.getByLabel('Sandbox evidence')).toContainText('Network calls: 0');
  await page.getByLabel('Offline policy scenario').selectOption('outside-mount');
  await page.getByRole('button', { name: 'Run offline host test' }).click();
  await expect(page.getByLabel('Sandbox evidence')).toContainText('Read calls: 0');
  await expect(page.getByLabel('Sandbox evidence')).toContainText('Outside path denied');
  await page.getByLabel('Offline policy scenario').selectOption('blocked-network');
  await page.getByRole('button', { name: 'Run offline host test' }).click();
  await expect(page.getByLabel('Sandbox evidence')).toContainText('before opening a socket');
  await page.getByLabel('Offline policy scenario').selectOption('missing-environment');
  await page.getByRole('button', { name: 'Run offline host test' }).click();
  await expect(page.getByRole('article', { name: 'Environment availability' })).toContainText('Ready: false');
  await expect(page.getByLabel('Sandbox evidence')).toContainText('Host fixture: none');
});

test('phone fits, page load and readiness do not create a billed session', async ({ page }) => {
  let liveRuns = 0;
  page.on('request', request => { if (request.url().endsWith('/api/c18/run') && request.postDataJSON()?.mode === 'live') liveRuns++; });
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await expect(page.getByLabel('Configured platform')).toContainText('Environment version: not exposed by SDK 1.7.0');
  await page.getByRole('button', { name: 'Run live', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('MANAGED_LIVE_ENABLED');
  expect(liveRuns).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
