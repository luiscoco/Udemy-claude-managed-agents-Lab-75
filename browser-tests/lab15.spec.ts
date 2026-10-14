import { expect, test } from '@playwright/test';
async function open(page: import('@playwright/test').Page) { await page.goto('/?lesson=15'); await page.getByRole('tab', { name: 'Run the exercise' }).click(); }
test('duplicate usage and retrieved totals stay separate; local turn limit sends no provider work', async ({ page }) => {
  await open(page); await page.getByLabel('Offline scenario', { exact: true }).selectOption('repeated-usage'); await page.getByLabel('Host turn limit').fill('1');
  await page.getByRole('button', { name: 'Start offline usage experiment' }).click(); const evidence = page.getByLabel('Usage evidence', { exact: true });
  await expect(evidence).toContainText('State: idle'); await expect(evidence).toContainText('Duplicate usage events ignored: 2');
  await expect(evidence.getByRole('article', { name: 'session session.usage usage', exact: true })).toContainText('Input: 10; output: 5');
  await expect(evidence.getByRole('article', { name: 'session retrieval usage', exact: true })).toContainText('Input: 14; output: 8');
  await page.getByRole('button', { name: 'Send another turn' }).click(); await expect(page.getByRole('status', { name: 'Usage experiment status' })).toContainText('Local turn limit reached');
  await expect(evidence).toContainText('Turns: 1 / 1'); await page.getByRole('button', { name: 'Close usage session' }).click();
});
test('budget pause reads without resuming; separately acknowledged raise resumes the same session', async ({ page }) => {
  await open(page); await page.getByLabel('Offline scenario', { exact: true }).selectOption('budget-reached'); await page.getByRole('button', { name: 'Start offline usage experiment' }).click();
  const evidence = page.getByLabel('Usage evidence', { exact: true }); await expect(evidence).toContainText('State: budget-paused');
  const id = await evidence.locator('code').first().innerText(); let updates = 0; page.on('request', request => { if (request.url().endsWith('/api/c15/budget')) updates++; });
  await page.getByRole('button', { name: 'Retrieve session usage' }).click(); await expect(evidence).toContainText('State: budget-paused'); expect(updates).toBe(0);
  await page.getByText('Explicit budget raise and resume', { exact: true }).click(); await expect(page.getByRole('button', { name: 'Raise budget and resume' })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'I understand raising the cap can resume billed work' }).check(); await page.getByRole('button', { name: 'Raise budget and resume' }).click();
  await expect(evidence).toContainText('State: idle'); await expect(evidence).toContainText('Cap: $1.00'); await expect(evidence).toContainText('Turns: 2 / 3; messages: 1 / 3');
  await expect(evidence.locator('code').first()).toHaveText(id); expect(updates).toBe(1); await page.getByRole('button', { name: 'Close usage session' }).click();
});
test('phone fits missing usage, child attribution and cancellation evidence', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page); const evidence = page.getByLabel('Usage evidence', { exact: true });
  await page.getByLabel('Offline scenario', { exact: true }).selectOption('missing-usage'); await page.getByRole('button', { name: 'Start offline usage experiment' }).click();
  await expect(evidence).toContainText('List cost: not available'); await page.getByRole('button', { name: 'Close usage session' }).click();
  await page.getByLabel('Offline scenario', { exact: true }).selectOption('child-activity'); await page.getByRole('button', { name: 'Start offline usage experiment' }).click();
  await expect(evidence).toContainText('fictional-child'); await page.getByText('Full usage evidence JSON', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.getByRole('button', { name: 'Close usage session' }).click();
  await page.getByLabel('Offline scenario', { exact: true }).selectOption('hang'); await page.getByRole('button', { name: 'Start offline usage experiment' }).click();
  await expect(evidence).toContainText('State: running'); await page.getByRole('button', { name: 'Cancel experiment' }).click(); await expect(evidence).toContainText('State: closed'); await expect(evidence).toContainText('Outcome: cancelled');
});
test('live readiness only checks setup and never starts paid work', async ({ page }) => {
  let calls = 0; await page.route('**/api/managed/setup', route => route.fulfill({ json: { liveReady: false } }));
  page.on('request', request => { if (/\/api\/c15\/(run|session|send|budget)$/.test(request.url())) calls++; });
  await open(page); await page.getByRole('button', { name: 'Run live', exact: true }).click(); await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('MANAGED_LIVE_ENABLED=true'); expect(calls).toBe(0);
});
