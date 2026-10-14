import { createInterface } from 'node:readline';

// A deliberately small MCP 2025-11-25 server. stdout is protocol-only.
const notes = [{ id: 'note_1', text: 'Three fictional Aurora Finches observed in calm weather.' }, { id: 'note_2', text: 'Record field observations offline, then sync the notebook.' }];
let initialized = false; let initializeReceived = false;
const send = packet => process.stdout.write(`${JSON.stringify(packet)}\n`);
const error = (id, code, message) => send({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', line => {
  if (Buffer.byteLength(line) > 16384) { error(null, -32600, 'Request exceeds server limit.'); return; }
  let request; try { request = JSON.parse(line); } catch { error(null, -32700, 'Invalid JSON.'); return; }
  if (!request || request.jsonrpc !== '2.0' || typeof request.method !== 'string') { error(request?.id, -32600, 'Invalid request.'); return; }
  if (request.method === 'notifications/initialized' && request.id === undefined) { if (initializeReceived) initialized = true; return; }
  if (request.id === undefined) return;
  if (!(typeof request.id === 'string' || Number.isSafeInteger(request.id))) { error(null, -32600, 'Invalid request ID.'); return; }
  let result;
  if (request.method === 'initialize') {
    if (request.params?.protocolVersion !== '2025-11-25') { error(request.id, -32602, 'Use protocol 2025-11-25.'); return; }
    initializeReceived = true; result = { protocolVersion: '2025-11-25', capabilities: { tools: {} }, serverInfo: { name: 'lab13-notes', version: '1.0.0' } };
  } else if (!initialized) { error(request.id, -32000, 'Initialize first.'); return; }
  else if (request.method === 'tools/list') result = { tools: [
    { name: 'list_notes', description: 'List fictional observation notes.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'read_note', description: 'Read a fictional note.', inputSchema: { type: 'object', properties: { id: { type: 'string', enum: ['note_1', 'note_2'] } }, required: ['id'], additionalProperties: false } },
  ] };
  else if (request.method === 'tools/call') {
    const name = request.params?.name; const args = request.params?.arguments;
    const valid = args && typeof args === 'object' && !Array.isArray(args);
    const value = valid && name === 'list_notes' && Object.keys(args).length === 0 ? notes
      : valid && name === 'read_note' && Object.keys(args).length === 1 && notes.some(note => note.id === args.id) ? notes.find(note => note.id === args.id) : null;
    result = { content: [{ type: 'text', text: JSON.stringify(value ?? { error: 'Unknown tool or invalid arguments.' }) }], isError: value === null };
  } else if (request.method === 'ping') result = {};
  else { error(request.id, -32601, 'Method not found.'); return; }
  send({ jsonrpc: '2.0', id: request.id, result });
});
