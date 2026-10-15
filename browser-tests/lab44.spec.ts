import { test, expect } from '@playwright/test';

test('Lab 44 separates host spans and provider event fixtures with content redacted', async ({ page }) => {
  await page.goto('/?lesson=44'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Host telemetry and provider event traces', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run trace fixture' }).click();
  await expect(page.getByRole('status', { name: 'Lab 44 status' })).toContainText('5 host spans');
  await expect(page.getByText(/Remote OTLP export observed: false/)).toBeVisible();
  await expect(page.getByText(/Fictional content recorded: false/)).toBeVisible();
});
