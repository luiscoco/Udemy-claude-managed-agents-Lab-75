import { useEffect, useRef, useState } from 'react';
import { learningGuide, type GuideView } from '../../shared/learning-guide';

const checkpoints = ['I can explain the objective.', 'I ran an example and inspected its evidence.', 'I connected the result to the source.', 'I tried the challenge.'];
export function LearningGuide({ lessonId, view, onView, workspace }: {
  lessonId: number; view: number; onView: (view: GuideView) => void; workspace: React.RefObject<HTMLDivElement | null>;
}) {
  const steps = learningGuide(lessonId), [index, setIndex] = useState<number | null>(null);
  const [revision, setRevision] = useState(0), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState<{ ready: boolean; voiceId: string; missing: string[] }>();
  const [autoContinue, setAutoContinue] = useState(false), [compact, setCompact] = useState(false), [speed, setSpeed] = useState('1');
  const storageKey = `managed-learning-checklist-${lessonId}`;
  const [checked, setChecked] = useState<boolean[]>(() => { try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    return checkpoints.map((_, i) => Array.isArray(saved) && saved[i] === true);
  } catch { return checkpoints.map(() => false); } });
  const audio = useRef<HTMLAudioElement>(null), start = useRef<HTMLButtonElement>(null);
  const pending = useRef<AbortController | null>(null), generation = useRef(0), clip = useRef<{ key: string; url: string } | null>(null);
  const step = index === null ? undefined : steps[index];
  function stop() {
    generation.current++; pending.current?.abort(); pending.current = null; audio.current?.pause(); setLoading(false);
  }
  function release() { if (clip.current) URL.revokeObjectURL(clip.current.url); clip.current = null;
    if (audio.current) { audio.current.removeAttribute('src'); audio.current.load(); } }
  function select(next: number) { stop(); release(); setNotice(''); setIndex(next); onView(steps[next]!.view); setRevision(value => value + 1); }
  function close() { stop(); release(); setIndex(null); setNotice(''); start.current?.focus(); }
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/learning-guide/status', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error(); return response.json();
    }).then(setSetup).catch(() => { if (!controller.signal.aborted) setNotice('Voice setup could not be checked. The written guide remains available.'); });
    return () => controller.abort();
  }, []);
  useEffect(() => () => { generation.current++; pending.current?.abort(); audio.current?.pause(); if (clip.current) URL.revokeObjectURL(clip.current.url); }, []);
  useEffect(() => {
    if (!step || view !== step.view) return;
    let target: HTMLElement | undefined;
    const locate = () => {
      const found = workspace.current?.querySelector<HTMLElement>(`[data-guide-target="${step.id}"]`);
      if (!found || !found.getClientRects().length) return;
      if (found instanceof HTMLDetailsElement) found.open = true;
      target = found; found.classList.add('learning-guide-highlight');
      found.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      return true;
    };
    const interval = window.setInterval(() => { if (locate()) clearInterval(interval); }, 100);
    if (locate()) clearInterval(interval);
    const deadline = window.setTimeout(() => { clearInterval(interval); if (!target) setNotice('This section is not ready. Use Show section to try again.'); }, 5000);
    return () => { clearInterval(interval); clearTimeout(deadline); target?.classList.remove('learning-guide-highlight'); };
  }, [index, revision, view]);
  useEffect(() => { if (step && view !== step.view) { stop(); setNotice('You changed views. Choose Show section to return to this guide step.'); } }, [view]);
  useEffect(() => { if (index === null) return; const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [index]);
  async function play(replay = false) {
    if (!step || !audio.current) return; setNotice('');
    const key = `${lessonId}:${step.id}`;
    if (clip.current?.key !== key) {
      stop(); release(); const token = generation.current, controller = new AbortController(); pending.current = controller; setLoading(true);
      try {
        const response = await fetch('/api/learning-guide/audio', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Learning-Guide': '1' },
          body: JSON.stringify({ lessonId, stepId: step.id }), signal: controller.signal });
        if (!response.ok) { const error = await response.json(); throw new Error(error.message ?? 'Voice narration unavailable. Read the transcript below.'); }
        if (!response.headers.get('Content-Type')?.includes('audio/mpeg')) throw new Error('Invalid narration response. Read the transcript below.');
        const blob = await response.blob(); if (token !== generation.current) return;
        clip.current = { key, url: URL.createObjectURL(blob) }; audio.current!.src = clip.current.url;
      } catch (error) { if (token === generation.current && !controller.signal.aborted) setNotice(error instanceof Error ? error.message : 'Narration unavailable.'); return; }
      finally { if (token === generation.current) { setLoading(false); pending.current = null; } }
    }
    if (!audio.current) return;
    if (replay) audio.current.currentTime = 0;
    audio.current.playbackRate = Number(speed);
    document.querySelectorAll('audio').forEach(item => { if (item !== audio.current) item.pause(); });
    try { await audio.current.play(); } catch { setNotice('Use the audio player Play control to start the recording.'); }
  }
  return <aside className={`learning-voice-guide${index !== null ? ' guide-active' : ''}${compact ? ' guide-compact' : ''}`} aria-label="Learning Guide">
    <div className="guide-heading"><div><p className="phase-label">Listen / Read / Practice</p><h2>Learning Guide</h2></div>
      <button ref={start} type="button" onClick={() => select(0)}>{index === null ? 'Start guided tour' : 'Restart tour'}</button></div>
    {index === null ? <p>Follow this lab section by section with explanations, voice narration and a red highlight. You control every exercise action.</p> : step && <>
      <div className="guide-toolbar"><span>Step {index + 1} of {steps.length}</span><button onClick={() => setCompact(value => !value)} aria-expanded={!compact}>{compact ? 'Expand guide' : 'Minimize guide'}</button><button onClick={stop}>Pause</button><button onClick={close}>Close guide</button></div>
      <h3 aria-live="polite">{step.title}</h3>
      <div className="guide-toolbar"><button disabled={index === 0} onClick={() => select(index - 1)}>Previous section</button><button onClick={() => select(index)}>Show section</button>{index < steps.length - 1 ? <button onClick={() => select(index + 1)}>Next section</button> : <button onClick={close}>Finish tour</button>}</div>
      <div hidden={compact} className="guide-scroll-body">
        <p className="guide-your-turn"><strong>Your turn:</strong> {step.action}</p>
        <p className="guide-voice-status">{setup?.ready ? `Inworld voice: ${setup.voiceId}. Audio is generated only when you press Play; provider charges may apply.` : 'Written guidance is ready. Configure Inworld on the server to enable voice narration.'}</p>
        <div className="guide-toolbar"><button disabled={loading || !setup?.ready} onClick={() => void play()}>Play narration</button><button onClick={stop}>Pause narration</button><button disabled={loading || !setup?.ready} onClick={() => void play(true)}>Replay narration</button>
          <label>Playback speed <select value={speed} onChange={event => { setSpeed(event.target.value); if (audio.current) audio.current.playbackRate = Number(event.target.value); }}><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option></select></label></div>
        <audio ref={audio} controls preload="none" aria-label="Learning Guide narration" onEnded={() => {
          if (autoContinue && !step.waitForStudent && index < steps.length - 1) select(index + 1);
          else setNotice(step.waitForStudent ? 'Your turn. Complete the action, then choose Next section.' : 'Narration finished. Continue when ready.');
        }} onError={() => setNotice('Audio playback failed. The transcript remains available.')} />
        <details className="guide-transcript"><summary>Read narration transcript</summary><p>{step.text}</p><p><strong>Your turn:</strong> {step.action}</p></details>
        <label><input type="checkbox" checked={autoContinue} onChange={event => setAutoContinue(event.target.checked)} /> Move to the next section after audio; always wait for my actions.</label>
        <p className="muted">Moving sections does not generate the next recording. Press Play when ready.</p>
      </div>
    </>}
    <p role="status" aria-label="Learning Guide status">{loading ? 'Preparing narration. You can pause to cancel.' : notice}</p>
    <details><summary>My learning checklist ({checked.filter(Boolean).length} / {checkpoints.length})</summary>
      <p>Self-assessment saved in this browser; separate from exercise validation.</p>
      {checkpoints.map((label, i) => <label className="guide-checkpoint" key={label}><input type="checkbox" checked={checked[i]} onChange={event => {
        const next = [...checked]; next[i] = event.target.checked; setChecked(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setNotice('Checklist works here but browser storage is unavailable.'); }
      }} />{label}</label>)}
    </details>
  </aside>;
}
