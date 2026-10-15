import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=22'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
test('offline source selection exposes exact inputs and keeps cloud memory distinct', async ({ page }) => {
  let liveRuns = 0; page.on('request', request => { if (request.url().endsWith('/api/c22/run') && request.postDataJSON()?.mode === 'live') liveRuns++; });
  await open(page);
  await expect(page.locator('li code').filter({ hasText: 'project/observations/CLAUDE.md' })).toBeVisible();
  for (const [scenario, included, omitted] of [
    ['nested', 'NESTED_MARKER', 'MEMORY_MARKER'], ['conflict', 'UNTRUSTED_MARKER', 'MEMORY_MARKER'],
    ['disabled', 'Selected host reads: none', 'PROJECT_ROOT_MARKER'], ['handoff', 'MEMORY_MARKER', 'NESTED_MARKER'],
  ] as const) {
    await page.getByLabel('Context scenario').selectOption(scenario);
    await page.getByRole('button', { name: 'Run offline context' }).click();
    const result = page.getByLabel('Context result');
    await expect(result).toContainText(included); await expect(result).not.toContainText(omitted);
    await expect(result).toContainText('Cloud memory: not-attached. Observed remote file reads: 0.');
  }
  await page.getByRole('button', { name: 'Reset selected result' }).click();
  await expect(page.getByLabel('Context result')).toHaveCount(0);
  expect(liveRuns).toBe(0);
});

test('phone layout fits and live setup inspection does not start a session', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await page.getByRole('button', { name: 'Run live' }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('isolated server API key');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
