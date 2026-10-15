import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=24'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Who owns the agent loop?', level: 2 })).toBeVisible();
}
test('all three offline harnesses use checked host effects', async ({ page }) => {
  await open(page);
  for (const harness of ['manual-messages', 'messages-tool-runner', 'managed-session']) {
    await page.getByLabel('Harness', { exact: true }).selectOption(harness);
    await page.getByRole('button', { name: 'Run offline harness' }).click();
    await expect(page.getByRole('status', { name: 'Harness status' })).toContainText('reserved');
    await expect(page.getByLabel(/result/).first()).toContainText('Final host stock: 3');
  }
  await page.getByLabel('Scenario').selectOption('large-reservation');
  await page.getByRole('button', { name: 'Run offline harness' }).click();
  await expect(page.getByLabel(/result/).first()).toContainText('Final host stock: 5');
  await page.getByLabel('Scenario').selectOption('call-limit'); await page.getByLabel('Host call limit').selectOption('1');
  await page.getByRole('button', { name: 'Run offline harness' }).click();
  await expect(page.getByLabel(/result/).first()).toContainText('call-limit');
  await expect(page.getByLabel(/result/).first()).toContainText('Final host stock: 5');
});

test('phone layout fits and live path is unavailable without setup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await page.getByRole('button', { name: 'Run live' }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('separate explicit opt-in');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
