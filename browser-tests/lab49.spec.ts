import { test, expect } from '@playwright/test';

test('Lab 49 reports machine-readable offline CI verdicts', async ({ page }) => {
  await page.goto('/?lesson=49'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Headless host and CI outcomes', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run headless fixture' }).click();
  await expect(page.getByRole('status', { name: 'Lab 49 status' })).toContainText('CI exit code 0');
  await page.getByLabel('Offline scenario').selectOption('unconfirmed-stop');
  await page.getByRole('button', { name: 'Run headless fixture' }).click();
  await expect(page.getByRole('status', { name: 'Lab 49 status' })).toContainText('CI exit code 2');
  await expect(page.getByText(/Cleanup: pending/)).toBeVisible();
});
