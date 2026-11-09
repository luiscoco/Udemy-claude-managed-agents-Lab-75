import { test, expect } from './fixtures/diagnostic-test';

test('checklist changes update Home progress and recommend the next unfinished lesson without provider calls', async ({ page }) => {
  let posts = 0; page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/?lesson=1');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByText('My learning checklist', { exact: false }).click();
  for (const label of ['I can explain the objective.', 'I ran an example and inspected its evidence.', 'I connected the result to the source.', 'I tried the challenge.']) {
    await guide.getByRole('checkbox', { name: label, exact: true }).check();
  }
  await expect(page.locator('.sidebar .nav-progress-summary')).toContainText('1 / 75');
  await page.locator('.sidebar').getByRole('link', { name: 'Home', exact: true }).click();
  const progress = page.getByRole('region', { name: 'Course progress', exact: true });
  await expect(progress.locator('progress')).toHaveAttribute('value', '1');
  await expect(progress.getByText('1 / 75', { exact: true })).toBeVisible();
  await expect(progress.getByRole('link', { name: 'Continue learning: Lab 02', exact: true })).toBeVisible();
  await progress.getByRole('link', { name: 'Continue learning: Lab 02', exact: true }).click();
  await expect(page).toHaveURL(/lesson=2/); expect(posts).toBe(0);
});

test('Continue learning returns to a saved lesson while audio and tour stay stopped', async ({ page }) => {
  let posts = 0; page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/?lesson=65');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start guided tour' }).click();
  await guide.getByRole('combobox', { name: 'Guide section' }).selectOption('3');
  await guide.getByRole('button', { name: 'Close guide', exact: true }).click();
  await page.locator('.sidebar').getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('link', { name: 'Continue learning: Lab 65', exact: true }).click();
  await expect(guide.getByRole('button', { name: 'Resume saved tour', exact: true })).toBeVisible();
  await expect(page.locator('.learning-guide-highlight')).toHaveCount(0);
  await guide.getByRole('button', { name: 'Resume saved tour', exact: true }).click();
  await expect(guide.getByRole('heading', { name: 'Run at your own pace', exact: true })).toBeVisible();
  expect(posts).toBe(0);
});

test('progress overview fits mobile and updates after a storage change', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  const progress = page.getByRole('region', { name: 'Course progress', exact: true });
  await expect(progress).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem('managed-learning-checklist-65', '[true,true,true,true]');
    window.dispatchEvent(new StorageEvent('storage', { key: 'managed-learning-checklist-65' }));
  });
  await expect(progress.locator('progress')).toHaveAttribute('value', '1');
  await progress.getByText('Progress by topic', { exact: true }).click();
  await expect(progress.locator('.topic-progress-list li').filter({ hasText: 'Function tools and human control' })).toContainText('1 /');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/learning-guide-progress-mobile.png', fullPage: true });
});
