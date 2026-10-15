import { test, expect } from '@playwright/test';

test('Lab 32 revision invalidates stale approval, then permits one checked file action', async ({ page }) => {
  await page.goto('/?lesson=32'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Plan review and execution gate', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Start plan' }).click();
  const evidence = page.getByRole('region', { name: 'File evidence' });
  await expect(evidence).toContainText('Planning effects: 0. Execution effects: 0.');
  await page.getByRole('button', { name: 'Try planning write' }).click();
  await expect(evidence).toContainText('denied — Planning phase is read-only');
  await page.getByRole('button', { name: 'Request revision' }).click();
  await expect(page.getByRole('region', { name: 'Plan under review' })).toContainText('Plan v2');
  await page.getByRole('button', { name: 'Try stale approval' }).click();
  await expect(page.getByRole('status', { name: 'Lab 32 status' })).toContainText('Stale plan version or hash');
  await page.getByRole('button', { name: 'Approve current plan' }).click();
  await expect(evidence).toContainText('Planning effects: 0. Execution effects: 1.');
  await expect(evidence).toContainText('Approved fictional deployment checklist.');
});
