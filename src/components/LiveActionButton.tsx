import { useEffect, useId, useRef, useState } from 'react';

// checkAvailability must only read setup state. It is deliberately separate from onRun.
export function LiveActionButton({ busy, available, checkAvailability, onRun, setup, keyIsolated = false, blockedReason }: {
  busy: boolean; available: boolean; checkAvailability: () => Promise<boolean>; onRun: () => void;
  setup: string; keyIsolated?: boolean; blockedReason?: string;
}) {
  const id = useId(); const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false); const [checking, setChecking] = useState(false);
  const [ready, setReady] = useState(available); const [status, setStatus] = useState('');
  useEffect(() => { setReady(available); }, [available]);
  async function check() {
    setChecking(true);
    try { const result = await checkAvailability(); setReady(result); setStatus(result ? 'Setup is ready. Choose Run live to start.' : 'Setup is still unavailable. Follow the instructions above.'); }
    catch { setStatus('Could not check setup. Check the local API server and try again.'); }
    finally { setChecking(false); }
  }
  return <div><button type="button" disabled={busy || Boolean(blockedReason)} aria-describedby={`${id}-availability`} aria-expanded={open} aria-controls={`${id}-setup`}
    onClick={() => { if (ready) onRun(); else { setOpen(true); requestAnimationFrame(() => panel.current?.focus()); } }}>Run live</button>
    <p id={`${id}-availability`}>{busy ? 'A run is in progress.' : blockedReason ?? (ready ? 'Live setup is ready.' : 'Live setup unavailable. Open setup instructions.')}</p>
    {open && <div className="setup-panel" id={`${id}-setup`} role="region" aria-labelledby={`${id}-heading`} ref={panel} tabIndex={-1}>
      <h3 id={`${id}-heading`}>Live setup instructions</h3><p>{setup}</p>{keyIsolated && <p>A CLI login is not used. This lab requires its isolated API key on the server.</p>}
      <button type="button" disabled={checking} onClick={() => void check()}>{checking ? 'Checking…' : 'Check again'}</button><p role="status">{status}</p>
    </div>}
  </div>;
}
