import { test, expect } from '@playwright/test';
test('Lab 73 real Git fix reaches ready; gaming produces draft without commit', async ({ page }) => {
  test.setTimeout(90000); await page.goto('/?lesson=73'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Run PR review and fix' }).click();
  await expect(page.getByRole('status', { name: 'Lab 73 status' })).toContainText('PR ready. 1 verified local fix commits.', { timeout: 30000 });
  await expect(page.getByRole('cell', { name: 'PASS', exact: true })).toHaveCount(5);
  await page.getByLabel('Scenario', { exact: true }).selectOption('skipped-tests'); await page.getByRole('button', { name: 'Run PR review and fix' }).click();
  await expect(page.getByRole('status', { name: 'Lab 73 status' })).toContainText('PR draft. 0 verified local fix commits.', { timeout: 30000 });
  await expect(page.getByRole('cell', { name: 'FAIL', exact: true }).first()).toBeVisible();
});
