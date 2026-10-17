import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { Lab44Telemetry } from '../server/lib/lab44-telemetry.js';
if (process.argv[2] !== '--execute-approved-azure-test') throw new Error('Explicit Azure ingestion test flag required.');
const manager = new Lab44Telemetry(), owner = `azure-smoke-${crypto.randomUUID()}`;
try {
  assert.equal(manager.facts().azureSetup.ready, true, 'Azure monitoring setup is incomplete.');
  const run = await manager.run(owner, 'successful-tool'), result = await manager.exportAzure(owner, run.runId);
  const evidence = { at: new Date().toISOString(), source: 'azure-monitor-exporter', runId: run.runId, traceId: run.hostSpans[0]!.traceId, result,
    dataSource: 'authored-fixture', anthropicCalls: 0, note: 'Exporter acceptance is not proof of query visibility, a genuine provider trace or final billing.' };
  await mkdir('artifacts/course', { recursive: true }); await writeFile('artifacts/course/azure-monitor-live.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence));
} finally { await manager.close(); }
