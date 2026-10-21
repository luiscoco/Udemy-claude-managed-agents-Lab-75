import { useEffect, useRef, useState } from 'react';
import { healthSchema } from '../shared/health';
import type { Health } from '../shared/health';
import homeSource from './Home.tsx?raw';
import healthSource from '../shared/health.ts?raw';
import routerSource from '../server/routes/health.ts?raw';
import type { MouseEvent, ReactNode } from 'react';
import { ManagedFoundation } from './components/ManagedFoundation';
import { topicGroups } from './lessons/navigation';
import { CourseValidation } from './components/CourseValidation';
import { lessonSectionHref } from './lib/learning-shortcuts';

export function Home({ invalid, lessonCount, startHref, onStart, progress }: { invalid: boolean; lessonCount: number; startHref: string | undefined; onStart: (event: MouseEvent<HTMLAnchorElement>) => void; progress?: ReactNode }) {
  const [health, setHealth] = useState<Health>();
  const [status, setStatus] = useState('Ready to check the backend.');
  const [pending, setPending] = useState(false);
  const [bannerAvailable, setBannerAvailable] = useState(true);
  const illustratedIntro = lessonCount === 75 && bannerAvailable;
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function checkHealth() {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setPending(true);
    setHealth(undefined);
    setStatus('Checking backend…');
    const timer = setTimeout(() => request.abort(new Error('Health check timed out.')), 5_000);
    try {
      const response = await fetch('/api/health', { signal: request.signal });
      if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}.`);
      setHealth(healthSchema.parse(await response.json()));
      setStatus('Backend ready.');
    } catch (error) {
      setStatus(request.signal.aborted
        ? request.signal.reason instanceof Error ? request.signal.reason.message : 'Health check cancelled.'
        : error instanceof Error ? error.message : 'Health check failed.');
    } finally {
      clearTimeout(timer);
      controller.current = null;
      setPending(false);
    }
  }

  return <>
    {invalid && <section className="notice" role="status"><h2>That lesson isn’t available yet.</h2><p>The link contains an invalid or unregistered lesson ID. You’re back at Home; find an implemented lesson in the navigation when one is available.</p></section>}
    <section className={`portal-intro${illustratedIntro ? ' portal-intro-illustrated' : ''}`} aria-labelledby="portal-intro-title">
      <div className="portal-intro-copy">
        <p className="eyebrow">Learn / Build / Experiment</p>
        <h1 id="portal-intro-title">Claude Managed Agents<br /><span>Learning Portal</span></h1>
        <p className="portal-intro-summary">Guided lessons, real source code and practical experiments. Understand how agents work, then build with confidence.</p>
        <p className="portal-intro-author">Your instructor: <strong>Luis Coco Enríquez</strong></p>
      </div>
      {illustratedIntro && <img className="portal-intro-image" src={`${import.meta.env.BASE_URL}images/portal-welcome.png`} width={1672} height={941}
        alt="Portal introduction: learn with guided lessons and narration, build hands-on experiments, and understand source code and evidence. Instructor Luis Coco Enríquez with his two dogs and the course astronaut mascot."
        fetchPriority="high" onError={() => setBannerAvailable(false)} />}
    </section>
    {illustratedIntro && <p className="portal-original-link"><a href={`${import.meta.env.BASE_URL}images/portal-welcome.png`} target="_blank" rel="noopener noreferrer">Open cover at original resolution (1672 x 941)</a></p>}
    <div className="hero-actions">{startHref ? <a className="button" href={startHref} onClick={onStart}>Start with Lab 01 <span aria-hidden="true">&rarr;</span></a> : <span className="muted">Lab 01 is coming next.</span>}<span className="muted">{lessonCount} implemented {lessonCount === 1 ? 'lesson' : 'lessons'}</span></div>
    <p className="home-guide-hint">Open a lab and choose <strong>Open notebook</strong>, <strong>Open checklist</strong> or <strong>Open exercise</strong> beside its title. These shortcuts are also in the lesson menu and Course progress. Choose <strong>Open Learning Guide</strong> for voice narration and highlighted steps.</p>
    <section id="course-start-here" className="learning-card" tabIndex={-1} aria-labelledby="start-here-heading">
      <p className="phase-label">Your first steps</p><h2 id="start-here-heading">Start here</h2>
      <p>Try one example, keep a note, then build something. Follow these steps at your own pace or open any lesson directly.</p>
      <ol className="build-sequence">
        <li><strong>Inspect an event stream.</strong> Open Lab 01, choose its offline mode and run the example. Compare the answer text with the lifecycle events and turn outcome.
          {startHref && <p><a href={lessonSectionHref(1, 'exercise')} onClick={onStart}>Open Lab 01 exercise</a></p>}</li>
        <li><strong>Save what you observed.</strong> Record the outcome and one question in the lesson notebook, then choose Save note. Notes stay in this browser; use a learning backup to keep a copy.
          {startHref && <p><a href={lessonSectionHref(1, 'notebook')} onClick={onStart}>Open Lab 01 notebook</a></p>}</li>
        <li><strong>Build a milestone project.</strong> Start with the Event stream evidence viewer. Download its starter into a separate study folder and follow its test instructions. These projects use Node 24 or newer and need no API key.
          <p><a href="#course-learning-milestones">Open milestone projects</a></p></li>
      </ol>
      <p className="muted">Opening a link does not start an exercise. Live scenarios are optional and billed when you explicitly run them.</p>
    </section>
    {progress}
    <CourseValidation />
    <section className="learning-card" aria-labelledby="system-heading"><p className="eyebrow">THE FOUR PARTS</p><h2 id="system-heading">Know what runs where.</h2>
      <div className="system-grid">
        <article data-tone="blue"><span className="step-number">01 / BROWSER</span><h3>Frontend</h3><p>React renders lessons, collects input, and displays events. Navigation chooses a lesson; only an explicit Run action starts an exercise.</p></article>
        <article data-tone="orange"><span className="step-number">02 / NODE</span><h3>Backend</h3><p>Express validates requests, applies host policies, and owns execution. Credentials and privileged operations belong here.</p></article>
        <article data-tone="red"><span className="step-number">03 / EXECUTION</span><h3>Managed runtime</h3><p>Anthropic runs the agent harness and sandbox. The backend creates managed sessions and relays their events. Each lab supplies its specified scripted or guided path alongside any supported live execution.</p></article>
        <article data-tone="purple"><span className="step-number">04 / CONTRACT</span><h3>Protocol</h3><p>Typed requests, stable events, errors, and terminal outcomes connect the layers. Exercises use a POST event stream to carry validated events and a terminal result to the browser.</p></article>
      </div>
    </section>
    <section aria-labelledby="sequence-heading"><h2 id="sequence-heading">Build in small, inspectable steps.</h2><ol className="build-sequence"><li><strong>Establish the foundation.</strong> Connect React and Express with a health contract.</li><li><strong>Trace a deterministic run.</strong> Validate input, observe events, and inspect the outcome in the scripted or guided path for each lab.</li><li><strong>Grow the course.</strong> Add a working lab, its registry entry, and evidence before exposing it in navigation.</li></ol></section>
    <section aria-labelledby="topics-heading"><h2 id="topics-heading">Where the course is heading</h2><p>These are the planned topic groups. Lessons become navigable as they are implemented.</p><ul className="topic-roadmap">{topicGroups.map((topic) => <li key={topic}>{topic}</li>)}</ul></section>
    <section className="exercise-frame" aria-labelledby="health-heading">
      <h2 id="health-heading">Backend readiness</h2>
      <p>Check the local API. This request does not call Claude or inspect credentials.</p>
      <div className="actions">
        <button disabled={pending} onClick={() => void checkHealth()}>Check backend</button>
        {pending && <button className="button-secondary" onClick={() => controller.current?.abort('cancelled')}>Cancel</button>}
      </div>
      <p role="status" aria-live="polite">{status}</p>
      {health && <details open><summary>Raw API evidence</summary><pre>{JSON.stringify(health, null, 2)}</pre></details>}
    </section>
    <ManagedFoundation />
    <section className="source-card" aria-labelledby="source-heading">
      <h2 id="source-heading">Read the real source</h2>
      <p>These are the actual authored files, included as text at build time.</p>
      <details><summary>src/Home.tsx</summary><pre>{homeSource}</pre></details>
      <details><summary>shared/health.ts</summary><pre>{healthSource}</pre></details>
      <details><summary>server/routes/health.ts</summary><pre>{routerSource}</pre></details>
    </section>
  </>;
}
