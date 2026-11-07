// Lab 28 live demo: real API error classes, the SDK retry policy, and reconciliation of an uncertain create.
// No model turn: one session is created (no message sent) and archived. Run from the repo root:
// node --env-file=.env --import tsx _live28.ts
import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'node:crypto';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID in .env.');

// Count real HTTP attempts so the output proves whether the SDK retried.
let attempts = 0;
const countingFetch: typeof fetch = (input, init) => { attempts++; return fetch(input, init); };
const reads = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 15000, fetch: countingFetch }); // SDK default maxRetries
const writes = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 15000, maxRetries: 0, fetch: countingFetch });
const badKey = new Anthropic({ apiKey: 'sk-ant-invalid-demo', authToken: null, timeout: 15000, fetch: countingFetch });
const sdkRetries = (status: number) => status === 408 || status === 409 || status === 429 || status >= 500;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function expectError(label: string, call: () => Promise<unknown>) {
  attempts = 0;
  try { await call(); console.log(`${label} → unexpectedly succeeded`); return null; }
  catch (error) {
    if (!(error instanceof Anthropic.APIError) || error.status === undefined) { console.log(`${label} → ${String(error)}`); return null; }
    console.log(`${label} → ${error.status} ${error.constructor.name} · HTTP attempts ${attempts} · `
      + `${sdkRetries(error.status) ? 'retryable' : 'not retryable'}`);
    return error;
  }
}

let createdId: string | undefined, archived = false;
try {
  console.log(`SDK retry policy: maxRetries ${reads.maxRetries} by default · retries 408, 409, 429, 5xx, connection errors`);
  console.log(`Side-effecting client: maxRetries ${writes.maxRetries} (create, send, result, interrupt)`);

  // A well-formed but unknown ID (a malformed ID returns 400 instead).
  await expectError('Retrieve unknown session', () => reads.beta.sessions.retrieve('sesn_01Lab28NoSuchSessionXYZq'));
  await expectError('Invalid API key', () => badKey.beta.sessions.list({ limit: 1 }));
  await expectError('Create with 17 metadata keys', () => writes.beta.sessions.create({
    agent: agentId, environment_id: environmentId, title: 'Lab 28 invalid request',
    metadata: Object.fromEntries(Array.from({ length: 17 }, (_, i) => [`k${i}`, 'x'])) })
    .then(s => { createdId = s.id; return s; }));
  if (createdId) { await writes.beta.sessions.archive(createdId); createdId = undefined; }

  // An uncertain create: the request is sent once, then we act as if the response was lost.
  const requestId = randomUUID();
  const since = new Date(Date.now() - 60_000).toISOString();
  attempts = 0;
  const lost = await writes.beta.sessions.create({ agent: agentId, environment_id: environmentId,
    title: 'Aurora Finch field notes (Lab 28)', metadata: { lab: '28', lab28_request_id: requestId } });
  createdId = lost.id; // kept only for cleanup in finally; reconciliation below does not use it
  console.log(`Create sent once (HTTP attempts ${attempts}) · lab28_request_id ${requestId.slice(0, 8)}…`);
  console.log('Response treated as lost: no session ID observed · do not resend create');

  let matches: Anthropic.Beta.Sessions.BetaManagedAgentsSession[] = [];
  for (let i = 0; i < 6 && matches.length === 0; i++) {
    if (i) await sleep(1000);
    const page = await reads.beta.sessions.list({ 'created_at[gte]': since, limit: 50 });
    matches = page.data.filter(s => s.metadata?.lab28_request_id === requestId);
    console.log(`List sessions created since ${since.slice(11, 19)}Z → ${page.data.length} listed, ${matches.length} match`);
  }
  if (matches.length === 1) {
    console.log(`Reconciled: found 1, no duplicate create → ${matches[0].id} · status ${matches[0].status}`);
    console.log(`Same session as the lost response: ${matches[0].id === lost.id ? 'yes' : 'no'}`);
  } else console.log(`Reconcile failed: ${matches.length} matches · quarantine the attempt`);

  await writes.beta.sessions.archive(lost.id);
  archived = true;
  const final = await reads.beta.sessions.retrieve(lost.id);
  console.log(`Archived: ${final.archived_at ? 'yes' : 'no'} · no message sent, so no model turn`);
} catch (error) {
  console.log(`Live run failed: ${error instanceof Anthropic.APIError ? `${error.status} ${error.constructor.name}` : String(error)}`);
  process.exitCode = 1;
} finally {
  if (createdId && !archived) { try { await writes.beta.sessions.archive(createdId); console.log('Cleanup: archived'); } catch { console.log('Cleanup: archive failed'); } }
}
