import { test, expect } from '@playwright/test';
test('Lab 74 shows matrix safety/utility and distinguishes compromised from defended trials', async ({ page }) => {
  await page.goto('/?lesson=74'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByLabel('Defense', { exact: true }).selectOption('none'); await page.getByRole('button', { name: 'Run offline attack' }).click();
  await expect(page.getByText(/Attempted: true. Attack succeeded: true./)).toBeVisible();
  await page.getByLabel('Defense', { exact: true }).selectOption('policy'); await page.getByRole('button', { name: 'Run offline attack' }).click();
  await expect(page.getByText(/Attack succeeded: false. Safe draft utility: true./)).toBeVisible();
  await page.getByRole('button', { name: 'Compare defense matrix' }).click();
  await expect(page.getByRole('status', { name: 'Lab 74 status' })).toContainText('Safety floor: PASS. Clean utility: PASS.');
  await expect(page.getByRole('row')).toHaveCount(7);
  await page.getByRole('button', { name: 'Run bounded mutations' }).click(); await expect(page.getByRole('status', { name: 'Lab 74 status' })).toContainText('4 bounded mutations; 0 successes');
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download sanitized report' }).click(); expect((await pending).suggestedFilename()).toBe('fictional-redteam-report.json');
});
