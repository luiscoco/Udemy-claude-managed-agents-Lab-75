import { createServer } from 'node:http';

export function createTutorServer() {
  return createServer(async (request, response) => {
    const fail = (status: number) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: status })); };
    if (request.url !== '/ask') { fail(404); return; }
    if (request.method !== 'POST') { fail(405); return; }
    if (request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') { fail(415); return; }
    let size = 0; const chunks: Buffer[] = [];
    try {
      for await (const chunk of request) { const bytes = Buffer.from(chunk); size += bytes.length; if (size <= 1024) chunks.push(bytes); }
      if (size > 1024) { fail(413); return; }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.trim().length > 200) { fail(400); return; }
      if (response.destroyed) return;
      response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' });
      for (const [event, data] of [['started', { accepted: true }], ['answer', { text: `You asked: ${body.prompt.trim()}` }], ['done', { outcome: 'completed' }]]) {
        if (response.destroyed) return;
        response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
      response.end();
    } catch { if (!response.destroyed && !response.headersSent) fail(400); else if (!response.destroyed) response.end(); }
  });
}
