import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=25'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Context growth and compaction evidence', level: 2 })).toBeVisible();
}
test('offline compaction evidence and host handoff remain separate', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Run offline replay' }).click();
  await expect(page.getByLabel('Context replay result')).toContainText('sevt_compacted_fixture');
  await expect(page.getByLabel('Context replay result')).toContainText('Free context: unavailable');
  await expect(page.getByRole('region', { name: 'Host summary handoff' })).toContainText('r2: retained in summary');
  await page.getByLabel('Offline scenario').selectOption('summary-omits');
  await page.getByRole('button', { name: 'Run offline replay' }).click();
  await expect(page.getByRole('region', { name: 'Host summary handoff' })).toContainText('r2: omitted from summary');
  await page.getByLabel('Offline scenario').selectOption('missing-metrics');
  await page.getByRole('button', { name: 'Run offline replay' }).click();
  await expect(page.getByLabel('Context replay result')).toContainText('input unavailable');
});
test('phone layout fits and live setup starts no session', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await page.getByRole('button', { name: 'Run live' }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('separately configured');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
