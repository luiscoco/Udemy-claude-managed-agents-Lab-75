import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

test('live conversations are available with a server key, but a turn needs fresh consent', async () => {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: '0', ANTHROPIC_API_KEY: 'fixture-only-test-key', CLAUDE_MANAGED_AGENT_ID: 'agent_fixture', CLAUDE_MANAGED_ENVIRONMENT_ID: 'env_fixture', MANAGED_LIVE_ENABLED: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  try {
    const origin = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Study Coach server did not start')), 30000);
      child.stdout.on('data', (chunk) => {
        const match = String(chunk).match(/http:\/\/127\.0\.0\.1:(\d+)/);
        if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); }
      });
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    });
    const health = await (await fetch(`${origin}/api/health`)).json();
    assert.equal(health.liveAvailable, true);
    const created = await fetch(`${origin}/api/conversations`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({mode: 'live'}),
    });
    assert.equal(created.status, 201);
    const session = await created.json();
    const refused = await fetch(`${origin}/api/conversations/${session.id}/turns`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({question: 'How can I test a tool result?', consent: false}),
    });
    assert.equal(refused.status, 403);
    assert.match((await refused.json()).error, /Authorize this paid question/);
  } finally {
    child.kill();
  }
});
