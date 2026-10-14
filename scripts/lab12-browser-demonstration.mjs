import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

mkdirSync('artifacts/lab12', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  // Fail rather than permitting an accidental live session during this demonstration.
  await page.route('**/api/c12/session', async route => {
    if (route.request().postDataJSON().mode !== 'scripted') throw new Error('Offline demonstration only.');
    await route.continue();
  });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5174'}/?lesson=12`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click();
    await page.getByRole('button', { name: 'Create offline session', exact: true }).click();
    await page.getByRole('button', { name: 'Queue two-message script' }).click();
    const evidence = page.getByLabel('Queue evidence', { exact: true });
    await expect(evidence.getByRole('heading', { name: 'completed: completed', exact: true })).toHaveCount(2);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/lab12/offline-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Close queue and clean up' }).click();
    await expect(evidence).toContainText('State: closed');
  }
} finally { await browser.close(); }
