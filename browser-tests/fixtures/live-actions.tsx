import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { LiveActionButton } from '../../src/components/LiveActionButton';
function ReadOnlyFixture() {
  const [busy, setBusy] = useState(false);
  return <LiveActionButton busy={busy} available={false} keyIsolated setup="Configure the isolated fixture key on the server."
    checkAvailability={async () => { const response = await fetch('/api/read-only-fixture/availability'); if (!response.ok) throw new Error('Unavailable'); return Boolean((await response.json()).ready); }}
    onRun={() => { setBusy(true); void fetch('/api/read-only-fixture/run', { method: 'POST' }).finally(() => setBusy(false)); }} />;
}
createRoot(document.getElementById('root')!).render(<ReadOnlyFixture />);
