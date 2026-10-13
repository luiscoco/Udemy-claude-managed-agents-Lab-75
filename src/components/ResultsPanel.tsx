import type { RunSnapshot } from '../../shared/contracts';
import { CodeBlock } from './CodeBlock';
import { MessageLog } from './MessageLog';
export function ResultsPanel({ snapshot }: { snapshot: RunSnapshot }) {
  return <section aria-label="Run results"><h2>Run results</h2><p>Run ID: {snapshot.runId}</p><p>Outcome: {snapshot.outcome?.status ?? snapshot.status}</p>
    {snapshot.outcome?.status === 'succeeded' && <CodeBlock label="Typed final output" lineNumbers={false} code={JSON.stringify(snapshot.outcome.result, null, 2)} />}
    <MessageLog events={snapshot.events} />
    <details><summary>Raw JSON: events and terminal outcome</summary><CodeBlock label="Run JSON" lineNumbers={false} code={JSON.stringify({ events: snapshot.events.slice(-16), outcome: snapshot.outcome }, null, 2)} /></details>
    <details><summary>Raw authored fixture evidence</summary><CodeBlock label="Fixture evidence JSON" lineNumbers={false} code={JSON.stringify(snapshot.evidence.slice(-8), null, 2)} /></details>
  </section>;
}
