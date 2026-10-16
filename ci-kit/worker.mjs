import { createFixturePort, createLiveLab01Port } from '../server/lib/lab01-port.ts';
import { runLab01 } from '../server/lib/lab01-run.ts';
import { lab49ReportSchema } from '../shared/lab49-deploy-ci-headless.ts';
import { Lab49Headless } from '../server/lib/lab49-headless.ts';

const mode = process.argv[2] ?? 'scripted';
const scenario = process.argv[3] ?? 'pass';
const controller = new AbortController();
process.once('SIGTERM', () => controller.abort('SIGTERM'));
process.once('SIGINT', () => controller.abort('SIGINT'));
process.on('message', message => { if (message?.type === 'stop') controller.abort('host-stop'); });
let output;
try {
  if (mode === 'scripted') {
    if (scenario === 'sigterm') {
      const result = await runLab01({ mode: 'scripted', prompt: 'Wait for host termination.',
        port: createFixturePort('cancel', 20), signal: controller.signal, deadlineMs: 120000,
        cleanupWaitMs: 1000, emit: () => {} });
      output = { source: 'authored-headless-fixture', scenario, outcome: 'cancelled', exitCode: 3,
        sessionId: result.sessionId, report: null, interruption: result.interruption, cleanup: result.cleanup,
        providerCalls: 0, evidence: [result.outcome.kind, 'Host SIGTERM interrupted the waiting worker fixture.'] };
    } else output = await new Lab49Headless().run(scenario, controller.signal);
  } else if (mode === 'live') {
    if (process.env.CI_MANAGED_LIVE_OPT_IN !== 'true' || process.env.MANAGED_LIVE_ENABLED !== 'true')
      throw new Error('Live CI needs explicit CI_MANAGED_LIVE_OPT_IN=true and MANAGED_LIVE_ENABLED=true.');
    if (scenario !== 'pass') throw new Error('Live CI accepts only the single bounded pass scenario.');
    const port = createLiveLab01Port(undefined, process.env);
    const result = await runLab01({ mode: 'live', prompt: 'Return only JSON with task "ci-check", verdict "pass" or "fail", and a short summary.',
      port, signal: controller.signal, deadlineMs: Math.min(Number(process.env.MANAGED_DEADLINE_MS ?? 3000), 120000),
      cleanupWaitMs: 5000, emit: () => {} });
    const raw = result.messages.at(-1)?.text ?? '';
    let report = null; try { report = lab49ReportSchema.parse(JSON.parse(raw)); } catch {}
    const passed = result.outcome.kind === 'completed' && result.cleanup === 'archived' && result.messages.length === 1 && report?.verdict === 'pass';
    output = { source: 'managed-api', outcome: passed ? 'pass' : 'validation-or-execution-failed', exitCode: passed ? 0 : 2,
      sessionId: result.sessionId, report, interruption: result.interruption, cleanup: result.cleanup,
      evidence: [result.outcome.kind, result.outcome.stopReason, `messages:${result.messages.length}`] };
  } else throw new Error('Mode must be scripted or live.');
} catch (error) {
  output = { source: 'host-worker', outcome: 'execution-error', exitCode: 2, sessionId: null, report: null,
    interruption: controller.signal.aborted ? 'unconfirmed' : 'not-needed', cleanup: controller.signal.aborted ? 'pending' : 'not-needed',
    evidence: [mode === 'live' ? 'Live setup or worker failed; inspect server-side diagnostics.' :
      error instanceof Error ? error.message.slice(0, 240) : 'Unknown host error.'] };
}
process.stdout.write(`${JSON.stringify(output)}\n`);
process.disconnect?.();
process.exitCode = output.exitCode;
