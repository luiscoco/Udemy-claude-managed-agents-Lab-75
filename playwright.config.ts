import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests', fullyParallel: false, workers: 1,
  use: { baseURL: process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5184', channel: 'chrome', viewport: { width: 1280, height: 900 } },
  // Allows an already supervised server pair to be used on hosts that restrict child-process teardown.
  webServer: process.env.LEARNING_BROWSER_EXTERNAL_SERVERS === '1' ? [] : [
    { command: 'node node_modules/vite/bin/vite.js --strictPort --port 5184', url: 'http://127.0.0.1:5184', reuseExistingServer: false, env: { LEARNING_API_PORT: '3086' } },
    { command: 'node --import tsx server/index.ts', url: 'http://127.0.0.1:3086/api/health', reuseExistingServer: false, env: { LEARNING_API_PORT: '3086' } },
  ],
});
