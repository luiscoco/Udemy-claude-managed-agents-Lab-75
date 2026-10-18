import { test, expect } from '@playwright/test';

test('selected path persists and provides optional path navigation without starting work', async ({ page }) => {
  let posts = 0; page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/');
  const paths = page.getByRole('region', { name: 'Choose a learning path', exact: true });
  await page.getByRole('navigation', { name: 'Learning overview sections' }).getByRole('button', { name: 'Learning paths', exact: true }).click();
  await expect(paths).toBeFocused();
  await paths.getByRole('button', { name: 'Choose: Managed Agents foundations', exact: true }).click();
  await page.reload();
  await expect(paths.getByRole('button', { name: 'Selected: Managed Agents foundations', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await paths.getByRole('link', { name: 'Continue path: Lab 01', exact: true }).click();
  const banner = page.getByRole('complementary', { name: 'Selected learning path', exact: true });
  await expect(banner).toContainText('Path step 1 / 13');
  await banner.getByRole('link', { name: 'Next in path', exact: true }).click();
  await expect(page).toHaveURL(/lesson=2/);
  await expect(banner).toContainText('Path step 2 / 13');
  expect(posts).toBe(0);
});

test('review queue removes a corrected answer while preserving an explicit bookmark', async ({ page }) => {
  let posts = 0; page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/?lesson=65'); await page.getByRole('button', { name: 'Open knowledge check', exact: true }).click();
  const quiz = page.locator('#knowledge-check-65');
  await quiz.getByRole('radio', { name: 'Yes; provider acceptance automatically approves it.', exact: true }).check();
  await quiz.getByRole('button', { name: 'Check answer', exact: true }).click();
  const notebook = page.locator('.lesson-notebook'); await notebook.locator('summary').click();
  await notebook.getByRole('checkbox', { name: 'Bookmark this lesson for review', exact: true }).check();
  await page.locator('.sidebar').getByRole('link', { name: 'Home', exact: true }).click();
  const queue = page.getByRole('region', { name: 'Your review queue', exact: true });
  await expect(queue.getByRole('link', { name: /^Review Lab 65:/ })).toHaveCount(1);
  await expect(queue).toContainText('Knowledge check needs review / Bookmarked for review');
  await queue.getByRole('link', { name: /^Review Lab 65:/ }).click();
  await page.getByRole('button', { name: 'Open knowledge check', exact: true }).click();
  await quiz.getByRole('radio', { name: 'No; a trusted reviewer decision is still required.', exact: true }).check();
  await quiz.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.locator('.sidebar').getByRole('link', { name: 'Home', exact: true }).click();
  await queue.getByRole('button', { name: 'Knowledge checks', exact: true }).click();
  await expect(queue.getByRole('link', { name: /^Review Lab 65:/ })).toHaveCount(0);
  await queue.getByRole('button', { name: 'Bookmarks', exact: true }).click();
  await expect(queue.getByRole('link', { name: /^Review Lab 65:/ })).toHaveCount(1);
  expect(posts).toBe(0);
});

test('learning paths fit mobile and can be cleared', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  const paths = page.getByRole('region', { name: 'Choose a learning path', exact: true });
  await paths.getByRole('button', { name: 'Choose: Complete course', exact: true }).click();
  await paths.getByRole('button', { name: 'Clear selected path', exact: true }).click();
  await expect(paths.getByRole('button', { name: 'Choose: Complete course', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await paths.scrollIntoViewIfNeeded(); await page.screenshot({ path: 'artifacts/learning-guide-paths-mobile.png', fullPage: false });
});
