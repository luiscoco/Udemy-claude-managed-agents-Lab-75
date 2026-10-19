import { useEffect, useRef, useState } from 'react';
import { infographicKey, infographicText, type LessonInfographic as Visual } from '../../shared/learning-infographics';
import { infographicManifestSchema, type InfographicAsset } from '../../shared/infographic-assets';
import { narrationCueAt, narrationTimelineSchema, type NarrationTimeline } from '../../shared/learning-narration';
import { InfographicViewer } from './InfographicViewer';
import '../infographics.css';

async function verifiedBlob(response: Response, expected: string, maximum: number, contentType: string) {
  if (!response.ok || !response.headers.get('Content-Type')?.includes(contentType)) throw new Error('Included media is unavailable. Use the text version below.');
  const blob = await response.blob(); if (!blob.size || blob.size > maximum) throw new Error('Included media exceeds its size limit.');
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  if (Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('') !== expected) throw new Error('Media integrity check failed. Use the text version below.');
  return blob;
}
export function LessonInfographic({ visual, onExplanation, onSource }: { visual: Visual;
  onExplanation: (target: Visual['regions'][number]['target']) => void; onSource: (path: string) => void;
}) {
  const [asset, setAsset] = useState<InfographicAsset>(), [image, setImage] = useState(''), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(0), [follow, setFollow] = useState(false), [loading, setLoading] = useState(false), [speed, setSpeed] = useState('1');
  const [timeline, setTimeline] = useState<NarrationTimeline>(), [clock, setClock] = useState({ current: 0, duration: 0, playing: false });
  const audio = useRef<HTMLAudioElement>(null), clip = useRef<string | null>(null), pending = useRef<AbortController | null>(null);
  const timing = useRef<NarrationTimeline | undefined>(undefined), selectedRef = useRef(0), pendingSeek = useRef<number | undefined>(undefined), generation = useRef(0);
  const section = useRef<HTMLElement>(null), key = infographicKey(visual.lessonId, visual.kind), region = visual.regions[selected]!;
  const cue = narrationCueAt(timeline, clock.current);
  function sync() { const element = audio.current; if (element) setClock({ current: element.currentTime, duration: Number.isFinite(element.duration) ? element.duration : 0, playing: !element.paused && !element.ended }); }
  function pause() { generation.current++; pending.current?.abort(); pending.current = null; audio.current?.pause(); setLoading(false); sync(); }
  function select(index: number) {
    setSelected(index); selectedRef.current = index;
    const offset = timing.current?.cues[index]?.start;
    if (offset !== undefined && audio.current) { pendingSeek.current = offset;
      if (audio.current.readyState >= 1) { audio.current.currentTime = offset; pendingSeek.current = undefined; } }
  }
  useEffect(() => {
    const controller = new AbortController(), media = audio.current; let url: string | undefined;
    void (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}infographics/pilot-manifest.json`, { signal: controller.signal });
        if (!response.ok) throw new Error('Included infographic catalog could not be loaded. The text version remains available.');
        const parsed = infographicManifestSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error('The included infographic catalog needs an author update. Use the text version below.');
        const entry = parsed.data.assets[key];
        if (!entry || entry.text !== infographicText(visual)) throw new Error('This infographic recording needs an author update. Read the text version.');
        const blob = await verifiedBlob(await fetch(`${import.meta.env.BASE_URL}${entry.image.file}`, { signal: controller.signal }), entry.image.sha256, 8 * 1024 * 1024, 'image/png');
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob); setAsset(entry); setImage(url);
      } catch (error) { if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : 'Included image unavailable.'); }
    })();
    return () => { controller.abort(); generation.current++; pending.current?.abort(); media?.pause(); media?.removeAttribute('src'); media?.load(); if (url) URL.revokeObjectURL(url); if (clip.current) URL.revokeObjectURL(clip.current); };
  }, [key]);
  useEffect(() => { if (cue) { const index = visual.regions.findIndex(item => item.id === cue); if (index >= 0) { setSelected(index); selectedRef.current = index; } } }, [cue]);
  useEffect(() => { if (!clock.playing) return; const timer = window.setInterval(sync, 100); return () => clearInterval(timer); }, [clock.playing]);
  async function play(replay = false) {
    if (!asset || !audio.current || loading) return; setNotice('');
    if (!clip.current) {
      const token = ++generation.current, controller = new AbortController(); pending.current = controller; setLoading(true);
      try {
        const blob = await verifiedBlob(await fetch(`${import.meta.env.BASE_URL}${asset.recording.file}`, { signal: controller.signal }), asset.recording.sha256, 4 * 1024 * 1024, 'audio/mpeg');
        const response = await fetch(`${import.meta.env.BASE_URL}${asset.recording.timingFile}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Region timing is unavailable. Read the text version.');
        const checked = narrationTimelineSchema.safeParse(await response.json());
        if (!checked.success) throw new Error('Region timing is unavailable. Read the text version.');
        const parsed = checked.data;
        if (parsed.lessonId !== visual.lessonId || parsed.stepId !== visual.kind || parsed.source !== 'inworld-word' || parsed.cues.length !== 6 ||
          parsed.cues.some((item, index) => item.id !== visual.regions[index]?.id || item.end > asset.recording.durationSeconds + 0.25)) throw new Error('Region timing does not match this image.');
        if (token !== generation.current) return;
        pendingSeek.current = parsed.cues[replay ? 0 : selectedRef.current]!.start;
        setClock({ current: pendingSeek.current, duration: asset.recording.durationSeconds, playing: false });
        timing.current = parsed; setTimeline(parsed);
        clip.current = URL.createObjectURL(blob); audio.current!.src = clip.current;
      } catch (error) { if (!controller.signal.aborted && token === generation.current) setNotice(error instanceof Error ? error.message : 'Recording unavailable.'); return; }
      finally { if (token === generation.current) { setLoading(false); pending.current = null; } }
    }
    if (!audio.current) return;
    if (replay || audio.current.ended) { select(0); audio.current.currentTime = 0; pendingSeek.current = 0; }
    audio.current.playbackRate = Number(speed); setFollow(true);
    try { await audio.current.play(); requestAnimationFrame(() => requestAnimationFrame(() => section.current?.querySelector('.infographic-viewport')?.scrollIntoView({ block: 'start', behavior: 'instant' }))); }
    catch { setNotice('Use the audio player Play control to start the included recording.'); }
  }
  return <section ref={section} className="lesson-infographic learning-card" aria-label={`${visual.kind === 'concepts' ? 'Concept map' : 'Lab walkthrough'} for Lab ${visual.lessonId}`}>
    <p className="phase-label">Lab {String(visual.lessonId).padStart(2, '0')} / {visual.kind === 'concepts' ? 'Concept map' : 'Lab walkthrough'}</p>
    <h2>{visual.title}</h2><p>Six regions explain this lesson. These are illustrated teaching summaries; inspect the exercise for actual results.</p>
    <div className="infographic-playback">
      <div className="infographic-toolbar"><button type="button" disabled={!asset || loading} onClick={() => void play()}>Play visual tour</button>
        <button type="button" onClick={pause}>Pause visual tour</button><button type="button" disabled={!asset || loading} onClick={() => void play(true)}>Replay visual tour</button>
        <label>Visual tour speed<select value={speed} onChange={event => { setSpeed(event.target.value); if (audio.current) audio.current.playbackRate = Number(event.target.value); }}><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option></select></label>
      </div>
      <audio ref={audio} controls preload="none" aria-label="Infographic narration" onLoadedMetadata={() => { if (pendingSeek.current !== undefined && audio.current) { audio.current.currentTime = pendingSeek.current; pendingSeek.current = undefined; } sync(); }}
        onPlay={() => { document.querySelectorAll('audio').forEach(element => { if (element !== audio.current) element.pause(); }); sync(); }}
        onPlaying={sync} onPause={sync} onTimeUpdate={sync} onSeeked={sync} onSeeking={sync} onDurationChange={sync} onEnded={sync}
        onError={() => setNotice('Audio playback failed. The complete text version remains available.')} />
      <label className="infographic-follow"><input type="checkbox" checked={follow} onChange={event => setFollow(event.target.checked)} /> Follow the spoken region with zoom and pan</label>
      <p className="infographic-clock">Region {selected + 1} / 6 · {Math.floor(clock.current)} / {Math.floor(clock.duration)} seconds{clock.playing ? ' · Playing' : ''}. Included Inworld MP3; no API key needed.</p>
    </div>
    <p role="status" aria-label="Infographic status">{loading ? 'Loading the included recording…' : notice}</p>
    {timeline && <div className="infographic-quick-controls" role="group" aria-label="Visual tour quick controls">
      <strong>Region {selected + 1}: {region.title}</strong>
      <button type="button" aria-label={clock.playing ? 'Pause visual narration' : 'Resume visual narration'} onClick={() => clock.playing ? pause() : void play()}>{clock.playing ? 'Pause' : 'Resume'}</button>
      <button type="button" aria-label="Previous spoken region" disabled={selected === 0} onClick={() => select(selected - 1)}>Previous</button>
      <button type="button" aria-label="Next spoken region" disabled={selected === 5} onClick={() => select(selected + 1)}>Next</button>
    </div>}
    {image && asset ? <InfographicViewer image={image} width={asset.image.width} height={asset.image.height} title={visual.title} regions={visual.regions} selected={selected} onSelect={select} follow={follow} onFollow={setFollow} /> : <p className="infographic-placeholder">{notice ? 'Image unavailable. Use the text version below.' : 'Loading the included infographic…'}</p>}
    <div className="infographic-toolbar"><button type="button" disabled={selected === 0} onClick={() => select(selected - 1)}>Previous region</button><button type="button" disabled={selected === 5} onClick={() => select(selected + 1)}>Next region</button>
      {asset && <a href={`${import.meta.env.BASE_URL}${asset.image.file}`} download>Download PNG image</a>}</div>
    <div className="infographic-study-links" role="group" aria-label="Infographic study links">{visual.regions.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === index} onClick={() => select(index)}>{index + 1}. {item.title}</button>)}</div>
    <section className="infographic-selected" aria-label="Selected infographic explanation"><h3>{selected + 1}. {region.title}</h3><p>{region.narration}</p>
      <button type="button" onClick={() => onExplanation(region.target)}>Open related explanation</button>{' '}<button type="button" onClick={() => onSource(region.source)}>Open corresponding source</button>
    </section>
    <details className="infographic-transcript"><summary>Read visual tour transcript</summary><ol>{visual.regions.map(item => <li key={item.id}><h3>{item.title}</h3><p>{item.summary}</p><p>{item.narration}</p></li>)}</ol></details>
  </section>;
}
