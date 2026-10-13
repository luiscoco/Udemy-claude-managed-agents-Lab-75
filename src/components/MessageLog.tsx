import type { BrowserEvent } from '../../shared/contracts';
import { redact } from '../lib/presentation';
export function MessageLog({ events, limit = 16 }: { events: readonly BrowserEvent[]; limit?: number }) {
  const retained = events.slice(-Math.max(1, Math.min(limit, 100)));
  return <div className="message-log"><h3>Message log</h3><p>{retained.length} retained events (limit {Math.max(1, Math.min(limit, 100))}).</p>
    <ol start={retained[0]?.seq ?? 1}>{retained.map((event) => <li key={`${event.runId}-${event.seq}`}><strong>{event.type}</strong><p>{redact(event.type === 'output' ? event.payload.text : JSON.stringify(event.payload))}</p></li>)}</ol>
  </div>;
}
