import { test, expect } from '@playwright/test';

test('Lab 62 keeps current Acme evidence and rejects fabricated citation', async ({ page }) => {
  await page.goto('/?lesson=62'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Retrieval RAG through custom tools', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run retrieval fixture' }).click();
  await expect(page.getByRole('status', { name: 'Lab 62 status' })).toContainText('grounded: verified');
  await expect(page.getByText(/Current Acme policy permits unused returns within 30 days/)).toBeVisible();
  await page.getByLabel('Report scenario').selectOption('fabricated-citation');
  await page.getByRole('button', { name: 'Run retrieval fixture' }).click();
  await expect(page.getByRole('status', { name: 'Lab 62 status' })).toContainText('fabricated-citation: rejected');
  await expect(page.getByText(/citation check: false/)).toBeVisible();
});
