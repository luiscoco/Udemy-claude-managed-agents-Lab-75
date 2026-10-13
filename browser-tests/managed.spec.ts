import { expect, test } from '@playwright/test';

test('foundation scripted run uses real backend, shows evidence and does not call Anthropic', async ({ page }) => {
  const outbound: string[] = []; page.on('request', request => { if (request.url().includes('anthropic.com')) outbound.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('.brand')).toContainText('Claude Managed Agents');
  await page.getByRole('button', { name: 'Run foundation check', exact: true }).click();
  await expect(page.getByText('Output verification: passed. Session cleanup: not-needed.')).toBeVisible();
  await expect(page.getByText('Result and usage', { exact: true })).toBeVisible();
  await expect(page.locator('pre').filter({ hasText: '"verified": true' })).toContainText('"source": "authored-fixture"');
  expect(outbound).toEqual([]);
});
test('missing live setup is actionable and does not masquerade as an executed run', async ({ page }) => {
  await page.goto('/'); await page.getByLabel('Execution mode').selectOption('live');
  await expect(page.getByRole('button', { name: 'Run foundation check', exact: true })).toBeDisabled();
  await expect(page.getByText(/Configure the server API key/)).toBeVisible();
  await expect(page.getByText('Result and usage', { exact: true })).toHaveCount(0);
});
test('cancel authored check remains cancelled', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Run foundation check', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel foundation check', exact: true }).click();
  await expect(page.getByText(/Cancelled locally/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run foundation check', exact: true })).toBeEnabled();
});

test('foundation result remains readable on desktop and mobile', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Run foundation check', exact: true }).click();
  await expect(page.getByText('Output verification: passed. Session cleanup: not-needed.')).toBeVisible();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `docs/managed-foundation-${width}.png`, fullPage: true });
  }
});
