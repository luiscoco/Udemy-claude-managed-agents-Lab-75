// Lab 29 live demo: a real Files API upload, a session file mount, and one turn with an inline image block.
// Run from the repo root: node --env-file=.env --import tsx _live29.ts
// Billed: one session, one short user turn, read tool only. The session is archived and the file deleted in `finally`.
// Uploads ONLY the fictional fixture fixtures/lab29/observation.txt; the inline image is fixtures/lab29/aurora-finch.png.
import { readFile } from 'node:fs/promises';
import Anthropic, { toFile } from '@anthropic-ai/sdk';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000 });
const sessions = client.beta.sessions;
const deadline = new AbortController(); const timer = setTimeout(() => deadline.abort(), 120_000);
const log = (line: string) => console.log(line);
const why = (error: unknown) => error instanceof Anthropic.APIError
  ? `${error.status} ${error.constructor.name} (${error.type ?? 'error'})` : error instanceof Error ? error.message : String(error);
const mountPath = '/mnt/session/uploads/lab29/observation.txt';

let fileId: string | undefined, sessionId: string | undefined, closeStream = () => {};
const sessionCopies: string[] = [];
try {
  const text = await readFile('fixtures/lab29/observation.txt');
  const png = await readFile('fixtures/lab29/aurora-finch.png');
  const file = await client.beta.files.upload({ file: await toFile(text, 'observation.txt', { type: 'text/plain' }) });
  fileId = file.id;
  log(`Uploaded ${file.filename}: ${file.id} · ${file.size_bytes} bytes · ${file.mime_type}`);

  const agent = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: agent.id, version: agent.version,
    tools: [{ type: 'agent_toolset_20260401', default_config: { enabled: false, permission_policy: { type: 'always_allow' } },
      configs: [{ name: 'read', enabled: true, permission_policy: { type: 'always_allow' } }] }], mcp_servers: [], skills: [],
    system: 'Answer briefly. Use the read tool for mounted files; quote only what you actually read.' },
    environment_id: environmentId, title: 'Lab 29 live file mount',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
    resources: [{ type: 'file', file_id: file.id, mount_path: mountPath }] }, { timeout: 10000 });
  sessionId = session.id;
  log(`Session ${session.id} created · status ${session.status} · tools: read only`);
  const resources = await sessions.resources.list(session.id, { limit: 10 }, { timeout: 5000 });
  for (const r of resources.data) if (r.type === 'file') { log(`Resource listed: file ${r.file_id} → ${r.mount_path}`); if (r.file_id !== file.id) sessionCopies.push(r.file_id); }

  const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
  closeStream = () => stream.controller.abort();
  await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [
    { type: 'text', text: `Read the mounted file ${mountPath} and quote its Count line exactly. `
      + 'Then describe the attached image in at most eight words. Reply in two short lines.' },
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: png.toString('base64') } }] }] },
    { signal: deadline.signal, timeout: 10000 });
  log(`user.message sent: 1 text block + 1 inline image block (base64, ${png.length} bytes)`);

  let started = false, reply = ''; const reads: string[] = [];
  for await (const event of stream) {
    if (event.type === 'session.status_running') started = true;
    if (event.type === 'agent.tool_use') { started = true; reads.push(`${event.name} ${String(event.input.file_path ?? event.input.path ?? '')}`.trim()); }
    if (event.type === 'agent.message') { started = true; reply += event.content.flatMap(b => b.type === 'text' ? [b.text] : []).join('\n'); }
    if (event.type === 'session.status_terminated') throw new Error('Session terminated during the turn.');
    if (event.type === 'session.status_idle' && started) { log(`Turn finished → status idle · stop ${event.stop_reason.type}`); break; }
  }
  for (const r of reads) log(`agent.tool_use: ${r}`);
  for (const line of reply.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 4))
    log(`  Agent: ${line.length > 96 ? line.slice(0, 93) + '...' : line}`);
  const usage = (await sessions.retrieve(session.id, {}, { timeout: 5000 })).usage;
  log(`Usage: ${usage.input_tokens ?? 0} input, ${usage.output_tokens ?? 0} output tokens`);
} catch (error) {
  log(`Live run failed: ${why(error)}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer); closeStream();
  if (sessionId) {
    try { await sessions.archive(sessionId, {}, { timeout: 10000 });
      const archived = await sessions.retrieve(sessionId, {}, { timeout: 5000 });
      log(`Session archived: ${archived.archived_at ? 'yes' : 'no'}`);
    } catch (error) { log(`Archive failed for ${sessionId}: ${why(error)}`); }
  }
  if (fileId) {
    try { await client.beta.files.delete(fileId, {}, { timeout: 10000 }); log('File deleted: yes');
      try { await client.beta.files.retrieveMetadata(fileId, {}, { timeout: 5000 }); log('Metadata after delete → still returned'); }
      catch (error) { log(`Metadata after delete → ${why(error)}`); }
    } catch (error) { log(`File delete failed for ${fileId}: ${why(error)}`); }
  }
  // The session mounts its own copy of the upload, which outlives archiving; delete it too (silently,
  // so the output matches the recorded transcript).
  for (const copy of sessionCopies) {
    try { await client.beta.files.delete(copy, {}, { timeout: 10000 }); }
    catch (error) { log(`Session copy delete failed for ${copy}: ${why(error)}`); }
  }
}
