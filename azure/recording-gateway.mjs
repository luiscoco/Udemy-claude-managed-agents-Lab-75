/** Temporary recording access: HTTPS terminates at Azure; credentials stay private. */
import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const hopHeaders = ['connection', 'proxy-connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'http2-settings'];
export function createRecordingGateway({ credentialSha256, backendPort, publicOrigin }) {
  if (!/^[a-f0-9]{64}$/.test(credentialSha256 ?? '')) throw Error('A valid recording credential digest is required.');
  if (!Number.isInteger(backendPort) || backendPort < 1024 || backendPort > 65535) throw Error('Invalid backend port.');
  const expected = Buffer.from(credentialSha256, 'hex');
  return http.createServer({ requestTimeout: 120000, headersTimeout: 10000 }, (request, response) => {
    const health = request.method === 'GET' && request.url?.split('?')[0] === '/api/health';
    const authorization = request.headers.authorization ?? '';
    let authorized = false;
    if (authorization.startsWith('Basic ') && authorization.length < 1024) {
      const credentials = Buffer.from(authorization.slice(6), 'base64');
      authorized = timingSafeEqual(createHash('sha256').update(credentials).digest(), expected);
    }
    if (!health && !authorized) {
      response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Learning Platform Recording", charset="UTF-8"', 'Cache-Control': 'no-store' });
      response.end('Recording access credentials required.'); return;
    }
    if (!health && request.headers.origin && request.headers.origin !== publicOrigin) {
      response.writeHead(403, { 'Cache-Control': 'no-store' }); response.end('Use the configured learning application origin.'); return;
    }
    if (!request.url?.startsWith('/')) { response.writeHead(400); response.end(); return; }
    const headers = { ...request.headers };
    for (const name of [...hopHeaders, 'authorization', 'proxy-authorization']) delete headers[name];
    // Validate the browser origin above, then preserve the local backend contract.
    headers.host = '127.0.0.1:' + backendPort;
    if (headers.origin) headers.origin = 'http://' + headers.host;
    const upstream = http.request({ hostname: '127.0.0.1', port: backendPort, path: request.url, method: request.method, headers }, incoming => {
      const outgoing = { ...incoming.headers };
      for (const name of hopHeaders) delete outgoing[name];
      response.writeHead(incoming.statusCode ?? 502, outgoing); incoming.pipe(response);
      incoming.on('error', () => response.destroy());
    });
    upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end('Application is starting or unavailable.'); });
    request.on('aborted', () => upstream.destroy());
    response.on('close', () => { if (!response.writableEnded) upstream.destroy(); });
    request.pipe(upstream);
  });
}

if (process.env.LEARNING_RECORDING_GATEWAY === 'true') {
  const publicOrigin = process.env.LEARNING_PUBLIC_ORIGIN;
  if (!publicOrigin || new URL(publicOrigin).protocol !== 'https:' || new URL(publicOrigin).origin !== publicOrigin) throw Error('An exact HTTPS public origin is required.');
  const gateway = createRecordingGateway({ credentialSha256: process.env.LEARNING_ACCESS_SHA256, backendPort: 8081, publicOrigin });
  // ACR source packing can omit .gitignore files that the starter ZIP manifest needs.
  const encoded = process.env.LEARNING_STARTER_SOURCE_BASE64 ?? '';
  if (encoded.length > 20000) throw Error('Oversized teaching source payload.');
  const teachingFiles = encoded ? JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) : [];
  if (!Array.isArray(teachingFiles) || teachingFiles.length > 3) throw Error('Invalid teaching source payload.');
  for (const file of teachingFiles) {
    if (!/^mini-projects\/(study-coach|agent-evaluation-studio|agent-publishing-studio)\/\.gitignore$/.test(file.path) || typeof file.content !== 'string' || file.content.length > 4000) throw Error('Unexpected teaching source file.');
    if (!existsSync(file.path)) writeFileSync(file.path, file.content, { flag: 'wx' });
  }
  const backend = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    env: { ...process.env, LEARNING_API_PORT: '8081', LEARNING_HOST: '127.0.0.1' }, stdio: 'inherit',
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return; stopping = true; gateway.close(); backend.kill('SIGTERM');
    const timer = setTimeout(() => { gateway.closeAllConnections(); backend.kill('SIGKILL'); }, 10000); timer.unref();
  };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
  backend.once('error', () => { process.exitCode = 1; stop(); });
  backend.once('exit', code => { gateway.close(); if (!stopping) process.exitCode = code || 1; });
  gateway.listen(8080, '0.0.0.0', () => console.log('Password-protected recording gateway ready on port 8080.'));
}
