import { createServer } from 'node:http';
import { z } from 'zod';

const requestSchema = z.strictObject({ jsonrpc: z.literal('2.0'), id: z.union([z.string(), z.number()]), method: z.enum([
  'tools/list', 'resources/list', 'resources/templates/list', 'prompts/list', 'resources/read', 'prompts/get']),
  params: z.record(z.string(), z.unknown()).optional() });
const resource = { uri: 'lab43://observations/v1', name: 'Fictional observations v1', mimeType: 'text/plain' };
const template = { uriTemplate: 'lab43://observations/{version}', name: 'Fictional observations by version', mimeType: 'text/plain' };
const prompt = { name: 'summarize-observations', description: 'Summarize a fictional observation resource.' };
export async function startLab43McpServer(checkToken: (value: string) => boolean) {
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('Content-Type', 'application/json');
    const deny = (code: number, message: string) => { response.statusCode = code; response.end(JSON.stringify({ error: message })); };
    if (request.method !== 'POST' || request.url !== '/mcp' || typeof request.headers.authorization !== 'string' ||
      !request.headers.authorization.startsWith('Bearer ') || !checkToken(request.headers.authorization.slice(7))) {
      deny(403, 'Authorization required.'); return; }
    let body = ''; for await (const chunk of request) { body += String(chunk); if (body.length > 2048) { deny(413, 'MCP request too large.'); return; } }
    let decoded: unknown; try { decoded = JSON.parse(body); } catch { deny(400, 'Invalid MCP JSON.'); return; }
    const parsed = requestSchema.safeParse(decoded); if (!parsed.success) { deny(400, 'Invalid MCP request.'); return; }
    const { id, method, params } = parsed.data; let result: unknown;
    if (method === 'tools/list') result = { tools: [{ name: 'read_approved_resource', description: 'Read one host-allowlisted resource.', inputSchema: { type: 'object', properties: { uri: { type: 'string' } }, required: ['uri'], additionalProperties: false } }] };
    else if (method === 'resources/list') result = { resources: [resource] };
    else if (method === 'resources/templates/list') result = { resourceTemplates: [template] };
    else if (method === 'prompts/list') result = { prompts: [prompt] };
    else if (method === 'prompts/get') result = params?.name === prompt.name ? { description: prompt.description, messages: [{ role: 'user', content: { type: 'text', text: 'Summarize the fictional observation data.' } }] } : null;
    else if (method === 'resources/read') result = params?.uri === resource.uri || params?.uri === 'lab43://observations/v2' ?
      { contents: [{ uri: params.uri, mimeType: 'text/plain', text: params.uri === resource.uri ? 'Aurora Finch count: 3.' : 'Aurora Finch count: 4.' }] } : null;
    if (result === null) { deny(404, 'Unknown approved MCP resource or prompt.'); return; }
    response.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No loopback port.');
  return { url: `http://127.0.0.1:${address.port}/mcp`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}
