// Fixed authored host worker. Stdout is JSON protocol; stderr is private diagnostics.
import { createInterface } from 'node:readline';
for await (const line of createInterface({ input: process.stdin })) {
  let request; try { request = JSON.parse(line); } catch { process.exit(2); }
  if (request.op !== 'format-note') process.exit(2);
  process.stdout.write(`${JSON.stringify({ requestId: request.requestId, accepted: true })}\n`);
  process.stderr.write('private fixture diagnostic: worker-format-failed\n');
  process.exit(7);
}
