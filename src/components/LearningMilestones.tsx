import type { MouseEvent } from 'react';
import { learningMilestones } from '../../shared/learning-milestones';
import { routeHref } from '../lessons/navigation';
import { milestoneWalkthroughs } from '../../shared/milestone-walkthroughs';
import { MiniProjects } from './MiniProjects';

export function LearningMilestones({ selectedPathId, availableIds, onNavigate }: {
  selectedPathId: string | null; availableIds: readonly number[];
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: number) => void;
}) {
  return <section id="course-learning-milestones" className="learning-milestones" aria-labelledby="milestones-heading" tabIndex={-1}>
    <h3 id="milestones-heading">Build a milestone project</h3>
    <MiniProjects />
    <h3>Offline practice projects</h3>
    <p>Practise with three offline projects. Use Node 24 or newer; no dependency installation, API key or provider request is needed. Starters are intentionally incomplete, so their initial tests fail. Download, edit and test them in a separate study folder.</p>
    <div className="learning-path-grid">{learningMilestones.map(project => <article key={project.id} className={selectedPathId === project.pathId || selectedPathId === 'complete-course' ? 'learning-path-card path-selected' : 'learning-path-card'}>
      <h4>{project.title}</h4><p>{project.summary}</p>
      {(selectedPathId === project.pathId || selectedPathId === 'complete-course') && <p><strong>Suggested for your selected path.</strong></p>}
      <p>Preparation: {project.lessons.filter(id => availableIds.includes(id)).map((id, index) => <span key={id}>{index ? ', ' : ''}<a href={routeHref(id)} onClick={event => onNavigate(event, id)}>Lab {String(id).padStart(2, '0')}</a></span>)}</p>
      <details><summary>Requirements and hints</summary><ul>{project.requirements.map(item => <li key={item}>{item}</li>)}</ul><h5>Hints</h5><ul>{project.hints.map(item => <li key={item}>{item}</li>)}</ul></details>
      <p><a className="button" href={`/api/learning-milestones/${project.id}/starter.zip`} download>Download {project.title} starter</a></p>
      <p>Extract the ZIP, open its {project.id} folder in a terminal, then run:</p><pre className="milestone-command"><code>node --test starter.test.mjs</code></pre>
      <p>Implement the TODOs in starter.ts until the tests pass. Record your output and limitations in your lesson notebook. The platform does not execute your edited files or automatically mark this project complete.</p>
      <details className="milestone-walkthrough"><summary>Solution walkthrough and reference download</summary>
        <p>Optional help: try the starter first, or study the working reference in a separate folder. Downloading a reference does not validate your own implementation.</p>
        <h5>Step by step</h5><ol>{milestoneWalkthroughs[project.id].steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p><strong>Expected reference result:</strong> {milestoneWalkthroughs[project.id].tests} passed, 0 failed.</p>
        <h5>If your tests fail</h5><ul>{milestoneWalkthroughs[project.id].pitfalls.map(tip => <li key={tip}>{tip}</li>)}</ul>
        <p><strong>Try one more check:</strong> {milestoneWalkthroughs[project.id].extension}</p>
        <p><a className="button" href={`/api/learning-milestones/${project.id}/reference.zip`} download>Download {project.title} reference</a></p>
        <p>Extract into a new folder, open its {project.id} subfolder and run the same test command. Keep your own solution before replacing any files.</p>
        <p><a href={routeHref(milestoneWalkthroughs[project.id].notebookLesson)} onClick={event => onNavigate(event, milestoneWalkthroughs[project.id].notebookLesson)}>Record your result in Lab {String(milestoneWalkthroughs[project.id].notebookLesson).padStart(2, '0')} using Open notebook</a></p>
      </details>
    </article>)}</div>
  </section>;
}
