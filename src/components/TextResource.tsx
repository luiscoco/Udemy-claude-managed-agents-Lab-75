import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { TextLoader } from '../lessons/catalog';

export function TextResource({ load, label, children }: { load: TextLoader; label: string; children: (text: string) => ReactNode }) {
  const [state, setState] = useState<{ text?: string; error?: boolean }>({});
  useEffect(() => {
    let alive = true; setState({});
    void Promise.resolve().then(load).then((text) => { if (alive) setState({ text }); }, () => { if (alive) setState({ error: true }); });
    return () => { alive = false; };
  }, [load]);
  if (state.error) return <div role="alert"><p>{label} could not load. Retry refreshes the page to recover cached module failures.</p><button onClick={() => {
    try { sessionStorage.setItem('lesson-resource-retry', label); } catch { /* Storage is optional. */ }
    window.location.reload();
  }}>Retry loading {label}</button></div>;
  if (state.text === undefined) return <p role="status">Loading {label}…</p>;
  if (!state.text.trim()) return <p role="status">{label} is empty.</p>;
  return children(state.text);
}
