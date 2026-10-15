import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

mkdirSync('artifacts/lab17', { recursive: true });
let web; let api; let browser;
try {
  if (!process.env.LESSON_UI_URL) {
    process.env.LEARNING_API_PORT = '3086';
    web = await createServer({ server: { port: 5184, strictPort: true } });
    await web.listen();
    api = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { stdio: 'inherit', env: process.env });
    for (let attempt = 0; ; attempt++) {
      if (api.exitCode !== null) throw new Error('Backend exited before readiness.');
      try { if ((await fetch('http://127.0.0.1:3086/api/health', { signal: AbortSignal.timeout(500) })).ok) break; } catch {}
      if (attempt >= 300) throw new Error('Backend readiness timed out.');
      await delay(100);
    }
  }
  browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.route('**/api/c17/session', async route => {
    if (route.request().postDataJSON().mode !== 'scripted') throw new Error('Offline demonstration only.');
    await route.continue();
  });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5184'}/?lesson=17`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click();
    await page.getByRole('button', { name: 'Start offline fixture session' }).click();
    await page.getByRole('button', { name: 'Take host snapshot' }).click();
    await page.getByRole('button', { name: 'Send turn and run host handler' }).click();
    await expect(page.getByRole('article', { name: 'notes.md' })).toContainText('Status: reviewed');
    await page.getByRole('button', { name: 'Dry-run restore' }).click();
    await expect(page.getByRole('article', { name: 'Restore plan' })).toContainText('restore notes.md');
    await page.evaluate(() => window.scrollTo(0, 0));
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.screenshot({ path: `artifacts/lab17/restore-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Close session' }).click();
  }
} finally {
  await browser?.close();
  if (api && api.exitCode === null) { const done = once(api, 'exit'); api.kill(); await done; }
  await web?.close();
}
