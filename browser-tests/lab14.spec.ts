import { expect, test } from '@playwright/test';
async function open(page: import('@playwright/test').Page) { await page.goto('/?lesson=14'); await page.getByRole('tab', { name: 'Run the exercise' }).click(); }
test('effort comparisons use fresh sessions and preserve the original prompt', async ({ page }) => {
  await open(page); const evidence = page.getByLabel('Model experiment evidence', { exact: true });
  await page.getByLabel('User question').fill('Original fixed prompt'); await page.getByLabel('Effort', { exact: true }).selectOption('low');
  await page.getByRole('button', { name: 'Run offline model experiment' }).click(); await expect(evidence).toContainText('configuration matches: true');
  await expect(evidence).toContainText('not measured for fixtures'); const first = await evidence.locator('code').first().innerText();
  await page.getByLabel('Effort', { exact: true }).selectOption('high'); await page.getByRole('button', { name: 'Run offline model experiment' }).click();
  await expect(evidence).toContainText('/ high'); await expect(evidence.locator('code').first()).not.toHaveText(first);
  await page.getByLabel('User question').fill('Changed form only'); await expect(page.locator('table tbody')).toContainText('Original fixed prompt');
  await expect(page.locator('table tbody')).not.toContainText('Changed form only');
  await page.getByRole('button', { name: 'Close and reconcile experiment' }).click();
});
test('offline unavailable primary uses selected fallback budget; invalid combinations send nothing', async ({ page }) => {
  await open(page); await page.getByLabel('Offline scenario').selectOption('primary-unavailable'); await page.getByRole('checkbox', { name: /Allow one host fallback/ }).check();
  await page.getByLabel('Fallback budget (US cents)').fill('35'); await page.getByRole('button', { name: 'Run offline model experiment' }).click();
  const evidence = page.getByLabel('Model experiment evidence', { exact: true }); await expect(evidence).toContainText('Attempt 2: completed'); await expect(evidence).toContainText('separately identified');
  await page.getByRole('button', { name: 'Close and reconcile experiment' }).click(); let requests = 0;
  page.on('request', request => { if (request.url().endsWith('/api/c14/run')) requests++; });
  await page.getByLabel('Model', { exact: true }).selectOption('claude-sonnet-4-6'); await page.getByLabel('Effort', { exact: true }).selectOption('xhigh');
  await page.getByRole('button', { name: 'Run offline model experiment' }).click(); await expect(page.getByRole('status', { name: 'Model experiment status' })).toContainText('Invalid configuration'); expect(requests).toBe(0);
});
test('phone evidence fits and hanging turn cancels with cleanup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await page.getByLabel('Offline scenario').selectOption('hang'); await page.getByRole('button', { name: 'Run offline model experiment' }).click();
  await expect(page.getByRole('status', { name: 'Model experiment status' })).toContainText('Fresh session created');
  await page.getByRole('button', { name: 'Cancel experiment' }).click(); await expect(page.getByRole('button', { name: 'Run offline model experiment' })).toBeEnabled();
  const evidence = page.getByLabel('Model experiment evidence', { exact: true }); await expect(evidence).toContainText('cancelled'); await expect(evidence).toContainText('Cleanup: simulated');
  await page.getByText('Full model experiment JSON', { exact: true }).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('live readiness gate reads catalog without executing paid work', async ({ page }) => {
  let executions = 0; await page.route('**/api/c14/models', async route => {
    const response = await route.fetch(); const data = await response.json(); data.liveReady = false; await route.fulfill({ json: data });
  }); page.on('request', request => { if (/\/api\/c14\/(run|send|session)$/.test(request.url())) executions++; });
  await open(page); await page.getByRole('button', { name: 'Run live', exact: true }).click(); await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('CLAUDE_MANAGED_LAB14_MODELS');
  expect(executions).toBe(0);
});
