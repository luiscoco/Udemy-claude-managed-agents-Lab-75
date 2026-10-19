import { courseValidation as evidence, validationRepository as repository } from '../../shared/course-validation';

function RunEvidence({ runId, commit, children }: { runId: string; commit: string; children: React.ReactNode }) {
  return <p><a href={`${repository}/actions/runs/${runId}`} target="_blank" rel="noopener noreferrer">{children}</a><br />
    Tested commit: <a href={`${repository}/commit/${commit}`} target="_blank" rel="noopener noreferrer"><code>{commit.slice(0, 7)}</code></a></p>;
}

export function CourseValidation() {
  return <section id="course-validation" tabIndex={-1} className="learning-card course-validation" aria-labelledby="course-validation-heading">
    <p className="phase-label">Recorded test evidence</p><h2 id="course-validation-heading">Validation results</h2>
    <p>Verified on <time dateTime={evidence.recordedOn}>19 October 2026</time>. These records cover the commits linked below. Open GitHub for current workflow status; newer changes need their own checks.</p>
    <div className="validation-grid">
      <article className="validation-record" aria-labelledby="offline-validation-heading">
        <h3 id="offline-validation-heading">Offline regression</h3><p className="validation-result">Passed</p>
        <ul><li>{evidence.offline.testsPassed} offline tests passed.</li><li>{evidence.offline.evaluatorTestsPassed} evaluator and setup tests passed.</li>
          <li>{evidence.offline.browserPassed} browser tests passed; {evidence.offline.browserSkipped} optional cached-audio test skipped.</li>
          <li>Production build, distribution scan, source ZIP and artifact upload passed.</li></ul>
        <p>Cleanup: no provider sessions were created by this offline workflow.</p>
        <RunEvidence {...evidence.offline}>Open successful offline run</RunEvidence>
      </article>
      <article className="validation-record" aria-labelledby="live-validation-heading">
        <h3 id="live-validation-heading">Online acceptance</h3><p className="validation-result">All four suites passed</p>
        <ul>{evidence.live.suites.map(suite => <li key={suite.name}>{suite.name}: {suite.sessions} sessions passed.</li>)}</ul>
        <p>Cleanup: all {evidence.live.suites.reduce((total, suite) => total + suite.sessions, 0)} sessions were confirmed archived.</p>
        <p>The engineering team merged all three tasks, passed host acceptance and left no unresolved questions.</p>
        <RunEvidence {...evidence.live}>Open successful online run</RunEvidence>
      </article>
    </div>
    <p>Opening this overview does not run tests, contact a provider or change your learning checklist. This is recorded evidence, not a certification of all 75 live integrations. Slack, Teams, email, AWS, Azure export and Inworld synthesis are outside these live suites.</p>
    <nav className="guide-toolbar" aria-label="Current validation workflows">
      <a href={`${repository}/actions/workflows/regression.yml`} target="_blank" rel="noopener noreferrer">Current offline workflow</a>
      <a href={`${repository}/actions/workflows/live-acceptance.yml`} target="_blank" rel="noopener noreferrer">Current live workflow</a>
      <a href={`${repository}/blob/main/docs/course-validation.md`} target="_blank" rel="noopener noreferrer">Detailed validation report</a>
    </nav>
    <p className="muted">GitHub links open in a new tab and may require sign-in for this private repository. Live execution remains a separate manually confirmed, billed action.</p>
  </section>;
}
