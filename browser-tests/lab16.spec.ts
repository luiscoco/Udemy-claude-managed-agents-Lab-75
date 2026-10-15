import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) { await page.goto('/?lesson=16'); await page.getByRole('tab', { name: 'Run the exercise' }).click(); }

test('synthetic host layer wins while remote variable remains uninjected', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Resolve host settings' }).click();
  await expect(page.getByRole('article', { name: 'OBSERVATION_REGION' })).toContainText('user override');
  await expect(page.getByRole('article', { name: 'OBSERVATION_REGION' })).toContainText('not injected');
  await page.getByLabel('Session region override').selectOption('north'); await page.getByRole('button', { name: 'Resolve host settings' }).click();
  await expect(page.getByRole('article', { name: 'OBSERVATION_REGION' })).toContainText('session override');
  await page.getByRole('button', { name: 'Compare three layers' }).click(); await expect(page.getByText('Case 3:')).toContainText('session override');
});

test('missing mount and outside path are separated from a completed fixture session', async ({ page }) => {
  await open(page); await page.getByLabel('Offline scenario').selectOption('absent-remote-mount');
  await page.getByRole('button', { name: 'Run offline environment exercise' }).click();
  await expect(page.getByText('Observed mount: absent', { exact: false })).toBeVisible();
  await expect(page.getByText('Cleanup: simulated', { exact: false })).toBeVisible();
  await page.getByLabel('Candidate path').selectOption('/etc/passwd'); await page.getByRole('button', { name: 'Inspect host path policy' }).click();
  await expect(page.getByLabel('Path policy result')).toContainText('Denied');
});

test('phone fits the provenance table and readiness does not launch a billed run', async ({ page }) => {
  let runs = 0; page.on('request', request => { if (request.url().endsWith('/api/c16/env-run')) runs++; });
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await page.getByRole('button', { name: 'Run live', exact: true }).click(); await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('CLAUDE_MANAGED_LAB16_FILE_ID');
  expect(runs).toBe(0); await page.getByRole('button', { name: 'Resolve host settings' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
