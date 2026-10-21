import { useEffect, useId, useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { TextResource } from './TextResource';
import { supportingImports } from '../lessons/catalog';
import type { TextCatalog } from '../lessons/catalog';
import { CodeTourSource } from './CodeTourSource';

export function SourceViewer({ sources, mainSources, requestedSource, lessonId, active = true }: { sources: TextCatalog; mainSources: readonly string[]; requestedSource?: { path: string; serial: number }; lessonId?: number; active?: boolean }) {
  const id = useId();
  const [selected, setSelected] = useState(() => {
    try { const retry = sessionStorage.getItem('lesson-resource-retry'); if (retry && Object.hasOwn(sources, retry)) return retry; } catch { /* Storage is optional. */ }
    return mainSources[0] ?? Object.keys(sources)[0] ?? '';
  });
  const names = [...new Set([...mainSources, ...Object.keys(sources).sort()])];
  const narratedMain = lessonId ? mainSources.find(path => path.startsWith(`server/concepts/${String(lessonId).padStart(2, '0')}-`) && path.endsWith('.ts')) : undefined;
  useEffect(() => { if (requestedSource?.path && Object.hasOwn(sources, requestedSource.path)) setSelected(requestedSource.path); }, [requestedSource, sources]);
  return <section className="source-card" aria-label="Real source files"><p className="phase-label">Explore / Source</p><h2>Read the real source</h2>
    <p>Public teaching files bundled as text at build time. Viewing source never executes it.</p>
    {narratedMain && <p>Only this lab's main TypeScript concept file has a spoken walkthrough. Supporting files are available for reading.{selected !== narratedMain && <> <button className="button-secondary" type="button" onClick={() => setSelected(narratedMain)}>Open narrated main concept</button></>}</p>}
    {!names.length ? <p role="status">No source files are available for this lesson.</p> : <>
      <label htmlFor={id}>Source file</label>
      <select id={id} value={selected} onChange={(event) => setSelected(event.target.value)}>
        {names.map((name) => <option key={name} value={name}>{name}{name === narratedMain ? ' (narrated main concept)' : mainSources.includes(name) ? ' (main)' : ''}</option>)}
      </select>
      {sources[selected] ? <TextResource key={selected} load={sources[selected]!} label={selected}>{(text) => <>
        {lessonId && /^server\/concepts\/\d{2}-.*\.ts$/.test(selected) ? <CodeTourSource key={selected} lessonId={lessonId} path={selected} code={text} active={active} /> : <CodeBlock label={selected} code={text} syntax />}
        <nav aria-label="Supporting imports"><p>Follow supporting modules:</p>
          {supportingImports(sources, selected, text).map((path) => <button key={path} onClick={() => setSelected(path)}>{path}</button>)}
          {!supportingImports(sources, selected, text).length && <p>No relative imports resolve in the teaching catalog.</p>}
        </nav>
      </>}</TextResource> : <p role="alert">The selected source is not in the teaching catalog.</p>}
    </>}
  </section>;
}
