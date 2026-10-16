import { test, expect } from '@playwright/test';

test('Lab 57 verifies serial integration and preserves conflicting branches', async ({ page }) => {
  await page.goto('/?lesson=57'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Workers in host Git worktrees', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run local worktrees' }).click();
  await expect(page.getByRole('status', { name: 'Lab 57 status' })).toContainText('integration passed');
  await expect(page.getByText(/Combined tests passed: true/)).toBeVisible();
  await page.getByLabel('Worktree scenario').selectOption('competing-edits');
  await page.getByRole('button', { name: 'Run local worktrees' }).click();
  await expect(page.getByRole('status', { name: 'Lab 57 status' })).toContainText('integration conflicted');
  await expect(page.getByText(/Branches preserved: true/)).toBeVisible();
  await expect(page.getByText(/cherry-pick aborted/)).toBeVisible();
});
