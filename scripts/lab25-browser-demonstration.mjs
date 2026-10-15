import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

mkdirSync('artifacts/lab25', { recursive: true });
let web; let api; let browser;
const webPort = Number(process.env.LEARNING_BROWSER_WEB_PORT ?? 5184);
const apiPort = Number(process.env.LEARNING_BROWSER_API_PORT ?? 3086);
try {
  if (!process.env.LESSON_UI_URL) {
    process.env.LEARNING_API_PORT = String(apiPort);
    web = await createServer({ server: { port: webPort, strictPort: true } }); await web.listen();
    api = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { stdio: 'inherit', env: process.env });
    for (let attempt = 0; ; attempt++) {
      if (api.exitCode !== null) throw new Error('Backend exited before readiness.');
      try { if ((await fetch(`http://127.0.0.1:${apiPort}/api/health`, { signal: AbortSignal.timeout(500) })).ok) break; } catch {}
      if (attempt >= 300) throw new Error('Backend readiness timed out.'); await delay(100);
    }
  }
  browser = await chromium.launch({ channel: 'chrome' }); const page = await browser.newPage();
  await page.route('**/api/c25/run', async route => {
    if (route.request().postDataJSON().mode !== 'scripted') throw new Error('Offline demonstration only.');
    await route.continue();
  });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${process.env.LESSON_UI_URL ?? `http://127.0.0.1:${webPort}`}/?lesson=25`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click();
    await expect(page.getByRole('heading', { name: 'Context growth and compaction evidence', level: 2 })).toBeVisible();
    await page.getByRole('button', { name: 'Run offline replay' }).click();
    await expect(page.getByLabel('Context replay result')).toContainText('sevt_compacted_fixture');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/lab25/context-${width}.png`, fullPage: true });
  }
} finally {
  await browser?.close();
  if (api && api.exitCode === null) { const done = once(api, 'exit'); api.kill(); await done; }
  await web?.close();
}
