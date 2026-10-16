import { test, expect } from '@playwright/test';

test('Lab 55 server gates candidate rehearsal despite client eligibility hints', async ({ page }) => {
  await page.goto('/?lesson=55'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Rehearse an SDK and API upgrade', level: 2 })).toBeVisible();
  await page.getByLabel('Candidate fixture').selectOption('removed-type');
  await page.getByRole('button', { name: 'Analyze candidate' }).click();
  await expect(page.getByText(/server eligible: false/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rehearse canary' })).toBeDisabled();
  await page.getByLabel('Candidate fixture').selectOption('compatible-change');
  await page.getByRole('button', { name: 'Analyze candidate' }).click();
  await page.getByRole('button', { name: 'Rehearse canary' }).click();
  await expect(page.getByText(/State: canary/)).toBeVisible();
  await page.getByRole('button', { name: 'Rehearse promotion' }).click();
  await expect(page.getByText(/State: promoted/)).toBeVisible();
  await page.getByRole('button', { name: 'Rehearse rollback' }).click();
  await expect(page.getByText(/State: rolled-back/)).toBeVisible();
  await expect(page.getByText(/Remote sessions rewound by host rollback: false/)).toBeVisible();
});
