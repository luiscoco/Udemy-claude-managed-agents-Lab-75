import { test, expect } from '@playwright/test';

test('knowledge feedback, retry and saved results never mark an exercise or checklist complete', async ({ page }) => {
  let posts = 0; page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/?lesson=65');
  await page.getByRole('button', { name: 'Open knowledge check', exact: true }).click();
  const quiz = page.locator('#knowledge-check-65'); await expect(quiz).toBeFocused();
  await quiz.getByRole('radio', { name: 'Yes; provider acceptance automatically approves it.', exact: true }).check();
  await quiz.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(quiz.getByRole('status', { name: 'Knowledge check feedback' })).toContainText('Review this concept');
  await quiz.getByRole('radio', { name: 'No; a trusted reviewer decision is still required.', exact: true }).check();
  await expect(quiz.getByRole('status', { name: 'Knowledge check feedback' })).toHaveCount(0);
  await quiz.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(quiz.getByRole('heading', { name: 'Correct', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar .nav-progress-summary')).toContainText('0 / 75');
  await page.reload(); await page.getByRole('button', { name: 'Open knowledge check', exact: true }).click();
  await expect(quiz.getByRole('heading', { name: 'Correct', exact: true })).toBeVisible();
  await quiz.getByRole('button', { name: 'Review lesson source', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'TypeScript source', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.sidebar').getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('.knowledge-progress')).toContainText('1 correct / 75; 1 attempted');
  expect(posts).toBe(0);
});

test('knowledge checks fit mobile and disabled storage does not prevent local feedback', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/?lesson=1');
  await page.getByRole('button', { name: 'Open knowledge check', exact: true }).click();
  const quiz = page.locator('#knowledge-check-1');
  await quiz.getByRole('radio', { name: 'The reported turn outcome and lifecycle evidence.', exact: true }).check();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage denied for this test.'); }; });
  await quiz.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(quiz.getByRole('status', { name: 'Knowledge check status' })).toContainText('could not save');
  await expect(quiz.getByRole('heading', { name: 'Correct', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/learning-guide-knowledge-mobile.png', fullPage: false });
});
