import { test, expect } from '@playwright/test';

test('Lab 71 renders ledger chart/report and rejects tampered evidence without ledger edits', async ({ page }) => {
  await page.goto('/?lesson=71'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Create analysis session' }).click();
  await page.getByRole('button', { name: 'Run scripted analyst' }).click();
  await expect(page.getByText('Verification: verified.')).toBeVisible();
  const chart = page.getByRole('img', { name: 'Ledger chart G1 from C2' }); await expect(chart).toBeVisible();
  await expect.poll(() => chart.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.getByText(/computations 3; charts 1; host tool events 4/)).toBeVisible();
  await page.getByRole('button', { name: 'Verify tampered report' }).click();
  await expect(page.getByRole('status', { name: 'Lab 71 status' })).toContainText('Tampered report rejected; ledger unchanged');
  await expect(page.getByText(/unknown computation/)).toBeVisible();
  await expect(page.getByText(/computations 3; charts 1; host tool events 4/)).toBeVisible();
});
