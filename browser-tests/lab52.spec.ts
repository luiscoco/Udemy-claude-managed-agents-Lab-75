import { test, expect } from '@playwright/test';

test('Lab 52 regression gate follows the host ledger and an owned baseline', async ({ page }) => {
  await page.goto('/?lesson=52'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Evals, judges and regression baselines', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run offline eval' }).click();
  await expect(page.getByText(/host pass rate 100%/)).toBeVisible();
  await page.getByLabel('Candidate').selectOption('regression');
  await page.getByRole('button', { name: 'Run offline eval' }).click();
  await expect(page.getByText(/host pass rate 25%/)).toBeVisible();
  await page.getByRole('button', { name: 'Compare with baseline' }).click();
  await expect(page.getByText(/promotion allowed: false/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Promote local result' })).toBeDisabled();
  await page.getByLabel('Candidate').selectOption('recovered');
  await page.getByRole('button', { name: 'Run offline eval' }).click();
  await expect(page.getByRole('button', { name: 'Promote local result' })).toBeEnabled();
  await page.getByRole('button', { name: 'Promote local result' }).click();
  await expect(page.getByRole('status', { name: 'Lab 52 status' })).toContainText('Local promotion pointer set');
});
