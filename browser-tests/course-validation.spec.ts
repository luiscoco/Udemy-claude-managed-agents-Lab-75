import { test, expect } from '@playwright/test';

test('recorded validation is directly accessible and distinguishes a failed parent run from passing suites', async ({ page }) => {
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
  await expect(overview).toContainText('518 offline tests passed');
  await expect(overview).toContainText('320 browser tests passed; 1 optional');
  await expect(overview).toContainText('original run later failed at the team stage');
  await expect(overview).toContainText('all 13 sessions in these three suites were confirmed archived');
  await expect(overview).toContainText('all 5 retest sessions were confirmed archived');
  await expect(overview.getByRole('link', { name: 'Open original live run (overall failure)', exact: true })).toHaveAttribute('href', /\/actions\/runs\/39128999911$/);
  await expect(overview.getByRole('link', { name: 'Open successful offline run', exact: true })).toHaveAttribute('href', /\/actions\/runs\/39134515055$/);
  await expect(overview.getByRole('link', { name: 'Open successful team retest', exact: true })).toHaveAttribute('href', /\/actions\/runs\/39130740976$/);
  await page.reload();
  await expect(overview).toBeFocused();
  await page.locator('.sidebar').getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('region', { name: 'Course progress', exact: true }).getByRole('button', { name: 'Validation results', exact: true }).click();
  await expect(overview).toBeFocused();
  await page.screenshot({ path: 'artifacts/learning-guide/validation-desktop.png' });
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
  await page.screenshot({ path: 'artifacts/learning-guide/validation-mobile.png' });
});
