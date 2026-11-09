import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { build, createServer, preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, rm, writeFile } from 'node:fs/promises';

// Own Node children directly; Windows shell wrappers otherwise leave servers running.
let web; let harness; let api;
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
    // Vite build and middleware share this process; keep their NODE_ENV aligned.
    process.env.NODE_ENV = 'development';
    // A fresh test context loading the full unbundled registry can exhaust
    // Chrome's request buffers on Windows (ERR_NO_BUFFER_SPACE). Exercise the
    // bundled application; keep Vite transforms for development-only harness
    // and raw-source failure tests, whose request URLs are intentional contracts.
    const outDir = `artifacts/ci/browser-app-${webPort}`;
    const browserBuild = { outDir, copyPublicDir: false };
    progress('building browser application');
    await build({ mode: 'browser-test', build: browserBuild });
    harness = await createServer({
      mode: 'browser-test', cacheDir: `node_modules/.vite-browser-${webPort}`,
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    progress('serving bundled application and development harness');
    web = await preview({
      mode: 'browser-test', build: browserBuild,
      preview: { host: '127.0.0.1', port: webPort, strictPort: true },
      plugins: [{
        name: 'browser-test-harness-and-public-media',
        configurePreviewServer(server) {
          server.middlewares.use((request, response, next) => {
            const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
            if (pathname === '/' || pathname === '/index.html' || pathname.startsWith('/assets/')) next();
            else harness.middlewares(request, response, next);
          });
        },
      }],
    });
    progress('waiting for backend health');
    api = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { stdio: 'inherit', env: process.env });
    const readinessDeadline = Date.now() + 120000;
    for (;;) {
      if (api.exitCode !== null) throw new Error('Backend exited before readiness.');
      try { const response = await fetch(`http://127.0.0.1:${apiPort}/api/health`, { signal: AbortSignal.timeout(500) }); if (response.ok) break; } catch {}
      if (Date.now() >= readinessDeadline) throw new Error('Backend readiness timed out.');
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
  await harness?.close();
}
