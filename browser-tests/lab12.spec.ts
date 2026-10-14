import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=12'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Create offline session', exact: true }).click();
  await expect(page.getByLabel('Queue evidence', { exact: true })).toBeVisible();
}
test('busy follow-up waits, then completes in the same session', async ({ page }) => {
  await open(page); const evidence = page.getByLabel('Queue evidence', { exact: true });
  const firstSession = (await evidence.innerText()).match(/Session: (sesn_[^.]+)/)![1];
  await page.getByLabel('Offline scenario', { exact: true }).selectOption('slow');
  await page.getByRole('button', { name: 'Queue message', exact: true }).click();
  await page.getByLabel('Message', { exact: true }).fill('A follow-up for the same notebook.');
  await page.getByRole('button', { name: 'Queue message', exact: true }).click();
  await expect(evidence.locator('article')).toHaveCount(2);
  await expect(evidence.getByRole('heading', { name: 'completed: completed', exact: true })).toHaveCount(2);
  await expect(evidence).toContainText(firstSession!);
  await expect(evidence).toContainText('Waiting commands: 0');
  await expect(page.getByText('An idle session is retained. Queue a message or close it before starting another.', { exact: true })).toBeVisible();
  await expect(page.getByText('A run is in progress.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'completed (completed)' })).toBeVisible();
  await page.getByRole('button', { name: 'Close queue and clean up' }).click();
  await expect(evidence).toContainText('State: closed');
});
test('oversize rejects before admission and closing a hang cancels queued work', async ({ page }) => {
  await open(page); const evidence = page.getByLabel('Queue evidence', { exact: true });
  await page.getByLabel('Message', { exact: true }).fill('x'.repeat(1001)); await page.getByRole('button', { name: 'Queue message', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Invalid or unsupported' })).toBeVisible();
  await expect(evidence.locator('article')).toHaveCount(0);
  await page.getByLabel('Message', { exact: true }).fill('Wait here.'); await page.getByLabel('Offline scenario', { exact: true }).selectOption('hang');
  await page.getByRole('button', { name: 'Queue two-message script' }).click();
  await expect(evidence.locator('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Close queue and clean up' }).click();
  await expect(evidence).toContainText('cancelled-before-submission'); await expect(evidence).toContainText('Cleanup: simulated');
  await expect(page.getByRole('button', { name: 'Queue message', exact: true })).toBeDisabled();
});
test('idle tools and new model context handoff are separate operations', async ({ page }) => {
  await open(page); await page.getByText('Idle configuration and explicit context handoff', { exact: true }).click();
  await page.getByLabel('Tool preset').selectOption('read-only'); await page.getByRole('button', { name: 'Apply idle tools/MCP update' }).click();
  const evidence = page.getByLabel('Queue evidence', { exact: true }); await expect(evidence).toContainText('Tools: read-only');
  await page.getByRole('button', { name: 'Append idle system context' }).click();
  await page.getByRole('button', { name: 'Create new model session with context' }).click();
  await expect(evidence).toContainText('Explicit handoff from');
  await expect(evidence.getByRole('heading', { name: 'completed: completed', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close queue and clean up' }).click();
});
test('phone evidence fits and navigation cancels the retained queue', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 900 }); let runId = ''; let owner = '';
  page.on('request', req => { if (req.url().endsWith('/api/c12/send')) { runId = req.postDataJSON().runId; owner = req.headers()['x-lab-owner']!; } });
  await open(page); await page.getByLabel('Offline scenario', { exact: true }).selectOption('hang');
  await page.getByRole('button', { name: 'Queue message', exact: true }).click();
  await page.getByText('Full queue and event evidence', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('dialog').getByRole('link', { name: 'Home', exact: true }).click();
  await expect.poll(async () => { const response = await request.get(`/api/c12/state?runId=${runId}`, { headers: { 'X-Lab-Owner': owner } }); return (await response.json()).state; }).toBe('closed');
});
