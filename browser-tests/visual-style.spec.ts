import { expect, test } from '@playwright/test';

for (const width of [390, 768, 1440, 1920]) test(`shared lesson layout and theme fit ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  let posts = 0;
  page.on('request', request => { if (request.method() === 'POST') posts++; });
  for (const lesson of width === 1440 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [1, 3, 4, 10, 11]) {
    await page.goto(`/?lesson=${lesson}`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click();
    await expect(page.locator('.exercise-frame h2').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Check your result', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Hide guidance' }).click();
  await expect(page.getByRole('button', { name: 'Show guidance' })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Show guidance' }).click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('tab', { name: 'TypeScript source' }).click();
  await expect(page.locator('.source-card')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(posts).toBe(0);
});
