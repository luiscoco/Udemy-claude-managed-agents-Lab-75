import { expect, test } from '@playwright/test';
test('five fresh comparisons separate configured pins and observed file loads', async ({ page }) => {
  await page.goto('/?lesson=11'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Preview authored instructions' }).click(); await expect(page.getByText('Host preview loaded. This is not evidence of an agent read.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Compare all offline variants' }).click(); await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByRole('article', { name: 'Without skill result' })).toContainText('No skill file reads observed');
  await expect(page.getByRole('article', { name: 'With pinned skill result' })).toContainText('reference: succeeded');
  await expect(page.getByRole('article', { name: 'Absent reference result' })).toContainText('reference: failed');
  await expect(page.getByRole('article', { name: 'Missing skill ID result' })).toContainText('not created');
  await expect(page.getByRole('article', { name: 'Revised pinned version result' })).toContainText('fixture-v2');
  for (const article of await page.getByRole('article').all()) await expect(article).toContainText('Usage: not reported');
  await page.screenshot({ path: 'test-results/lab11-desktop.png', fullPage: true });
  await page.getByRole('article', { name: 'With pinned skill result' }).screenshot({ path: 'test-results/lab11-report-card.png' });
});
test('metadata-only does not count preview as loading and mobile report wraps', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/?lesson=11'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByLabel('Offline loading scenario').selectOption('metadata-only'); await page.getByRole('button', { name: 'Run offline skill experiment' }).click();
  const result = page.getByRole('article', { name: 'With pinned skill result' }); await expect(result).toContainText('Resolved skills: 1'); await expect(result).toContainText('No skill file reads observed');
  await page.getByRole('button', { name: 'Preview authored reference' }).click(); await expect(result).toContainText('No skill file reads observed');
  await page.getByText('View and copy full evidence JSON', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/lab11-mobile.png', fullPage: true });
  await page.getByRole('heading', { name: 'Inspect skill metadata and progressive loading' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/lab11-mobile-viewport.png' });
});
