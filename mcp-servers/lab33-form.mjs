// Small local JSON-RPC MCP fixture. Its stdout carries protocol messages only.
import { createInterface } from 'node:readline';
const send = value => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', ...value })}\n`);
let waiting = null;
for await (const line of createInterface({ input: process.stdin })) {
  if (line.length > 8192) process.exit(1);
  let packet; try { packet = JSON.parse(line); } catch { process.exit(1); }
  if (packet.method === 'initialize') send({ id: packet.id, result: { protocolVersion: '2025-06-18',
    capabilities: { tools: {} }, serverInfo: { name: 'lab33-local-form', version: '1.0.0' } } });
  else if (packet.method === 'notifications/initialized') continue;
  else if (packet.method === 'tools/list') send({ id: packet.id, result: { tools: [{ name: 'collect_field_note',
    description: 'Collect a fictional dated observation quantity.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }] } });
  else if (packet.method === 'tools/call' && packet.params?.name === 'collect_field_note' && !waiting) {
    waiting = packet.id;
    send({ id: 33, method: 'elicitation/create', params: { message: 'Choose a fictional observation date and quantity (1–10).',
      requestedSchema: { type: 'object', properties: { date: { type: 'string', format: 'date' }, quantity: { type: 'integer', minimum: 1, maximum: 10 } },
        required: ['date', 'quantity'], additionalProperties: false } } });
  } else if (packet.id === 33 && waiting !== null) {
    const action = packet.result?.action; const content = packet.result?.content;
    const valid = action === 'accept' && content && typeof content.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(content.date)
      && Number.isInteger(content.quantity) && content.quantity >= 1 && content.quantity <= 10;
    send({ id: waiting, result: { content: [{ type: 'text', text: valid ? `Recorded fictional field note: ${content.date}, quantity ${content.quantity}.`
      : action === 'decline' ? 'Human declined the form.' : 'Invalid elicitation response.' }], isError: !valid } });
    waiting = null;
  } else if (packet.id !== undefined) send({ id: packet.id, error: { code: -32601, message: 'Unsupported method.' } });
}
