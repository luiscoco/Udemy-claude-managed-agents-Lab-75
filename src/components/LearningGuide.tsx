import { useEffect, useRef, useState } from 'react';
import { learningGuide, type GuideView } from '../../shared/learning-guide';
import { guideControlTarget } from '../lib/guide-targets';
import { checklistKey, positionKey as savedPositionKey, notifyLearningProgress } from '../lib/learning-progress';
import { LessonNotebook } from './LessonNotebook';
import { narrationCueAt, narrationSegments, narrationTimelineSchema, sectionTimeline, type NarrationTimeline } from '../../shared/learning-narration';

import { includedRecording, narrationManifestSchema, type NarrationManifest } from '../../shared/learning-recordings';
import { revealGuideTarget } from '../lib/guide-scroll';

const checkpoints = ['I can explain the objective.', 'I ran an example and inspected its evidence.', 'I connected the result to the source.', 'I tried the challenge.'];
export function LearningGuide({ lessonId, view, onView, workspace }: {
  lessonId: number; view: number; onView: (view: GuideView) => void; workspace: React.RefObject<HTMLDivElement | null>;
}) {
  const steps = learningGuide(lessonId), [index, setIndex] = useState<number | null>(null);
  const [revision, setRevision] = useState(0), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<NarrationManifest>();
  const setup = { ready: steps.every(item => includedRecording(manifest, lessonId, item)), voiceId: manifest?.voiceId ?? '' };
  const [autoContinue, setAutoContinue] = useState(false), [compact, setCompact] = useState(false), [speed, setSpeed] = useState('1');
  const [followHighlights, setFollowHighlights] = useState(true);
  const player = useRef<HTMLElement>(null);
  const [readyKey, setReadyKey] = useState(''), [timeline, setTimeline] = useState<NarrationTimeline>();
  const [clock, setClock] = useState({ current: 0, duration: 0, playing: false, ended: false });
  const narratedTour = useRef(false), queuedPlay = useRef(false);
  const revealSelection = useRef(true);
  const storageKey = checklistKey(lessonId);
  const positionKey = savedPositionKey(lessonId);
  const [resumeId, setResumeId] = useState<string | null>(() => { try {
    const saved = localStorage.getItem(positionKey); return steps.some(step => step.id === saved) ? saved : null;
  } catch { return null; } });
  const [targetHint, setTargetHint] = useState('');
  const [checked, setChecked] = useState<boolean[]>(() => { try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    return checkpoints.map((_, i) => Array.isArray(saved) && saved[i] === true);
  } catch { return checkpoints.map(() => false); } });
  const audio = useRef<HTMLAudioElement>(null), start = useRef<HTMLButtonElement>(null);
  const pending = useRef<AbortController | null>(null), generation = useRef(0), clip = useRef<{ key: string; url: string } | null>(null);
  const step = index === null ? undefined : steps[index];
  const spokenCue = narrationCueAt(timeline, clock.current);
  const spokenText = step && narrationSegments(step).find(segment => segment.id === spokenCue)?.text;
  function syncClock() {
    const element = audio.current; if (!element) return;
    setClock({ current: element.currentTime, duration: Number.isFinite(element.duration) ? element.duration : 0,
      playing: !element.paused && !element.ended, ended: element.ended });
  }
  function stop() {
    queuedPlay.current = false; generation.current++; pending.current?.abort(); pending.current = null; audio.current?.pause(); setLoading(false); syncClock();
  }
  function release() { if (clip.current) URL.revokeObjectURL(clip.current.url); clip.current = null;
    if (audio.current) { audio.current.removeAttribute('src'); audio.current.load(); }
    setTimeline(undefined); setClock({ current: 0, duration: 0, playing: false, ended: false }); }
  function select(next: number, speak = narratedTour.current, reveal = true) {
    revealSelection.current = reveal;
    stop(); release(); setNotice(''); setIndex(next); onView(steps[next]!.view); setRevision(value => value + 1);
    queuedPlay.current = speak;
    const selectedId = steps[next]!.id; setResumeId(selectedId);
    try { localStorage.setItem(positionKey, selectedId); } catch { /* The guide still works without persistence. */ }
    notifyLearningProgress();
  }
  function close(restoreFocus = true) { narratedTour.current = false; setAutoContinue(false); setCompact(false); stop(); release(); setIndex(null); setNotice(''); if (restoreFocus) start.current?.focus(); }
  function finish() { close(); setResumeId(null); try { localStorage.removeItem(positionKey); } catch { /* Storage is optional. */ } notifyLearningProgress(); }
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${import.meta.env.BASE_URL}audio/guides/manifest.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error(); return response.json();
    }).then(value => setManifest(narrationManifestSchema.parse(value))).catch(() => { if (!controller.signal.aborted) setNotice('Included recordings could not be loaded. The written guide remains available.'); });
    return () => controller.abort();
  }, []);
  useEffect(() => () => { generation.current++; pending.current?.abort(); audio.current?.pause(); if (clip.current) URL.revokeObjectURL(clip.current.url); }, []);
  useEffect(() => {
    if (!step || view !== step.view) return;
    let target: HTMLElement | undefined;
    let control: HTMLElement | undefined;
    const locateControl = () => {
      const found = workspace.current ? guideControlTarget(workspace.current, step.id) : undefined;
      if (found !== control) {
        control?.classList.remove('learning-guide-control-highlight');
        if (control) delete control.dataset.learningGuideFocus;
        control = found; control?.classList.add('learning-guide-control-highlight');
        if (control) control.dataset.learningGuideFocus = step.id;
      }
      setTargetHint(control ? 'A second red rectangle marks the relevant input, controls or evidence. Use Show exercise target to bring it into view.' :
        step.id === 'evidence' ? 'Run your chosen example yourself, then inspect its evidence. Some lessons display results within the exercise rather than a separate result panel.' :
          step.id === 'example' || step.id === 'controls' ? 'Read the explanation, then use the labeled exercise controls below.' : '');
    };
    const locate = () => {
      const found = workspace.current?.querySelector<HTMLElement>(`[data-guide-target="${step.id}"]`);
      if (!found || !found.getClientRects().length) return;
      if (found instanceof HTMLDetailsElement) found.open = true;
      target = found; found.classList.add('learning-guide-highlight');
      setReadyKey(`${lessonId}:${step.id}:${revision}`);
      if (revealSelection.current) revealGuideTarget(found, player.current, matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');
      return true;
    };
    const observer = new MutationObserver(locateControl);
    if (workspace.current) observer.observe(workspace.current, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open', 'style'] });
    locateControl();
    const interval = window.setInterval(() => { if (locate()) clearInterval(interval); }, 100);
    if (locate()) clearInterval(interval);
    const deadline = window.setTimeout(() => { clearInterval(interval); if (!target) setNotice('This section is not ready. Use Show section to try again.'); }, 5000);
    return () => { clearInterval(interval); clearTimeout(deadline); observer.disconnect(); target?.classList.remove('learning-guide-highlight');
      control?.classList.remove('learning-guide-control-highlight'); if (control) delete control.dataset.learningGuideFocus; };
  }, [index, revision, view]);
  useEffect(() => {
    if (step && queuedPlay.current && readyKey === `${lessonId}:${step.id}:${revision}` && view === step.view) {
      queuedPlay.current = false; void play();
    }
  }, [readyKey, index, revision, view]);
  useEffect(() => {
    if (!clock.playing) return;
    // The refresh timer reads the media clock; it never estimates speech duration.
    const timer = window.setInterval(syncClock, 100);
    return () => clearInterval(timer);
  }, [clock.playing]);
  useEffect(() => {
    const root = workspace.current;
    if (!root || !step || view !== step.view || !spokenCue) return;
    const target = root.querySelector<HTMLElement>(`[data-guide-cue="${spokenCue}"]`);
    if (!target) return;
    root.classList.add('guide-timed-highlight'); target.classList.add('learning-guide-cue-highlight');
    if (followHighlights) revealGuideTarget(target, player.current);
    return () => { root.classList.remove('guide-timed-highlight'); target.classList.remove('learning-guide-cue-highlight'); };
  }, [spokenCue, view, index, followHighlights]);
  useEffect(() => { if (view > 2 && index !== null) close(false); else if (step && view !== step.view) { stop(); setNotice('You changed views. Choose Show section to return to this guide step.'); } }, [view]);
  useEffect(() => { if (index === null) return; const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [index]);
  async function play(replay = false) {
    if (!step || !audio.current) return; setNotice('');
    if (view !== step.view) { setNotice('Choose Show section before playing its narration.'); return; }
    const key = `${lessonId}:${step.id}`;
    if (clip.current?.key !== key) {
      stop(); release(); const token = generation.current, controller = new AbortController(); pending.current = controller; setLoading(true);
      try {
        const recording = includedRecording(manifest, lessonId, step);
        if (!recording) throw new Error('Included narration unavailable. Read the transcript below.');
        const response = await fetch(`${import.meta.env.BASE_URL}${recording.file}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Narration unavailable; use the transcript.');
        if (!response.headers.get('Content-Type')?.includes('audio/mpeg')) throw new Error('Invalid narration response. Read the transcript below.');
        const blob = await response.blob(); if (token !== generation.current) return;
        if (!blob.size || blob.size > 4 * 1024 * 1024) throw new Error('Invalid narration size.');
        const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
        const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
        if (hash !== recording.sha256) throw new Error('Recording integrity check failed. Use the written guide.');
        let timing = sectionTimeline(lessonId, step.id);
        try {
          const result = await fetch(`${import.meta.env.BASE_URL}${recording.timingFile}`, { signal: controller.signal });
          if (result.ok) {
            const parsed = narrationTimelineSchema.safeParse(await result.json());
            const segments = narrationSegments(step);
            if (parsed.success && parsed.data.lessonId === lessonId && parsed.data.stepId === step.id &&
              parsed.data.source === 'inworld-word' && parsed.data.cues.length === segments.length &&
              parsed.data.cues.every((cue, index) => cue.id === segments[index]?.id && cue.end <= recording.durationSeconds + 0.25)) timing = parsed.data;
          }
        } catch { /* A missing timing file leaves the whole section outlined. */ }
        if (token !== generation.current) return;
        setTimeline(timing);
        clip.current = { key, url: URL.createObjectURL(blob) }; audio.current!.src = clip.current.url;
      } catch (error) { if (token === generation.current && !controller.signal.aborted) setNotice(error instanceof Error ? error.message : 'Narration unavailable.'); return; }
      finally { if (token === generation.current) { setLoading(false); pending.current = null; } }
    }
    if (!audio.current) return;
    if (replay || audio.current.ended) audio.current.currentTime = 0;
    audio.current.playbackRate = Number(speed);
    document.querySelectorAll('audio').forEach(item => { if (item !== audio.current) item.pause(); });
    try { await audio.current.play(); } catch { setNotice('Use the audio player Play control to start the recording.'); }
  }
  return <aside ref={player} id={`learning-guide-${lessonId}`} tabIndex={index === null ? -1 : 0} className={`learning-voice-guide${index !== null ? ' guide-active' : ''}${compact ? ' guide-compact' : ''}`} aria-label="Learning Guide">
    <div className="guide-heading"><div><p className="phase-label">Listen / Read / Practice</p><h2>Learning Guide</h2></div>
      <button ref={start} type="button" onClick={() => { narratedTour.current = false; setAutoContinue(false); setCompact(false); select(0, false); }}>{index === null ? 'Start guided tour' : 'Restart tour'}</button></div>
    {index === null ? <><p>Follow this lab section by section with explanations, voice narration and a red highlight. You control every exercise action.</p>
      <button type="button" disabled={!setup?.ready} onClick={() => {
        narratedTour.current = true; setAutoContinue(true); setCompact(true); select(0, true);
      }}>Start narrated tour</button>
      <p className="muted">{setup?.ready ? 'Included Inworld recordings follow each explanation with timed red rectangles. No API key is needed; the tour pauses for your exercise actions.' : 'Written explanations are available while the included recordings load.'}</p>
      {resumeId && <button type="button" onClick={() => select(steps.findIndex(item => item.id === resumeId))}>Resume saved tour</button>}</> : step && <>
      <div className="guide-toolbar guide-controls"><span>Step {index + 1} of {steps.length}</span><button onClick={() => setCompact(value => !value)} aria-expanded={!compact}>{compact ? 'Expand guide' : 'Minimize guide'}</button>{!compact && <button onClick={stop}>Pause</button>}<button onClick={() => close()}>Close guide</button></div>
      <h3 aria-live="polite">{step.title}</h3>
      <div className="guide-toolbar"><button disabled={index === 0} onClick={() => select(index - 1)}>Previous section</button><button onClick={() => select(index, false)}>Show section</button>{index < steps.length - 1 ? <button onClick={() => select(index + 1)}>Next section</button> : <button onClick={finish}>Finish tour</button>}</div>
      <div className="guide-audio-progress" aria-label="Narration progress">
        <progress max={clock.duration || 1} value={Math.min(clock.current, clock.duration || 1)} aria-label="Narration playback progress" />
        <span>{Math.floor(clock.current)} / {Math.floor(clock.duration)} seconds{clock.playing ? ' · Playing' : clock.ended ? ' · Finished' : clock.current > 0 ? ' · Paused' : ''}</span>
      </div>
      {compact && <div className="guide-toolbar"><button disabled={loading || !setup?.ready} onClick={() => void play()}>Play narration</button><button onClick={stop}>Pause narration</button><button disabled={loading || !setup?.ready} onClick={() => void play(true)}>Replay narration</button></div>}
      <div hidden={compact} className="guide-scroll-body">
        <label>Jump to section <select aria-label="Guide section" value={index} onChange={event => select(Number(event.target.value))}>{steps.map((item, i) => <option key={item.id} value={i}>{i + 1}. {item.title}</option>)}</select></label>
        <p className="guide-your-turn"><strong>Your turn:</strong> {step.action}</p>
        {targetHint && <p>{targetHint}</p>}
        {['example', 'controls', 'evidence', 'source'].includes(step.id) && <button type="button" onClick={() => {
          const target = workspace.current && guideControlTarget(workspace.current, step.id);
          if (target) revealGuideTarget(target, player.current, matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');
          else setNotice('No separate target is visible yet. Use the exercise controls yourself and inspect the output when it appears.');
        }}>Show exercise target</button>}
        <p className="guide-voice-status">{setup?.ready ? `Recorded Inworld voice: ${setup.voiceId}. MP3s are included with the course. Students need no Inworld API key.` : 'Written guidance is ready. Included recordings are currently unavailable.'}</p>
        <div className="guide-toolbar"><button disabled={loading || !setup?.ready} onClick={() => void play()}>Play narration</button><button onClick={stop}>Pause narration</button><button disabled={loading || !setup?.ready} onClick={() => void play(true)}>Replay narration</button>
          <label>Playback speed <select value={speed} onChange={event => { setSpeed(event.target.value); if (audio.current) audio.current.playbackRate = Number(event.target.value); }}><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option></select></label></div>
        <audio ref={audio} controls preload="none" aria-label="Learning Guide narration"
          onPlay={() => { document.querySelectorAll('audio').forEach(item => { if (item !== audio.current) item.pause(); }); syncClock(); }}
          onPlaying={syncClock} onPause={syncClock} onTimeUpdate={syncClock} onSeeking={syncClock} onSeeked={syncClock} onLoadedMetadata={syncClock} onDurationChange={syncClock}
          onEnded={() => {
          syncClock();
          if (autoContinue && !step.waitForStudent && index < steps.length - 1) select(index + 1, true, followHighlights);
          else setNotice(step.waitForStudent ? 'Your turn. Complete the action, then choose Next section.' : 'Narration finished. Continue when ready.');
        }} onError={() => setNotice('Audio playback failed. The transcript remains available.')} />
        {timeline && <p className="guide-timing-source">{timeline.source === 'inworld-word' ? 'Red rectangles follow Inworld word timestamps and the actual audio position. Pause freezes the cue; seek and replay move it.' : 'This recording has no matching word timestamps. The whole section remains outlined; sentence timing is unavailable.'}</p>}
        {spokenText && <p className="guide-current-speech"><strong>Now explaining:</strong> {spokenText}</p>}
        <details className="guide-transcript"><summary>Read narration transcript</summary><p>{step.text}</p><p><strong>Your turn:</strong> {step.action}</p></details>
        <label><input type="checkbox" checked={autoContinue} onChange={event => setAutoContinue(event.target.checked)} /> Continue narration after audio; always wait for my actions.</label>
        <label className="guide-checkpoint"><input type="checkbox" checked={followHighlights} onChange={event => setFollowHighlights(event.target.checked)} /> Follow highlighted text</label>
        <p className="muted">A narrated tour plays the section you choose. Automatic continuation requests the next recording only when enabled and never runs an exercise.</p>
      </div>
    </>}
    <p role="status" aria-label="Learning Guide status">{loading ? 'Preparing narration. You can pause to cancel.' : notice}</p>
    <details id={`lesson-checklist-${lessonId}`} tabIndex={-1}><summary>My learning checklist ({checked.filter(Boolean).length} / {checkpoints.length})</summary>
      <p>Self-assessment saved in this browser; separate from exercise validation.</p>
      {checkpoints.map((label, i) => <label className="guide-checkpoint" key={label}><input type="checkbox" checked={checked[i]} onChange={event => {
        const next = [...checked]; next[i] = event.target.checked; setChecked(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setNotice('Checklist works here but browser storage is unavailable.'); }
        notifyLearningProgress();
      }} />{label}</label>)}
    </details>
    <LessonNotebook lessonId={lessonId} />
  </aside>;
}
