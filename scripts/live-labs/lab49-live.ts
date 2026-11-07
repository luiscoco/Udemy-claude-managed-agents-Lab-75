// One real headless turn, checked by the lab's closed report schema. No deployment.
import { lab49ReportSchema } from '../../shared/lab49-deploy-ci-headless.js';
import { Lab49Headless } from '../../server/lib/lab49-headless.js';
import { demo, textOf } from './session-demo.js';

const host = new Lab49Headless();
const baseline = await host.run('pass'); host.close();
console.log(`Lab49Headless fixture: outcome ${baseline.outcome} · exit ${baseline.exitCode} · provider calls ${baseline.providerCalls}`);
console.log(`Headless process: stdin TTY ${Boolean(process.stdin.isTTY)} · browser not used · one message · zero tools`);
let verdict = 2;
await demo(49, 'Return exactly one JSON object, no markdown, with task "ci-check", verdict "pass" or "fail", '
  + 'and a short summary. Check only the fictional arithmetic given by the user. No tools.', async ({ turn }) => {
  const events = await turn('Fictional CI fixture: north 120 units, south 80 units, expected total 200. Check the arithmetic.');
  const raw = events.filter(e => e.type === 'agent.message').map(textOf).join('');
  let checked;
  try { checked = lab49ReportSchema.safeParse(JSON.parse(raw)); } catch { checked = undefined; }
  const toolCalls = events.filter(e => e.type === 'agent.custom_tool_use').length;
  const idle = events.findLast(e => e.type === 'session.status_idle');
  const terminalPass = checked?.success && checked.data.verdict === 'pass' && toolCalls === 0
    && idle?.type === 'session.status_idle' && idle.stop_reason.type === 'end_turn';
  verdict = terminalPass ? 0 : 2;
  console.log(`Real outcome: ${terminalPass ? 'pass' : 'validation-failed'} · closed report ${checked?.success ? 'valid' : 'invalid'} · tool calls ${toolCalls}`);
  if (checked?.success) console.log(`Validated report: ${JSON.stringify(checked.data)}`);
  console.log(`Host exit mapping: ${verdict} · unresolved approval cannot pass`);
  console.log('The live deadline is 180 seconds; the authored fixture deadline remains 3 seconds.');
});
if (process.exitCode) verdict = 2;
console.log(`CI process exit code: ${verdict} · no container or workflow deployed`);
process.exitCode = verdict;
