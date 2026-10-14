import { useEffect, useRef, useState } from 'react';
import { lab09ContextSchema, lab09Question, lab09RequestSchema, lab09ResultSchema, lab09VariantLabels, lab09Variants } from '../../shared/lab09-system-prompts';
import type { Lab09Result } from '../../shared/lab09-system-prompts';
import { LiveActionButton } from '../components/LiveActionButton';
import { CodeBlock } from '../components/CodeBlock';
import { request } from '../lib/api';
import { streamPost } from '../lib/sse';
import { redact } from '../lib/presentation';

export default function Concept09SystemPrompts() {
  const defaults = lab09RequestSchema.parse({ mode: 'scripted', variant: 'base', prompt: lab09Question, deadlineSeconds: 30 });
  const [variant, setVariant] = useState(defaults.variant); const [prompt, setPrompt] = useState(lab09Question);
  const [customSystem, setCustomSystem] = useState(defaults.customSystem); const [append, setAppend] = useState(defaults.append);
  const [context, setContext] = useState(''); const [results, setResults] = useState<Lab09Result[]>([]); const [pending, setPending] = useState(false);
  const [liveReady, setLiveReady] = useState(false); const [status, setStatus] = useState('Ready. Keep the user question fixed and compare fresh sessions.');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => { void request('/api/c9/context', lab09ContextSchema).then((value) => setContext(value.text)).catch(() => {});
    void fetch('/api/managed/setup').then((r) => r.json()).then((v: {liveReady?:boolean}) => setLiveReady(v.liveReady === true)).catch(() => {}); return () => controller.current?.abort(); }, []);
  async function run(mode: 'scripted' | 'live', compare = false) { if (pending) return; const abort = new AbortController(); controller.current = abort; setPending(true);
    try { for (const selected of compare ? lab09Variants : [variant]) { abort.signal.throwIfAborted(); const value = await streamPost('/api/c9/query',
        { mode, variant: selected, prompt, customSystem, append, contextId: 'aurora-finch-v1', deadlineSeconds: 30, budgetCents: 50 },
        { signal: abort.signal, idleMs: 25_000, deadlineMs: 60_000, resultSchema: lab09ResultSchema });
      if (value.kind !== 'success') { setStatus('Cancelled locally. Inspect the server cleanup evidence before assuming remote work stopped.'); break; }
      setResults((all) => [...all, value.result].slice(-12)); setStatus(`${lab09VariantLabels[selected]}: ${value.result.outcome.kind}. ${value.result.message}`); }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Comparison failed.'); } finally { controller.current = null; setPending(false); } }
  return <section aria-labelledby="c9-heading"><h2 id="c9-heading">Compose explicit system instructions</h2>
    <p>Choose an inherited base, a custom replacement, or the base plus explicit instructions or authored project context. Each run creates a fresh session and preserves the base agent model and version.</p>
    <fieldset disabled={pending}><legend>Instruction comparison</legend>
      <label htmlFor="c9-question">Fixed user question</label><textarea id="c9-question" value={prompt} maxLength={1000} onChange={(e) => setPrompt(e.target.value)} />
      <label htmlFor="c9-variant">System variant</label><select id="c9-variant" value={variant} onChange={(e) => setVariant(e.target.value as typeof variant)}>{lab09Variants.map((item) => <option key={item} value={item}>{lab09VariantLabels[item]}</option>)}</select>
      <label htmlFor="c9-custom">Custom replacement instructions</label><textarea id="c9-custom" value={customSystem} maxLength={2000} onChange={(e) => setCustomSystem(e.target.value)} />
      <label htmlFor="c9-append">Appended instructions</label><textarea id="c9-append" value={append} maxLength={1000} onChange={(e) => setAppend(e.target.value)} />
    </fieldset>
    <details><summary>Authored project context: fictional/CLAUDE.md</summary><p>The server explicitly selects aurora-finch-v1. It is authored teaching context; no file is loaded automatically.</p><pre>{context}</pre></details>
    <div className="lab-controls"><button disabled={pending} onClick={() => void run('scripted')}>Run offline variant</button><button disabled={pending} onClick={() => void run('scripted', true)}>Compare all offline variants</button>
      <button disabled={pending || !results.length} onClick={() => setResults([])}>Clear comparison</button>{pending && <button onClick={() => controller.current?.abort()}>Cancel query</button>}</div>
    <div className="lab-live"><LiveActionButton busy={pending} available={liveReady} keyIsolated setup={liveReady ? 'Live setup is ready. Run one selected variant in a billed fresh session.' : 'Live Managed setup is not ready.'} checkAvailability={async () => liveReady} onRun={() => void run('live')} /></div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    <h3>Fresh session comparisons</h3><p>Offline answers are authored examples. Only observed live model spans populate usage; these results make no quality or cost ranking.</p>
    {results.map((result, i) => <article key={`${result.sessionId}-${i}`} aria-label={`${lab09VariantLabels[result.requested.variant]} result`}>
      <h4>{lab09VariantLabels[result.requested.variant]}</h4><p>Source: {result.source}. Session: <code>{result.sessionId}</code>. Outcome: {result.outcome.kind}. Cleanup: {result.cleanup}.</p>
      <p>Question: {redact(result.requested.prompt)}</p><p>System override: {result.composition?.overrideIncluded ? 'explicit replacement' : 'omitted; inherited base'}.</p>
      <CodeBlock label="Requested composition and resolved settings" lineNumbers={false} code={JSON.stringify({ requested: result.composition, resolved: result.effective }, null, 2)} />
      {result.messages.map((message) => <pre key={message.eventId} style={{whiteSpace:'pre-wrap'}}>{redact(message.text)}</pre>)}
      <p>Usage: {result.reportedUsage ? `${result.reportedUsage.inputTokens} input tokens, ${result.reportedUsage.outputTokens} output tokens (${result.reportedUsage.scope})` : 'not reported'}. Interruption: {result.interruption}.</p>
    </article>)}
  </section>;
}
