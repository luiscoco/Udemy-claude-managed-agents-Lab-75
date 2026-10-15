// Isolated authored policy worker. It receives a fixed action and emits one JSON line.
import { createInterface } from 'node:readline';
for await (const line of createInterface({ input: process.stdin })) {
  let request; try { request = JSON.parse(line); } catch { process.exit(2); }
  if (request.tool !== 'Write' || typeof request.path !== 'string') process.exit(2);
  if (request.scenario === 'timeout') await new Promise(resolve => setTimeout(resolve, 60000));
  else if (request.scenario === 'malformed') process.stdout.write('{"decision":"maybe","rewritePath":"/outside"}\n');
  else process.stdout.write(`${JSON.stringify({ decision: request.scenario === 'deny' ? 'deny' : 'allow',
    reason: request.scenario === 'deny' ? 'External fixture policy denies the action.' : 'External fixture policy allows the action.' })}\n`);
  if (request.scenario !== 'timeout') process.exit(0);
}
