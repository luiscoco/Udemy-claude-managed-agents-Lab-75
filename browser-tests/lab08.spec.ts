import { expect, test } from '@playwright/test';

test('delegation shows distinct threads, a refused write and host-verified sum', async ({ page }) => {
  await page.goto('/?lesson=8'); await page.getByRole('tab', { name: 'Run the exercise' }).click(); await page.getByRole('button', { name: 'Run offline delegation' }).click();
  const threads = page.getByRole('table', { name: 'Session threads' }); const effects = page.getByRole('table', { name: 'Effect ledger' });
  await expect(threads).toContainText('researcher'); await expect(threads).toContainText('reviewer'); await expect(threads).toContainText('calculator');
  await expect(effects).toContainText('denied; handler did not run'); await expect(effects).toContainText('Host independently computed 42');
  await expect(page.locator('p').filter({ hasText: 'States:' })).toContainText('delegated → report-received → verified');
});

test('wrong-role capability is denied by host policy', async ({ page }) => {
  await page.goto('/?lesson=8'); await page.getByRole('tab', { name: 'Run the exercise' }).click(); await page.getByLabel('Offline scenario').selectOption('wrong-role'); await page.getByRole('button', { name: 'Run offline delegation' }).click();
  await expect(page.getByRole('table', { name: 'Effect ledger' })).toContainText('Reviewer lacks calculator capability');
});
