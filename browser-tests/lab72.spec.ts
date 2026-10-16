import { test, expect } from '@playwright/test';
test('Lab 72 verifies documents, offers guarded downloads and rejects placeholders', async ({ page }) => {
  await page.goto('/?lesson=72'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Build document', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Lab 72 status' })).toContainText('Document verified.');
  await expect(page.getByText('Package: verified. Incident contract: verified.')).toBeVisible();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download verified DOCX' }).click();
  expect((await download).suggestedFilename()).toBe('verified-report.docx');
  await page.getByRole('button', { name: 'Check command policy' }).click();
  await expect(page.getByRole('status', { name: 'Lab 72 status' })).toContainText('Policy rejected command. Executed: false');
  await page.getByLabel('Scenario', { exact: true }).selectOption('placeholder');
  await page.getByRole('button', { name: 'Build document', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Lab 72 status' })).toContainText('Document rejected.');
  await expect(page.getByRole('button', { name: 'Download verified DOCX' })).toBeDisabled();
});
