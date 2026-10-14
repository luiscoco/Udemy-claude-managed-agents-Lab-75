import { useEffect, useRef, useState } from 'react';
import { lab11Variants, lab11Labels, lab11Scenarios, lab11Question, lab11CatalogSchema, lab11LoadResultSchema, lab11ResultSchema } from '../../shared/lab11-skills';
import type { Lab11Request, Lab11Result } from '../../shared/lab11-skills';
import type { z } from 'zod';
import { request } from '../lib/api';
import { streamPost } from '../lib/sse';
import { CodeBlock } from '../components/CodeBlock';
import { LiveActionButton } from '../components/LiveActionButton';
import { redact } from '../lib/presentation';

export default function Concept11Skills() {
  const [variant, setVariant] = useState<Lab11Request['variant']>('with-skill'); const [scenario, setScenario] = useState('reads');
  const [prompt, setPrompt] = useState(lab11Question); const [catalog, setCatalog] = useState<z.infer<typeof lab11CatalogSchema> | null>(null);
  const [preview, setPreview] = useState(''); const [results, setResults] = useState<Lab11Result[]>([]); const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('Ready. Offline comparisons use authored streams and never contact Anthropic.');
  const owner = useRef(crypto.randomUUID()); const controller = useRef<AbortController | null>(null);
  const revision = variant === 'revised-version' ? 'v2' : variant === 'absent-reference' ? 'missing-reference' : 'v1';
  const ready = Boolean(catalog?.liveReady && (variant === 'without-skill' || (variant !== 'missing-id' && catalog.configuredPins.find(p => p.revision === revision)?.matchesBundle)));
  async function refresh() { try { const value = await request('/api/c11/skills', lab11CatalogSchema); setCatalog(value); return value; } catch (e) { setStatus(e instanceof Error ? e.message : 'Could not load bundle metadata.'); return null; } }
  useEffect(() => { void refresh(); return () => controller.current?.abort(); }, []);
  async function load(file: 'SKILL.md' | 'references/format.md') { try { const result = await request('/api/c11/load', lab11LoadResultSchema, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision, file }) });
    setPreview(result.text); setStatus('Host preview loaded. This is not evidence of an agent read.'); } catch (e) { setPreview(''); setStatus(e instanceof Error ? e.message : 'Preview failed.'); } }
  async function run(mode: 'scripted' | 'live', compare = false) {
    if (pending) return; const abort = new AbortController(); controller.current = abort; setPending(true);
    try { for (const selected of compare ? lab11Variants : [variant]) {
      const result = await streamPost('/api/c11/new-session', { mode, variant: selected, prompt, scenario: mode === 'live' ? 'reads' : scenario, deadlineSeconds: 30, budgetCents: 50 },
        { signal: abort.signal, headers: { 'X-Lab-Owner': owner.current }, idleMs: 25000, deadlineMs: 60000, resultSchema: lab11ResultSchema });
      if (result.kind !== 'success') { setStatus('Cancelled locally. Remote cleanup is separate; inspect Claude Console for any live session.'); break; }
      setResults(all => [...all, result.result].slice(-15)); setStatus(`${lab11Labels[selected]}: ${result.result.outcome.kind}. ${result.result.message}`);
    } } catch (e) { setStatus(e instanceof Error ? e.message : 'The experiment failed.'); }
    finally { controller.current = null; setPending(false); }
  }
  return <section aria-labelledby="c11-heading"><h2 id="c11-heading">Inspect skill metadata and progressive loading</h2>
    <p>A fresh session attaches a pinned skill version. Metadata does not prove that its instructions or reference were read. The model can decide a skill is irrelevant.</p>
    <fieldset disabled={pending}><legend>Skill experiment</legend>
      <label htmlFor="c11-question">User question</label><textarea id="c11-question" value={prompt} maxLength={1000} onChange={e => setPrompt(e.target.value)} />
      <label htmlFor="c11-variant">Skill variant</label><select id="c11-variant" value={variant} onChange={e => { setVariant(e.target.value as typeof variant); setPreview(''); }}>{lab11Variants.map(v => <option key={v} value={v}>{lab11Labels[v]}</option>)}</select>
      <label htmlFor="c11-scenario">Offline loading scenario</label><select id="c11-scenario" value={scenario} onChange={e => setScenario(e.target.value)}>{lab11Scenarios.map(v => <option key={v} value={v}>{v}</option>)}</select>
    </fieldset>
    <h3>Authored bundle and configured pins</h3><p>Local bundle: <strong>{revision}</strong>. Read-only is enforced by the session toolset: write, edit, bash, web tools, MCP and orchestration are disabled. Skill filtering is not authorization.</p>
    {catalog && <><p>Base live setup: {catalog.liveReady ? 'ready' : 'unavailable'}. {variant === 'without-skill' ? 'This variant requires no skill upload.' : variant === 'missing-id' ? 'Missing skill ID is an offline experiment; select a configured variant for live mode.' : ready ? 'The selected skill pin is ready.' : 'The selected skill bundle needs an explicit upload and matching version pin before Run live.'}</p><p>Bundle manifest: {catalog.manifestValid ? 'valid or not yet created' : 'invalid; live skill runs blocked'}. Configured pins: {catalog.configuredPins.map(p => `${p.revision}: ${p.matchesBundle ? 'matches authored bundle' : p.configured ? 'outdated' : 'not uploaded'}`).join('; ')}.</p>
      <p>{catalog.bundles.find(b => b.revision === revision)?.description}</p><ul>{catalog.bundles.find(b => b.revision === revision)?.files.map(f => <li key={f.path}>{f.path}</li>)}</ul></>}
    <div className="lab-controls"><button disabled={pending} onClick={() => void load('SKILL.md')}>Preview authored instructions</button><button disabled={pending} onClick={() => void load('references/format.md')}>Preview authored reference</button><button disabled={pending} onClick={() => void refresh()}>Refresh pin metadata</button></div>
    {preview && <CodeBlock label="Host file preview — not an agent read" code={preview} lineNumbers={false} />}
    <div className="lab-controls"><button disabled={pending} onClick={() => void run('scripted')}>Run offline skill experiment</button><button disabled={pending || scenario === 'hang'} onClick={() => void run('scripted', true)}>Compare all offline variants</button>
      <button disabled={pending || !results.length} onClick={() => setResults([])}>Clear comparisons</button>{pending && <button onClick={() => controller.current?.abort()}>Cancel experiment</button>}</div>
    <div className="lab-live"><LiveActionButton busy={pending} available={ready} checkAvailability={async () => { const value = await refresh(); return Boolean(value?.liveReady && (variant === 'without-skill' || (variant !== 'missing-id' && value.configuredPins.find(p => p.revision === revision)?.matchesBundle))); }} onRun={() => void run('live')}
      setup="Use npm run skills:check -- v1 to validate locally. Upload deliberately with npm run skills:upload -- v1 (then missing-reference or v2). Upload records an immutable version in managed/lab11-skills.local.json. Configure the base agent, environment and live opt-in. Refresh pin metadata afterward. Run live starts one billed fresh session; it never uploads a skill." /></div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    <h3>Fresh session evidence</h3>{results.map((r, i) => <article className="report-turn" aria-label={`${lab11Labels[r.requested.variant]} result`} key={`${r.sessionId}-${i}`}>
      <h4>{lab11Labels[r.requested.variant]}</h4><p>Source: {r.source}. Outcome: {r.outcome.kind}. Session: <code>{r.sessionId ?? 'not created'}</code>.</p>
      <p>Configured attachment: {r.configured ? `${r.configured.revision} / ${r.configured.version}` : 'none'}. Resolved skills: {r.resolvedSkills?.length ?? 'unknown'}.</p>
      {r.resolvedSkills?.map(s => <p key={`${s.skillId}-${s.version}`}>Resolved version: <code>{s.version}</code>. Canonical pin: <code>{s.canonicalVersion ?? 'not separately resolved'}</code>.</p>)}
      <h5>Observed file loading</h5>{r.reads.length ? <ul>{r.reads.map(read => <li key={read.useId}><strong>{read.file}: {read.state}</strong> — <code>{read.path}</code>. Content match: {read.contentMatchesBundle === null ? 'not established' : read.contentMatchesBundle ? 'exact authored text present' : 'not established from returned text'}. <details><summary>Read event identifiers</summary><p>Use: <code>{read.useId}</code>. Result: <code>{read.resultId ?? 'not observed'}</code>.</p></details></li>)}</ul> : <p>No skill file reads observed.</p>}
      <p>{r.evidenceNote}</p>{r.messages.map(m => <p style={{ whiteSpace: 'pre-wrap' }} key={m.eventId}>{redact(m.text)}</p>)}
      <p>Interruption: {r.interruption}. Cleanup: {r.cleanup}. Usage: {r.reportedUsage ? `${r.reportedUsage.inputTokens} input / ${r.reportedUsage.outputTokens} output tokens; ${r.reportedUsage.cacheCreationTokens} cache creation / ${r.reportedUsage.cacheReadTokens} cache read (${r.reportedUsage.scope})` : 'not reported'}. Usage is not complete billed session cost.</p>
      <details><summary>View and copy full evidence JSON</summary><CodeBlock label={`Skill experiment ${i + 1} JSON`} code={JSON.stringify(r, null, 2)} lineNumbers={false} /></details>
    </article>)}
    <p>A local .claude/skills folder is not mounted automatically. Trusted GitHub repository discovery is a separate path described in the guide. Skills on worker agents require separate worker configuration checks.</p>
  </section>;
}
