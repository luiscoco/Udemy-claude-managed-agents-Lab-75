import { test, expect } from '@playwright/test';

test('lesson notebook and persistent progress and backup shortcuts open their destinations', async ({ page }) => {
  let posts = 0;
  page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/?lesson=12');
  await page.getByRole('button', { name: 'Open notebook', exact: true }).click();
  const notebook = page.locator('#lesson-notebook-12');
  await expect(notebook).toHaveAttribute('open', '');
  await expect(notebook).toBeFocused();
  await notebook.getByRole('textbox').fill('Shortcut test: local note.');
  await notebook.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.locator('.sidebar').getByRole('link', { name: 'Course progress', exact: true }).click();
  await expect(page.locator('#course-progress')).toBeFocused();
  await page.getByRole('button', { name: 'Open learning backup', exact: true }).click();
  await expect(page.locator('#course-learning-backup')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Download learning backup' })).toBeVisible();
  await page.goto('/?lesson=65');
  await page.locator('.sidebar').getByRole('link', { name: 'Back up or restore', exact: true }).click();
  await expect(page.locator('#course-learning-backup')).toBeFocused();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download learning backup' }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('managed-agents-learning-backup.json');
  expect(posts).toBe(0);
});

test('mobile menu opens notebook and backup without starting a run', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lesson=65');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Course navigation' });
  await menu.getByRole('button', { name: 'My notebook / Lab 65', exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect(page.locator('#lesson-notebook-65')).toBeFocused();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await menu.getByRole('link', { name: 'Back up or restore', exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect(page.locator('#course-learning-backup')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Download learning backup' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/learning-guide-shortcuts-mobile.png' });
});
