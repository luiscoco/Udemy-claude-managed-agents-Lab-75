import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const phase = process.argv[2] ?? 'after';
mkdirSync('artifacts/visual-style', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  // Screenshots inspect the UI only; no exercise or paid model call is submitted.
  for (const width of phase === 'before' ? [1440] : [390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const lesson of ['home', '1', '10', '11']) {
      await page.goto(`${process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5174'}/${lesson === 'home' ? '' : `?lesson=${lesson}`}`);
      if (lesson !== 'home') {
        await page.getByRole('tab', { name: 'Run the exercise' }).click();
        await page.getByRole('tabpanel', { name: 'Run the exercise' }).locator('section').first().waitFor();
      }
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow: ${lesson} at ${width}`);
      await page.screenshot({ path: `artifacts/visual-style/${phase}-${lesson}-${width}.png`, fullPage: true });
    }
  }
} finally { await browser.close(); }
