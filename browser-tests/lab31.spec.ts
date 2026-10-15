import { test, expect } from '@playwright/test';

test('Lab 31 validates one selected answer against the stored question', async ({ page }) => {
  await page.goto('/?lesson=31'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Host questions and correlated answers', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Start question' }).click();
  await expect(page.getByRole('region', { name: 'Host question', exact: true })).toContainText('fictional deployment target');
  await page.getByRole('button', { name: 'Try invalid answer' }).click();
  await expect(page.getByRole('status', { name: 'Lab 31 status' })).toContainText('not in the stored question');
  await page.getByRole('radio', { name: 'Staging' }).check();
  await page.getByRole('button', { name: 'Submit answer' }).click();
  await expect(page.getByRole('status', { name: 'Lab 31 status' })).toContainText('answered; 1 correlated result');
  await expect(page.getByText('Answer: staging.')).toBeVisible();
});
