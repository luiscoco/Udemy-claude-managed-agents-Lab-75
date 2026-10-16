import { test, expect } from '@playwright/test';
test('host acceptance implementations are unavailable through the browser development server', async ({ request }) => {
  const response = await request.get('/server/acceptance/team-holdouts.ts'); expect(response.status()).toBe(403);
  expect(await response.text()).not.toContain("'a'.repeat(20)");
});
test('Lab 75 validates plans, runs actual team and resumes retained first wave', async ({ page }) => {
  test.setTimeout(120000); await page.goto('/?lesson=75'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByLabel('Plan preset', { exact: true }).selectOption('cycle'); await page.getByRole('button', { name: 'Validate plan only' }).click();
  await expect(page.getByRole('status', { name: 'Lab 75 status' })).toContainText('Dependency cycle');
  await page.getByLabel('Scenario', { exact: true }).selectOption('crash-resume'); await page.getByRole('button', { name: 'Run engineering team' }).click();
  await expect(page.getByRole('status', { name: 'Lab 75 status' })).toContainText('Team interrupted.', { timeout: 45000 });
  await expect(page.getByRole('heading', { name: 'T1: merged' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume interrupted team' }).click();
  await expect(page.getByRole('status', { name: 'Lab 75 status' })).toContainText('Team ready. Release gate: ready.', { timeout: 45000 });
  await expect(page.getByRole('heading', { name: 'Release gate: ready' })).toBeVisible(); await expect(page.getByText('PASS tag length boundary', { exact: true })).toBeVisible();
  await expect(page.getByText('planner: 1 cents (fixture-assumption)', { exact: true })).toHaveCount(1);
});
