import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
// @ts-expect-error The deployable gateway is an independent JavaScript entry point.
import { createRecordingGateway } from '../azure/recording-gateway.mjs';

test('recording gateway rejects anonymous and incorrect credentials before reaching the application', async () => {
  const received: { path: string; authorization?: string }[] = [];
  const backend = http.createServer((req, res) => { received.push({ path: req.url!, ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}) }); res.end('verified backend'); });
  backend.listen(0, '127.0.0.1'); await new Promise<void>(done => backend.once('listening', done));
  const address = backend.address(); assert.ok(address && typeof address !== 'string');
  const digest = createHash('sha256').update('instructor:local-test-credential').digest('hex');
  const gateway = createRecordingGateway({ credentialSha256: digest, backendPort: address.port, publicOrigin: 'https://recording.example' });
  gateway.listen(0, '127.0.0.1'); await new Promise<void>(done => gateway.once('listening', done));
  const gateAddress = gateway.address(); assert.ok(gateAddress && typeof gateAddress !== 'string');
  const origin = 'http://127.0.0.1:' + gateAddress.port;
  try {
    assert.equal((await fetch(origin)).status, 401);
    assert.equal((await fetch(origin, { headers: { Authorization: 'Basic ' + Buffer.from('wrong:password').toString('base64') } })).status, 401);
    assert.equal(received.length, 0);
    const valid = await fetch(origin + '/course', { headers: { Authorization: 'Basic ' + Buffer.from('instructor:local-test-credential').toString('base64') } });
    assert.equal(valid.status, 200); assert.equal(await valid.text(), 'verified backend');
    assert.deepEqual(received, [{ path: '/course' }]);
    assert.equal((await fetch(origin + '/course', { headers: { Authorization: 'Basic ' + Buffer.from('instructor:local-test-credential').toString('base64'), Origin: 'https://attacker.example' } })).status, 403);
    assert.equal(received.length, 1);
    assert.equal((await fetch(origin + '/api/health')).status, 200);
    assert.equal((await fetch(origin + '/api/ai-tutor/status')).status, 401);
    assert.equal(received.length, 2);
  } finally {
    gateway.closeAllConnections(); backend.closeAllConnections();
    await Promise.all([new Promise<void>(done => gateway.close(() => done())), new Promise<void>(done => backend.close(() => done()))]);
  }
});

test('recording gateway fails closed without a valid digest', () => {
  for (const value of ['', undefined, '*', 'invalid']) assert.throws(() => createRecordingGateway({ credentialSha256: value, backendPort: 8081 }));
});
