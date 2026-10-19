import { test, expect } from '@playwright/test';

test('recorded validation is directly accessible and shows the verified offline and four-suite online runs', async ({ page }) => {
  test.setTimeout(90000); // The first page can compile the full lesson registry on a cold development server.
  let posts = 0, githubRequests = 0;
  page.on('request', request => {
    if (request.method() === 'POST') posts++;
    if (/https:\/\/(?:api\.)?github.com\//.test(request.url())) githubRequests++;
  });
  await page.goto('/?lesson=12');
  await page.locator('.sidebar').getByRole('link', { name: 'Validation results', exact: true }).click();
  const overview = page.getByRole('region', { name: 'Validation results', exact: true });
  await expect(overview).toBeFocused();
  await expect(page).toHaveURL(/\/#course-validation$/);
  await expect(overview).toContainText('519 offline tests passed');
  await expect(overview).toContainText('13 evaluator and setup tests passed');
  await expect(overview).toContainText('322 browser tests passed; 1 optional');
  await expect(overview).toContainText('All four suites passed');
  await expect(overview).toContainText('Engineering team: 5 sessions passed');
  await expect(overview).toContainText('all 18 sessions were confirmed archived');
  await expect(overview.locator('time')).toHaveAttribute('datetime', '2026-10-19');
  await expect(overview.getByRole('link', { name: 'Open successful online run', exact: true })).toHaveAttribute('href', /\/actions\/runs\/39166185199$/);
  await expect(overview.getByRole('link', { name: 'Open successful offline run', exact: true })).toHaveAttribute('href', /\/actions\/runs\/39220328920$/);
  await expect(overview.getByRole('link', { name: 'ff2cc39', exact: true })).toHaveAttribute('href', /\/commit\/ff2cc39a25876110431f226a149a593a4927a406$/);
  await expect(overview.getByRole('link', { name: '0725b6b', exact: true })).toHaveAttribute('href', /\/commit\/0725b6b9f4032e1062f068c2794cd12078622a7a$/);
  await page.reload();
  await expect(overview).toBeFocused();
  await page.locator('.sidebar').getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('region', { name: 'Course progress', exact: true }).getByRole('button', { name: 'Validation results', exact: true }).click();
  await expect(overview).toBeFocused();
  await overview.screenshot({ path: 'artifacts/learning-guide/validation-desktop.png' });
  expect(posts).toBe(0); expect(githubRequests).toBe(0);
});

test('validation overview fits mobile and opening it preserves checklist and notebook state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('managed-learning-checklist-12', '[true,false,false,false]');
    localStorage.setItem('managed-learning-note-12', 'Preserve this note.');
  });
  await page.goto('/?lesson=12');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Course navigation', exact: true });
  await menu.getByRole('link', { name: 'Validation results', exact: true }).click();
  await expect(menu).not.toBeVisible();
  const overview = page.getByRole('region', { name: 'Validation results', exact: true });
  await expect(overview).toBeFocused();
  await expect(overview.getByText('Recorded test evidence', { exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('managed-learning-checklist-12'))).toBe('[true,false,false,false]');
  expect(await page.evaluate(() => localStorage.getItem('managed-learning-note-12'))).toBe('Preserve this note.');
  await overview.screenshot({ path: 'artifacts/learning-guide/validation-mobile.png' });
});
