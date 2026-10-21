import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, rm, writeFile } from 'node:fs/promises';

// Own Node children directly; Windows shell wrappers otherwise leave servers running.
let web; let api;
const webPort = Number(process.env.LEARNING_BROWSER_WEB_PORT ?? 5184);
const apiPort = Number(process.env.LEARNING_BROWSER_API_PORT ?? 3086);
let stage = 'creating Vite server';
const started = Date.now();
const progress = (value) => { stage = value; console.log(`[browser startup +${Math.round((Date.now() - started) / 1000)}s] ${stage}`); };
try {
  await rm('artifacts/ci/browser-startup.json', { force: true });
  if (process.env.LEARNING_BROWSER_EXTERNAL_SERVERS !== '1') {
    process.env.LEARNING_API_PORT = String(apiPort);
    process.env.LESSON_UI_URL = `http://127.0.0.1:${webPort}`;
    // Browser scenarios exercise a fixed checkout, not hot editing. Generated
    // screenshots/worktrees must not compete with loading or trigger HMR.
    progress('creating Vite server');
    // Keep browser checks separate from a concurrently running developer server.
    web = await createServer({ mode: 'browser-test', cacheDir: `node_modules/.vite-browser-${webPort}`, server: { port: webPort, strictPort: true, hmr: false } });
    await web.listen();
    progress('waiting for backend health');
    api = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { stdio: 'inherit', env: process.env });
    for (let attempt = 0; ; attempt++) {
      if (api.exitCode !== null) throw new Error('Backend exited before readiness.');
      try { const response = await fetch(`http://127.0.0.1:${apiPort}/api/health`, { signal: AbortSignal.timeout(500) }); if (response.ok) break; } catch {}
      if (attempt >= 300) throw new Error('Backend readiness timed out.');
      await delay(100);
    }
    // An HTTP-ready Vite server is not yet a rendered React application.
    // Load the actual lesson registry before measuring individual scenarios.
    // This performs no exercise POST or provider action.
    progress('launching warmup Chrome');
    const warmup = await chromium.launch({ channel: 'chrome', headless: true, timeout: 30000 });
    try {
      progress('creating warmup page');
      const page = await warmup.newPage();
      for (const path of ['/?lesson=1', '/browser-tests/harness.html?lesson=1']) {
        progress(`loading ${path.split('?')[0]}`);
        await page.goto(`${process.env.LESSON_UI_URL}${path}`, { timeout: 120000, waitUntil: 'domcontentloaded' });
        progress(`waiting for exercise tab on ${path.split('?')[0]}`);
        await page.getByRole('tab', { name: 'Run the exercise', exact: true }).waitFor({ state: 'visible', timeout: 120000 });
      }
      console.log('Lesson UI rendered; starting browser scenarios.');
    } finally {
      await warmup.close();
    }
  }
  progress('starting Playwright scenarios');
  const runner = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
    stdio: 'inherit', env: { ...process.env, LEARNING_BROWSER_EXTERNAL_SERVERS: '1' },
  });
  const [code] = await once(runner, 'exit'); process.exitCode = code ?? 1;
} catch (error) {
  // Retain only authored startup metadata, without page content or provider data.
  await mkdir('artifacts/ci', { recursive: true });
  await writeFile('artifacts/ci/browser-startup.json', JSON.stringify({ stage, elapsedMs: Date.now() - started }, null, 2));
  throw error;
} finally {
  if (api && api.exitCode === null) { const done = once(api, 'exit'); api.kill(); await done; }
  await web?.close();
}
