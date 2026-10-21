import { test, expect, type Page } from '@playwright/test';

async function expectHeadingBelowHeader(page: Page) {
  await expect.poll(() => page.getByRole('heading', { name: 'Start here', exact: true }).evaluate(heading => {
    const rect = heading.getBoundingClientRect();
    const header = document.querySelector('.topbar')!;
    const fixed = ['sticky', 'fixed'].includes(getComputedStyle(header).position);
    return rect.top >= (fixed ? header.getBoundingClientRect().bottom + 8 : 0) && rect.bottom <= innerHeight;
  })).toBe(true);
}

test('Start here opens the exercise, notebook and durable milestone destination without executing work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let posts = 0, downloads = 0;
  page.on('request', request => {
    if (request.method() === 'POST') posts++;
    if (/\/api\/learning-milestones\/.*\.zip/.test(request.url())) downloads++;
  });
  await page.addInitScript(() => {
    if (!localStorage.getItem('managed-learning-note-1')) localStorage.setItem('managed-learning-note-1', 'Keep this observation.');
    if (!localStorage.getItem('managed-learning-checklist-1')) localStorage.setItem('managed-learning-checklist-1', '[true,false,false,false]');
  });
  await page.goto('/#course-start-here');
  const guide = page.getByRole('region', { name: 'Start here', exact: true });
  await expect(guide).toBeFocused();
  await expectHeadingBelowHeader(page);
  await page.reload();
  await expectHeadingBelowHeader(page);
  await guide.getByRole('link', { name: 'Open Lab 01 exercise', exact: true }).click();
  await expect(page).toHaveURL(/\?lesson=1#lesson-exercise-1$/);
  await expect(page.getByRole('tab', { name: 'Run the exercise', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.sidebar').getByRole('link', { name: 'Start here', exact: true }).click();
  await expect(guide).toBeFocused();
  await expectHeadingBelowHeader(page);
  await guide.getByRole('link', { name: 'Open Lab 01 notebook', exact: true }).click();
  await expect(page.locator('#lesson-notebook-1')).toBeFocused();
  await expect(page.locator('#lesson-notebook-1')).toHaveAttribute('open', '');
  await expect(page.locator('#lesson-notebook-1').getByRole('textbox')).toHaveValue('Keep this observation.');
  await page.goBack();
  await expect(guide).toBeFocused();
  await expectHeadingBelowHeader(page);
  await guide.getByRole('link', { name: 'Open milestone projects', exact: true }).click();
  await expect(page.locator('#course-learning-milestones')).toBeFocused();
  await page.reload();
  await expect(page.locator('#course-learning-milestones')).toBeFocused();
  await page.goBack();
  await expect(guide).toBeFocused();
  await expectHeadingBelowHeader(page);
  await page.goForward();
  await expect(page.locator('#course-learning-milestones')).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('managed-learning-checklist-1'))).toBe('[true,false,false,false]');
  expect(posts).toBe(0); expect(downloads).toBe(0);
});

test('Start here is available from the phone menu and fits the screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lesson=12');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Course navigation', exact: true });
  await menu.getByRole('link', { name: 'Start here', exact: true }).click();
  await expect(menu).not.toBeVisible();
  const guide = page.getByRole('region', { name: 'Start here', exact: true });
  await expect(guide).toBeFocused();
  await expectHeadingBelowHeader(page);
  await expect(guide.getByRole('link', { name: 'Open milestone projects', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await guide.screenshot({ path: 'artifacts/learning-guide/start-here-mobile.png' });
});
