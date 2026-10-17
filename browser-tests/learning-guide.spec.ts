import { test, expect } from '@playwright/test';

test('Learning Guide highlights explanations across views without running an exercise', async ({ page }) => {
  let runs = 0, narration = 0;
  page.on('request', request => {
    if (request.method() === 'POST' && /\/api\/c\d+\//.test(request.url())) runs++;
    if (request.method() === 'POST' && request.url().includes('/learning-guide/audio')) narration++;
  });
  await page.goto('/?lesson=65');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start guided tour' }).click();
  await expect(page.locator('[data-guide-target="goal"]')).toHaveClass(/learning-guide-highlight/);
  await expect(page.locator('[data-guide-transcript="goal"]')).toBeVisible();
  await guide.getByRole('button', { name: 'Next section' }).click();
  await expect(page.locator('[data-guide-target="preparation"]')).toHaveClass(/learning-guide-highlight/);
  await guide.getByRole('button', { name: 'Next section' }).click();
  await expect(page.getByRole('tab', { name: 'Run the exercise' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-guide-target="example"]')).toHaveClass(/learning-guide-highlight/);
  await expect(page.getByRole('button', { name: 'Preview proposal', exact: true })).toBeVisible();
  await guide.getByRole('combobox', { name: 'Guide section' }).selectOption('3');
  await expect(page.locator('[data-learning-guide-focus="controls"]')).toContainText('Preview proposal');
  await guide.getByRole('button', { name: 'Show exercise target' }).click();
  await guide.getByRole('combobox', { name: 'Guide section' }).selectOption('4');
  await expect(page.locator('[data-learning-guide-focus="evidence"]')).toContainText('Executed effects: 0');
  await guide.getByRole('combobox', { name: 'Guide section' }).selectOption('5');
  await expect(page.locator('[data-learning-guide-focus="source"]')).toBeVisible();
  await guide.getByRole('combobox', { name: 'Guide section' }).selectOption('3');
  await page.screenshot({ path: 'artifacts/learning-guide-desktop.png', fullPage: true });
  expect(runs).toBe(0); expect(narration).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.learning-guide-highlight')).toHaveCount(0);
  await expect(guide.getByRole('button', { name: 'Start guided tour' })).toBeFocused();
  await expect(page.locator('.learning-guide-control-highlight')).toHaveCount(0);
  await page.reload();
  await guide.getByRole('button', { name: 'Resume saved tour' }).click();
  await expect(guide.getByRole('heading', { name: 'Run at your own pace' })).toBeVisible();
  await expect(page.locator('[data-learning-guide-focus="controls"]')).toBeVisible();
  expect(runs).toBe(0); expect(narration).toBe(0);
});

test('guide handles missing voice, narration failure and persisted self-assessment', async ({ page }) => {
  await page.route('**/api/learning-guide/status', route => route.fulfill({ json: { ready: true, voiceId: 'test-voice', missing: [] } }));
  let calls = 0;
  await page.route('**/api/learning-guide/audio', route => { calls++; return route.fulfill({ status: 502, json: { message: 'Narration unavailable; use the transcript.' } }); });
  await page.goto('/?lesson=75');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start guided tour' }).click();
  await guide.getByRole('button', { name: 'Play narration', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Learning Guide status' })).toContainText('Narration unavailable');
  await guide.getByText('Read narration transcript', { exact: true }).click();
  await expect(guide.getByText(/In Lab 75, your objective/)).toBeVisible();
  await guide.getByText('My learning checklist', { exact: false }).click();
  await guide.getByRole('checkbox', { name: 'I can explain the objective.' }).check();
  await page.reload(); await guide.getByText('My learning checklist', { exact: false }).click();
  await expect(guide.getByRole('checkbox', { name: 'I can explain the objective.' })).toBeChecked();
  expect(calls).toBe(1);
});

test('mobile guide remains usable and close removes its highlight', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lesson=11');
  const guide = page.getByRole('complementary', { name: 'Learning Guide', exact: true });
  await guide.getByRole('button', { name: 'Start guided tour' }).click();
  await expect(page.locator('.learning-guide-highlight')).toHaveCount(1);
  await guide.getByRole('button', { name: 'Minimize guide', exact: true }).click();
  await page.screenshot({ path: 'artifacts/learning-guide-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await guide.getByRole('button', { name: 'Close guide', exact: true }).click();
  await expect(page.locator('.learning-guide-highlight')).toHaveCount(0);
});
