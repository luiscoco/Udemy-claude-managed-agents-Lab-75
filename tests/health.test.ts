import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { once } from 'node:events';
import { createHealthRouter } from '../server/routes/health.js';
import packageJson from '../package.json' with { type: 'json' };

test('focused health router reports readiness without credentials or live execution', async () => {
  const app = express();
  app.use('/api', createHealthRouter());
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert(address && typeof address !== 'string');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`, { signal: AbortSignal.timeout(2_000) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), {
      version: packageJson.version,
      readiness: 'ready',
      features: { scriptedLessons: false, liveAgentExecution: false },
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
