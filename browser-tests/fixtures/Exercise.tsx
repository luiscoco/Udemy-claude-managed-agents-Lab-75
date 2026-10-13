import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { streamPost } from '../../src/lib/sse';
import { LiveActionButton } from '../../src/components/LiveActionButton';
export default function Exercise() {
  const [text, setText] = useState('test');
  const [status, setStatus] = useState('Ready.');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function run() {
    if (!text.trim()) { setStatus('Enter test text.'); return; }
    const request = new AbortController(); controller.current = request; setBusy(true); setStatus('Running.');
    try {
      const result = await streamPost('/api/framework-test/stream', { text }, {
        signal: request.signal, idleMs: 5000, deadlineMs: 10000, resultSchema: z.object({ output: z.string() }),
      });
      setStatus(result.kind === 'success' ? result.result.output : 'Cancelled.');
    } catch { setStatus(request.signal.aborted ? 'Cancelled.' : 'Failed.'); }
    finally { setBusy(false); controller.current = null; }
  }
  return <section><label htmlFor="test-text">Test text</label><input id="test-text" value={text} onChange={event => setText(event.target.value)} />
    <button disabled={busy} onClick={() => void run()}>Run test</button>{busy && <button onClick={() => controller.current?.abort()}>Cancel</button>}
    <p role="status">{status}</p>
    <LiveActionButton busy={busy} available={false} checkAvailability={async () => false} onRun={() => {}} setup="Test setup is unavailable." />
  </section>;
}
