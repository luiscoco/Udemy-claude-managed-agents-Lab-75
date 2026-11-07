import { useEffect, useState } from 'react';
import type { MiniProjectStatus } from '../../shared/mini-projects';
import { ReadableMarkdown } from './ReadableMarkdown';
import { CodeBlock } from './CodeBlock';
import '../mini-projects.css';

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/projects${path}`, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.message ?? 'The project request failed.');
  return data as T;
}
function ProjectCard({ project, refresh }: { project: MiniProjectStatus; refresh: () => Promise<void> }) {
  const [mode, setMode] = useState<'learner' | 'reference'>('learner');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [stages, setStages] = useState<{ id: string; title: string; prompt: string }[] | null>(null);
  const [stagesBusy, setStagesBusy] = useState(false), [stageError, setStageError] = useState('');
  async function action(kind: 'start' | 'stop') {
    setBusy(true); setError('');
    try { await request(`/${project.id}/${kind}`, kind === 'start' ? { mode } : {}); await refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Project request failed.'); }
    finally { setBusy(false); }
  }
  async function loadStages() {
    if (stages || stagesBusy) return;
    setStagesBusy(true); setStageError('');
    try { setStages((await request<{ stages: NonNullable<typeof stages> }>(`/${project.id}/stages`)).stages); }
    catch { setStageError('Could not load the build prompts. Close and reopen this section to retry.'); }
    finally { setStagesBusy(false); }
  }
  return <article className="learning-card mini-project-card" aria-labelledby={`${project.id}-heading`}>
    <p className="phase-label">{project.stages}</p><h4 id={`${project.id}-heading`}>{project.title}</h4>
    <p>{project.summary}</p><p>Preparation: <a href={`/?lesson=${project.prerequisite}`}>Lab {String(project.prerequisite).padStart(2, '0')}</a></p>
    <label htmlFor={`${project.id}-mode`}>Workspace mode</label>
    <select id={`${project.id}-mode`} value={mode} disabled={busy || project.status !== 'stopped'} onChange={event => setMode(event.target.value as typeof mode)}>
      <option value="learner">Learner workspace</option><option value="reference">Reference preview</option>
    </select>
    <p className="muted">Both modes show a working starter. Build the stages in your own copy; opening a reference does not complete your work.</p>
    <p role="status">{busy ? 'Updating project…' : `Status: ${project.status}${project.mode ? ` · ${project.mode}` : ''}`}</p>
    {!project.dependenciesReady && <p>Install dependencies from the course folder with <code>npm run projects:install</code>.</p>}
    <div className="mini-project-actions">
      <button type="button" disabled={busy || project.status !== 'stopped' || !project.dependenciesReady} onClick={() => void action('start')}>Start {project.title}</button>
      <button type="button" className="button-secondary" disabled={busy || project.status !== 'running'} onClick={() => void action('stop')}>Stop {project.title}</button>
      {project.url && <a className="button" href={project.url} target="_blank" rel="noreferrer">Open {project.title}</a>}
      <a className="button button-secondary" href={`/api/projects/${project.id}/starter.zip`} download>Download {project.title} starter</a>
    </div>
    {project.notice && <p>{project.notice}</p>}{error && <p role="alert">{error}</p>}
    <details onToggle={event => { if (event.currentTarget.open) void loadStages(); }}><summary>Build stages and copyable prompts · {project.stages}</summary>
      {stagesBusy && <p role="status">Loading prompts…</p>}{stageError && <p role="alert">{stageError}</p>}
      {stages?.map(stage => <details key={stage.id} className="mini-project-stage"><summary>{stage.title}</summary>
        <ReadableMarkdown text={stage.prompt} /><details><summary>Copy the full prompt</summary><CodeBlock code={stage.prompt} label={stage.id} lineNumbers={false} /></details>
      </details>)}
    </details>
  </article>;
}
export function MiniProjects() {
  const [projects, setProjects] = useState<MiniProjectStatus[]>([]), [error, setError] = useState('');
  async function refresh() {
    try { setProjects((await request<{ projects: MiniProjectStatus[] }>('')).projects); setError(''); }
    catch { setError('The milestone service is unavailable. Check that the course backend is running.'); }
  }
  useEffect(() => { void refresh(); const timer = setInterval(() => { void refresh(); }, 5000); return () => clearInterval(timer); }, []);
  return <div className="mini-projects">
    <h3>Three guided milestone apps</h3>
    <p>Build Study Coach, Agent Evaluation Studio, and Agent Publishing Studio through 22 cumulative stages. Prepared mode works without a model call. Each optional live run needs fresh consent inside its app.</p>
    <p>All three projects use <strong>Claude Managed Agents</strong>: agents, environments, sessions, streamed events and session budgets. Each app opens in its own tab and keeps its own history. Runtime history clears when its server stops.</p>
    <p>Use Node 24. Download a starter for a separate study folder, then run <code>npm ci</code>, <code>npm test</code>, and <code>npm run dev</code> there. Publishing also uses Python and Playwright Chromium for file extraction and export.</p>
    {error && <p role="alert">{error} <button type="button" onClick={() => void refresh()}>Retry milestone status</button></p>}
    <div className="mini-project-grid">{projects.map(project => <ProjectCard key={project.id} project={project} refresh={refresh} />)}</div>
  </div>;
}
