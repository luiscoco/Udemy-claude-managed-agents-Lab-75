import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], {
  stdio: 'inherit', env: { ...process.env, LEARNING_BROWSER_EXTERNAL_SERVERS: '1',
    LESSON_UI_URL: process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5174' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
