import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { codeCatalogSchema, codeManifestSchema, codeTourText, normalizedCode, type CodeTour } from '../../shared/code-tours';
import { narrationCueAt, narrationTimelineSchema, type NarrationTimeline } from '../../shared/learning-narration';
import { CodeBlock } from './CodeBlock';
import '../code-tours.css';

const hash = async (data: ArrayBuffer) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), byte => byte.toString(16).padStart(2, '0')).join('');
const textHash = (text: string) => hash(new TextEncoder().encode(text).buffer);
async function bounded(response: Response, maximum: number) {
  if (!response.ok) throw new Error('Included code narration is unavailable. The source and transcript remain readable.');
  const reader = response.body?.getReader(); if (!reader) throw new Error('Empty media response.');
  const chunks: Uint8Array[] = []; let size = 0;
  try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > maximum) throw new Error('Included media exceeds its limit.'); chunks.push(value); } }
  finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  const result = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result.buffer;
}

export function CodeTourSource({ lessonId, path, code, active }: { lessonId: number; path: string; code: string; active: boolean }) {
  const [tour, setTour] = useState<CodeTour>(), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0), [follow, setFollow] = useState(true), [speed, setSpeed] = useState('1');
  const [timeline, setTimeline] = useState<NarrationTimeline>(), [clock, setClock] = useState({ current: 0, duration: 0, playing: false });
  const [revealRequest, setRevealRequest] = useState(0);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [fontSize, setFontSize] = useState(18), [wrap, setWrap] = useState(true), [fullScreen, setFullScreen] = useState(false);
  const [frame, setFrame] = useState<{ left: number; top: number; width: number; height: number }>();
  const audio = useRef<HTMLAudioElement>(null), viewport = useRef<HTMLDivElement>(null), blobUrl = useRef<string | undefined>(undefined);
  const readingArea = useRef<HTMLDivElement>(null), canvas = useRef<HTMLDivElement>(null), focusRequest = useRef(0);
  const fullScreenButton = useRef<HTMLButtonElement>(null);
  const pending = useRef<AbortController | undefined>(undefined), generation = useRef(0), seek = useRef<number | undefined>(undefined);
  function sync() { const el = audio.current; if (el) setClock({ current: el.currentTime, duration: Number.isFinite(el.duration) ? el.duration : 0, playing: !el.paused && !el.ended }); }
  function pause() { generation.current++; pending.current?.abort(); pending.current = undefined; audio.current?.pause(); setLoading(false); sync(); }
  function exitFullScreen() { setFullScreen(false); requestAnimationFrame(() => fullScreenButton.current?.focus({ preventScroll: true })); }
  useEffect(() => {
    if (!fullScreen || !active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; viewport.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previous; };
  }, [fullScreen, active]);
  useEffect(() => {
    if (!active) { pause(); setFullScreen(false); return; }
    const controller = new AbortController();
    void (async () => {
      try {
        const raw = await bounded(await fetch(`${import.meta.env.BASE_URL}code-tours/catalog.json`, { signal: controller.signal }), 1024 * 1024);
        const catalog = codeCatalogSchema.parse(JSON.parse(new TextDecoder().decode(raw)));
        const entry = catalog.tours.find(item => item.lessonId === lessonId && item.path === path);
        if (!entry) { if (!controller.signal.aborted) setTour(undefined); return; }
        if (await textHash(normalizedCode(code)) !== entry.sourceSha256 || entry.sections.some(item => item.endLine > normalizedCode(code).split('\n').length)) throw new Error('This code changed after narration was authored. Read the current source; the author must update its tour.');
        if (!controller.signal.aborted) setTour(entry);
      } catch (error) { if (!controller.signal.aborted) { setTour(undefined); setTimeline(undefined); pause(); setNotice(error instanceof Error ? error.message : 'Code tour unavailable.'); } }
    })();
    return () => controller.abort();
  }, [active, lessonId, path, code]);
  useEffect(() => {
    const media = audio.current;
    return () => { generation.current++; pending.current?.abort(); media?.pause(); media?.removeAttribute('src'); media?.load(); if (blobUrl.current) URL.revokeObjectURL(blobUrl.current); blobUrl.current = undefined; };
  }, [Boolean(tour)]);
  const cue = narrationCueAt(timeline, clock.current);
  useEffect(() => { const index = tour?.sections.findIndex(item => item.id === cue) ?? -1; if (index >= 0) setSelected(index); }, [cue, tour]);
  function measureFrame() {
    const el = viewport.current, parent = canvas.current, section = tour?.sections[selected];
    if (!el || !parent || !section) { setFrame(undefined); return; }
    const first = el.querySelector<HTMLElement>(`[data-code-line="${section.startLine}"]`), last = el.querySelector<HTMLElement>(`[data-code-line="${section.endLine}"]`);
    if (!first || !last) { setFrame(undefined); return; }
    const bounds = el.getBoundingClientRect(), origin = parent.getBoundingClientRect(), start = first.getBoundingClientRect(), end = last.getBoundingClientRect();
    const left = Math.max(start.left, bounds.left + 3), right = Math.min(start.right, bounds.left + el.clientWidth - 3);
    const top = Math.max(start.top, bounds.top + 3), bottom = Math.min(end.bottom, bounds.top + el.clientHeight - 3);
    setFrame(right > left && bottom > top ? { left: left - origin.left, top: top - origin.top, width: right - left, height: bottom - top } : undefined);
  }
  useLayoutEffect(() => {
    const el = viewport.current, section = tour?.sections[selected];
    if (!el || !section || !active) return;
    const header = document.querySelector('.topbar');
    const fixed = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position);
    const safeTop = fullScreen ? 28 : (fixed ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 12;
    const controls = [...(readingArea.current?.querySelectorAll('.code-tour-quick-controls, .code-reader-toolbar') ?? [])].reduce((total, item) => total + item.getBoundingClientRect().height, 0);
    el.style.setProperty('--code-available-height', `${Math.max(80, innerHeight - safeTop - controls - (fullScreen ? 48 : 32))}px`);
    if (!follow) { measureFrame(); return; }
    const line = el.querySelector<HTMLElement>(`[data-code-line="${section.startLine}"]`);
    if (line) el.scrollTo({ top: el.scrollTop + line.getBoundingClientRect().top - el.getBoundingClientRect().top - 20, behavior: 'instant' });
    // An explicit Play must reveal the panel even when section zero was already selected.
    if (revealRequest && readingArea.current && !fullScreen) {
      const bounds = readingArea.current.getBoundingClientRect();
      const forced = focusRequest.current !== revealRequest;
      if (forced || bounds.top < safeTop || el.getBoundingClientRect().bottom > innerHeight - 12)
        window.scrollBy({ top: bounds.top - safeTop, behavior: 'instant' });
      if (forced) { el.focus({ preventScroll: true }); focusRequest.current = revealRequest; }
    }
    if (revealRequest && fullScreen && readingArea.current) {
      const reader = readingArea.current, bounds = el.getBoundingClientRect(), area = reader.getBoundingClientRect();
      if (bounds.bottom > area.bottom - 16) reader.scrollTop += bounds.bottom - area.bottom + 16;
      if (focusRequest.current !== revealRequest) { el.focus({ preventScroll: true }); focusRequest.current = revealRequest; }
    }
    measureFrame();
  }, [selected, tour, follow, active, revealRequest, layoutVersion, fontSize, wrap, fullScreen]);
  useLayoutEffect(() => {
    measureFrame();
    const observer = new ResizeObserver(measureFrame);
    if (viewport.current) observer.observe(viewport.current);
    const pre = viewport.current?.querySelector('pre'); if (pre) observer.observe(pre);
    const resized = () => { measureFrame(); setLayoutVersion(value => value + 1); };
    window.addEventListener('resize', resized);
    return () => { observer.disconnect(); window.removeEventListener('resize', resized); };
  }, [selected, tour, active, timeline, fontSize, wrap, fullScreen]);
  useEffect(() => {
    if (!active || !clock.playing || !timeline || !tour) return;
    let request = 0;
    const followClock = () => {
      const id = narrationCueAt(timeline, audio.current?.currentTime ?? 0);
      const index = tour.sections.findIndex(section => section.id === id);
      if (index >= 0) setSelected(previous => previous === index ? previous : index);
      request = requestAnimationFrame(followClock);
    };
    request = requestAnimationFrame(followClock);
    return () => cancelAnimationFrame(request);
  }, [active, clock.playing, timeline, tour]);
  function choose(index: number) {
    setSelected(index);
    const offset = timeline?.cues[index]?.start;
    if (offset !== undefined && audio.current) { audio.current.currentTime = offset; sync(); }
  }
  async function play(replay = false) {
    if (!tour || !audio.current || !active) return;
    const token = ++generation.current;
    pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
    setNotice('');
    try {
      if (!blobUrl.current) {
        setLoading(true);
        const manifest = codeManifestSchema.parse(JSON.parse(new TextDecoder().decode(await bounded(await fetch(`${import.meta.env.BASE_URL}audio/code/manifest.json`, { signal: controller.signal }), 128 * 1024))));
        const entry = manifest.recordings[String(lessonId)];
        if (!entry || entry.sourceSha256 !== tour.sourceSha256 || entry.textSha256 !== await textHash(codeTourText(tour))) throw new Error('This recording does not match the authored code tour. Use its transcript.');
        const [bytes, timingBytes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}${entry.file}`, { signal: controller.signal }).then(response => bounded(response, 4 * 1024 * 1024)),
          fetch(`${import.meta.env.BASE_URL}${entry.timingFile}`, { signal: controller.signal }).then(response => bounded(response, 128 * 1024)),
        ]);
        if (await hash(bytes) !== entry.sha256 || await hash(timingBytes) !== entry.timingSha256) throw new Error('Code media integrity check failed. Use the transcript.');
        const parsed = narrationTimelineSchema.parse(JSON.parse(new TextDecoder().decode(timingBytes)));
        if (parsed.lessonId !== lessonId || parsed.stepId !== 'code' || parsed.source !== 'inworld-word' || parsed.cues.length !== tour.sections.length || parsed.cues.some((item, index) => item.id !== tour.sections[index]?.id || item.end > entry.durationSeconds + .25)) throw new Error('Code timings do not match the source tour.');
        if (token !== generation.current || controller.signal.aborted) return;
        setTimeline(parsed); setClock({ current: 0, duration: entry.durationSeconds, playing: false });
        blobUrl.current = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
        seek.current = parsed.cues[replay ? 0 : selected]?.start ?? 0;
        audio.current.src = blobUrl.current;
      }
      if (replay || audio.current.ended) { setSelected(0); audio.current.currentTime = 0; seek.current = 0; }
      audio.current.playbackRate = Number(speed);
      const alreadyPlaying = !audio.current.paused;
      await audio.current.play();
      if (alreadyPlaying) setRevealRequest(value => value + 1);
    } catch (error) { if (!controller.signal.aborted && token === generation.current) setNotice(error instanceof Error ? error.message : 'Code narration could not play.'); }
    finally { if (token === generation.current) { setLoading(false); pending.current = undefined; } }
  }
  const section = tour?.sections[selected];
  return <>
    {tour && <div className="code-tour-controls" role="region" aria-label="Main concept code narration">
      <h3>Listen to the main TypeScript concept</h3>
      <p>One narrated file for this lab: <code>{path}</code>. Red rectangles follow the included Inworld MP3. No student API key is needed.</p>
      <div className="actions"><button type="button" disabled={loading} onClick={() => void play()}>Play code tour</button><button className="button-secondary" type="button" onClick={pause}>Pause code tour</button><button className="button-secondary" type="button" disabled={loading} onClick={() => void play(true)}>Replay code tour</button></div>
      <label>Code narration speed<select value={speed} onChange={event => { setSpeed(event.target.value); if (audio.current) audio.current.playbackRate = Number(event.target.value); }}><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option></select></label>
      <audio ref={audio} controls preload="none" aria-label="TypeScript code narration" onLoadedMetadata={() => { if (seek.current !== undefined && audio.current) { audio.current.currentTime = seek.current; seek.current = undefined; } sync(); }}
        onPlay={() => { document.querySelectorAll('audio').forEach(el => { if (el !== audio.current) el.pause(); }); sync(); setRevealRequest(value => value + 1); }} onTimeUpdate={sync} onPlaying={sync} onPause={sync} onSeeking={sync} onSeeked={sync} onEnded={sync} onDurationChange={sync}
        onError={() => setNotice('Audio playback failed. The code and transcript remain available.')} />
      <p aria-live="off">Section {selected + 1} / {tour.sections.length} · {Math.floor(clock.current)} / {Math.floor(clock.duration)} seconds{clock.playing ? ' · Playing' : ''}</p>
      <label>Code explanation section<select value={selected} onChange={event => choose(Number(event.target.value))}>{tour.sections.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.title} (lines {item.startLine}–{item.endLine})</option>)}</select></label>
      <label className="guide-checkpoint"><input type="checkbox" checked={follow} onChange={event => setFollow(event.target.checked)} /> Follow the narrated code inside the source panel</label>
      {section && <p><strong>{section.title}:</strong> {section.text}</p>}
      <details><summary>Read code tour transcript</summary><ol>{tour.sections.map(item => <li key={item.id}><strong>{item.title} · lines {item.startLine}–{item.endLine}</strong><p>{item.text}</p></li>)}</ol></details>
    </div>}
    {notice && <p role="status">{notice}</p>}
    <div ref={readingArea} className={`code-tour-reading-area${fullScreen ? ' code-reader-full-screen' : ''}`} role={fullScreen ? 'dialog' : undefined} aria-modal={fullScreen ? true : undefined} aria-label={fullScreen ? 'Full-screen code reader' : undefined}
      onKeyDown={event => {
        if (!fullScreen) return;
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); exitFullScreen(); }
        if (event.key === 'Tab') {
          const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, [tabindex="0"]')].filter(el => el.getClientRects().length > 0);
          const first = controls[0], last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
    {tour && <div className="code-reader-toolbar" role="group" aria-label="Code reading controls">
      <label>Code font size<select value={fontSize} onChange={event => setFontSize(Number(event.target.value))}>{[14, 16, 18, 20, 24].map(size => <option key={size} value={size}>{size}px</option>)}</select></label>
      <button className="button-secondary" type="button" aria-pressed={wrap} onClick={() => setWrap(value => !value)}>Wrap code</button>
      <button className="button-secondary" type="button" ref={fullScreenButton} aria-expanded={fullScreen} onClick={() => fullScreen ? exitFullScreen() : setFullScreen(true)}>{fullScreen ? 'Exit full-screen code' : 'Enter full-screen code'}</button>
      {fullScreen && <><button className="button-secondary" type="button" aria-pressed={follow} onClick={() => setFollow(value => !value)}>Follow code narration</button>{!timeline && <button type="button" disabled={loading} onClick={() => void play()}>Play code tour in full screen</button>}</>}
    </div>}
    {timeline && tour && <div className="code-tour-quick-controls" role="group" aria-label="Code tour quick controls">
      <strong>Section {selected + 1}: {section?.title}</strong>
      <button className="button-secondary" type="button" aria-label={clock.playing ? 'Pause code narration' : 'Resume code narration'} onClick={() => clock.playing ? pause() : void play()}>{clock.playing ? 'Pause' : 'Resume'}</button>
      <button className="button-secondary" type="button" aria-label="Previous code explanation" disabled={selected === 0} onClick={() => choose(selected - 1)}>Previous</button>
      <button className="button-secondary" type="button" aria-label="Next code explanation" disabled={selected === tour.sections.length - 1} onClick={() => choose(selected + 1)}>Next</button>
    </div>}
    <div className="code-tour-canvas" ref={canvas}>
    <div className={tour ? `code-tour-viewport${wrap ? '' : ' code-no-wrap'}` : undefined} style={{ '--code-font-size': `${fontSize}px` } as React.CSSProperties} ref={viewport} onScroll={measureFrame} tabIndex={tour ? 0 : undefined} role={tour ? 'region' : undefined} aria-label={tour ? 'Narrated TypeScript source' : undefined}>
      <CodeBlock label={path} code={code} syntax {...(section ? { highlight: { start: section.startLine, end: section.endLine } } : {})} />
    </div>
    {frame && tour && active && <div className="code-tour-rectangle" data-code-cue={section?.id} aria-hidden="true" style={frame} />}
    </div>
    </div>
  </>;
}
