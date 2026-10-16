import { test, expect } from '@playwright/test';

test('Lab 51 runs real host assertions and detects the intentional policy mutation', async ({ page }) => {
  await page.goto('/?lesson=51'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Test the Managed host offline', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run offline host tests' }).click();
  await expect(page.getByText('policy mutation detected: true.')).toBeVisible();
  await expect(page.getByText(/mutated-policy-window: expected failure/)).toBeVisible();
  await page.getByLabel('Test scenario').selectOption('duplicate-events');
  await page.getByRole('button', { name: 'Replay recorded events' }).click();
  await expect(page.getByText(/duplicate-events: pass/)).toBeVisible();
});
