export const infographicLessons = [1, 12, 65] as const;
export type InfographicKind = 'concepts' | 'lab';
export type InfographicRegion = {
  id: string; title: string; summary: string; narration: string;
  target: 'goal' | 'preparation' | 'example' | 'controls' | 'evidence' | 'source' | 'practice';
  source: string; box: { x: number; y: number; width: number; height: number };
};
export type LessonInfographic = { lessonId: number; kind: InfographicKind; title: string; regions: InfographicRegion[] };
type Card = [title: string, summary: string, narration: string, target: InfographicRegion['target'], source: string];
function visual(lessonId: number, kind: InfographicKind, title: string, cards: Card[]): LessonInfographic {
  return { lessonId, kind, title, regions: cards.map(([title, summary, narration, target, source], index) => ({
    id: `${kind}-region-${index + 1}`, title, summary, narration, target, source,
    box: { x: 3 + index % 3 * 32, y: index < 3 ? 18 : 57, width: 30, height: 35 },
  })) };
}
export const lessonInfographics: LessonInfographic[] = [
  visual(1, 'concepts', 'Session event streaming', [
    ['Session identity', 'Keep session metadata separate from answer text.', 'The session panel identifies the session and its configuration. It is metadata, not the answer and not proof that the current turn completed. Keep that identity while following the other panels.', 'goal', 'shared/lab01-events.ts'],
    ['Streaming preview', 'Deltas are provisional while the answer arrives.', 'The text preview helps you follow a response as it streams. A visible preview alone does not establish success. If the stream ends early, it may remain incomplete.', 'example', 'server/lib/session-events.ts'],
    ['Authoritative message', 'The final agent.message replaces its matching preview.', 'The authoritative agent message replaces its matching preview instead of being appended again. Compare the message identity and final text so the same answer is not displayed twice.', 'evidence', 'server/lib/session-events.ts'],
    ['Lifecycle evidence', 'Running and idle events describe the turn lifecycle.', 'Lifecycle events tell you when the session is running and when it becomes idle. Read the stop reason as well as the status. Idle with end turn supports normal completion; other reasons can mean a pause.', 'evidence', 'server/lib/lab01-run.ts'],
    ['Explicit outcome', 'Completed, paused, error and incomplete are distinct.', 'Read the reported outcome independently from the answer text. A partial answer can coexist with an error or an incomplete stream. Requires action and budget reached are not normal successful completion.', 'evidence', 'server/lib/lab01-run.ts'],
    ['Execution boundary', 'Offline evidence is authored. Live evidence needs a real run.', 'An offline fixture teaches the event contract without calling a model. A live run is separate evidence and can incur charges. A local browser cancel does not by itself prove remote interruption or cleanup.', 'practice', 'server/lib/lab01-port.ts'],
  ]),
  visual(1, 'lab', 'Trace one turn from stream to outcome', [
    ['Choose offline', 'Select Normal turn and keep the baseline prompt.', 'Open the exercise and choose the Normal turn offline scenario. Keep the baseline prompt so you can compare the result with later scenarios. Viewing this illustration never starts the exercise for you.', 'preparation', 'server/lib/lab01-fixtures.ts'],
    ['Run the fixture', 'Click Run offline fixture yourself.', 'Press Run offline fixture in the exercise. Watch the separate session, text, raw event and outcome panels. This baseline is authored evidence and makes no model provider request.', 'controls', 'server/lib/lab01-fixtures.ts'],
    ['Compare text', 'Watch the authoritative message replace its preview.', 'Locate the authoritative agent message. Compare it with the preview and confirm that the preview was replaced. The final answer should not appear twice because two event representations arrived.', 'evidence', 'server/lib/session-events.ts'],
    ['Verify completion', 'Inspect idle, stop reason and the reported outcome.', 'Inspect the idle lifecycle event, its stop reason and the outcome panel together. In the normal fixture, end turn supports completed. Text appearing on its own is not the completion signal.', 'evidence', 'server/lib/lab01-run.ts'],
    ['Compare failures', 'Try repeated events, Stream ended and Session error.', 'Change one offline scenario at a time. Repeated events test deduplication. Stream ended demonstrates incomplete evidence. Session error demonstrates a failure even when some text has already arrived.', 'example', 'server/lib/lab01-fixtures.ts'],
    ['Reflect and record', 'Explain the evidence before saving your note.', 'Explain which message is authoritative and which lifecycle evidence supports the outcome. Save your observation in the lesson notebook. A saved note or checked learning box is self assessment, not a new verified run.', 'practice', 'shared/lab01-events.ts'],
  ]),
  visual(12, 'concepts', 'A host queue around one retained session', [
    ['Retained session', 'Multiple messages can share one session identity.', 'This lesson retains one session while several messages are processed. Track its identity across turns. The host queue controls admission and ordering; this is not an Agent SDK asynchronous input generator.', 'goal', 'shared/lab12-streaming-input.ts'],
    ['Local admission', 'A local command ID means the host accepted work.', 'When a message passes local validation, the host admits a command and assigns its own command identifier. Admission is not the same as provider acceptance and does not mean the turn has completed.', 'example', 'server/lib/lab12-queue.ts'],
    ['Wait while busy', 'A follow-up waits for completed idle evidence.', 'If the first message is still running, the next command stays in the host queue. It waits for completed idle evidence before submission. Follow the waiting count instead of assuming two simultaneous provider turns.', 'controls', 'server/lib/lab12-queue.ts'],
    ['Provider acceptance', 'Keep user event IDs separate from command IDs.', 'A provider accepted user event has its own identity. Keep it distinct from the host command identifier. Correlate the accepted event, later messages and the outcome rather than treating all identifiers as interchangeable.', 'evidence', 'server/lib/lab12-port.ts'],
    ['Turn outcome', 'Inspect each result and the shared session identity.', 'Inspect the reported result for each queued command. A completed first turn does not automatically certify a later turn. Verify both outcomes and confirm that the retained session identity is the one you expected.', 'evidence', 'server/lib/lab12-queue.ts'],
    ['Explicit close', 'Close cancels waiting work and reports cleanup.', 'Closing the queue is an explicit operation. Waiting commands should be cancelled before submission, and cleanup evidence should describe what happened. Offline simulated cleanup and confirmed live archival are different evidence sources.', 'practice', 'server/lib/lab12-queue.ts'],
  ]),
  visual(12, 'lab', 'Queue a follow-up and inspect its evidence', [
    ['Create offline session', 'Start a local baseline and note its session ID.', 'Choose Create offline session in the exercise and note its session identity. This creates the authored local baseline. Opening the infographic does not create any queue or session.', 'preparation', 'server/concepts/12-streaming-input.ts'],
    ['Send one message', 'Queue Normal and inspect both kinds of IDs.', 'Queue one Normal message. Inspect the host command identifier and returned user event identifier separately. Read its outcome before interpreting the baseline as complete.', 'controls', 'server/lib/lab12-queue.ts'],
    ['Queue while busy', 'Choose Slow, then queue a follow-up.', 'Choose Slow and queue a message. While it is busy, queue a follow up. The follow up should wait rather than immediately starting a second provider turn. Watch the waiting commands evidence.', 'example', 'server/lib/lab12-queue.ts'],
    ['Verify ordering', 'Both turns complete in the retained session.', 'Inspect both command results and their event correlations. Check that the follow up started after the first completed idle boundary and that both results refer to the retained session.', 'evidence', 'server/lib/lab12-port.ts'],
    ['Test rejection', 'An oversized message fails before submission.', 'Try a message longer than the allowed limit. It should be rejected before provider submission. A rejected input must not be counted as an accepted or completed turn.', 'practice', 'shared/lab12-streaming-input.ts'],
    ['Close pending work', 'Close a Hang run and inspect waiting cancellations.', 'Use the Hang scenario with waiting work, then choose Close queue and clean up. Inspect cancelled before submission for waiting commands. Record the cleanup source; an offline simulation is not proof of a live archive.', 'practice', 'server/lib/lab12-queue.ts'],
  ]),
  visual(65, 'concepts', 'A notification is not an approval', [
    ['Immutable proposal', 'Bind the exact fictional action and case.', 'The proposed action is a fictional case archive with fixed validated arguments. Review the immutable proposal. An agent message or tool proposal must not execute the business effect by itself.', 'goal', 'shared/lab65-human-approval.ts'],
    ['Separate identities', 'Tool event ID and business key have different roles.', 'The tool event identifier correlates the tool interaction. The business key identifies the effect that must remain unique. Do not use a new proposal or a different event identifier to repeat the same case effect.', 'source', 'server/concepts/65-human-approval.ts'],
    ['Notification only', 'Local, Slack, Teams or email delivery is not consent.', 'Notification asks someone to review. It is not an approval decision. The local notification path sends no external message; optional external delivery requires separate configured channels and explicit learner action.', 'controls', 'server/concepts/65-human-approval.ts'],
    ['Trusted reviewer', 'Check identity, expiry and the unchanged action.', 'The host validates the trusted reviewer, proposal owner, notification state, expiry and exact action. A changed argument, wrong reviewer or expired proposal must be refused before an effect is allowed.', 'evidence', 'server/concepts/65-human-approval.ts'],
    ['Effect ledger', 'A unique business key prevents duplicate effects.', 'The SQLite effect ledger records the fictional effect independently of agent prose. A repeated click or a second proposal for the same owner and case must not increase the effect count beyond one.', 'evidence', 'server/concepts/65-human-approval.ts'],
    ['Audit the boundary', 'Inspect the ledger and audit, not just the answer.', 'Compare the audit and effect ledger with the human decision. Rejection leaves no effect. Successful local approval demonstrates this fictional local gate; it does not prove delivery through Slack, Teams or email.', 'practice', 'server/concepts/65-human-approval.ts'],
  ]),
  visual(65, 'lab', 'Review one fictional case archive', [
    ['Preview proposal', 'Inspect the pending action. Effects stay at zero.', 'Choose Preview proposal in the exercise. Inspect the fictional case, immutable action, tool event identifier and business key. The effect count should still be zero after preview.', 'preparation', 'shared/lab65-human-approval.ts'],
    ['Notify locally', 'Prepare review without sending an external message.', 'Choose Notify locally for the baseline. This records local notification only, without sending Slack, Teams or email. The effect count remains zero because notification does not authorize the archive.', 'controls', 'server/concepts/65-human-approval.ts'],
    ['Inspect guards', 'Try a changed action or an invalid reviewer.', 'Read the reviewer and immutable proposal. Try the changed action or wrong reviewer scenarios. The host should block the decision before any fictional archive effect is recorded.', 'example', 'server/concepts/65-human-approval.ts'],
    ['Decide explicitly', 'A trusted reviewer approves or rejects.', 'Choose the trusted reviewer approval yourself, or test rejection on a fresh proposal. Approval can record one fictional effect after the checks pass. Rejection is terminal and records no archive effect.', 'controls', 'server/concepts/65-human-approval.ts'],
    ['Try duplicate click', 'Repeat approval and confirm the count stays one.', 'After a valid approval, choose Duplicate click. Read the already decided result and inspect the effect count. A repeated decision must not create another effect, and a new proposal must not bypass the business key.', 'evidence', 'server/concepts/65-human-approval.ts'],
    ['Record the evidence', 'Compare the effect ledger, decision and audit.', 'Record the observed decision, effect count and audit evidence in your notebook. State whether notification was local or externally delivered. Do not describe a local demonstration as verified external messaging.', 'practice', 'server/concepts/65-human-approval.ts'],
  ]),
];
export const infographicKey = (lessonId: number, kind: InfographicKind) => `${lessonId}:${kind}`;
// Measured against the final 1536 x 1024 artwork, rather than assuming that
// generation followed the requested grid exactly. Values are percentages.
const artworkBoxes: Record<string, { columns: number[]; widths: number[]; rows: [number, number][] }> = {
  '1:concepts': { columns: [2.1, 34.6, 66.4], widths: [31.6, 30.9, 31.6], rows: [[16.4, 39.8], [58.1, 36.0]] },
  '1:lab': { columns: [2.1, 34.4, 66.6], widths: [31.4, 31.3, 31.3], rows: [[18.2, 34.1], [54.2, 36.8]] },
  '12:concepts': { columns: [2.1, 34.7, 66.6], widths: [31.4, 30.7, 31.3], rows: [[16.6, 37.1], [55.4, 37.1]] },
  '12:lab': { columns: [1.9, 35.1, 66.5], widths: [31.7, 30, 31.7], rows: [[17.1, 35.2], [55, 35.1]] },
  '65:concepts': { columns: [1.9, 34.7, 66.8], widths: [31.4, 30.8, 31.5], rows: [[16, 37.8], [55.7, 37.6]] },
  '65:lab': { columns: [1.9, 35, 67], widths: [31.2, 30.3, 31.2], rows: [[14.5, 38], [55, 37.2]] },
};
for (const item of lessonInfographics) item.regions.forEach((region, index) => {
  const box = artworkBoxes[infographicKey(item.lessonId, item.kind)]!, row = box.rows[index < 3 ? 0 : 1]!;
  region.box = { x: box.columns[index % 3]!, y: row[0], width: box.widths[index % 3]!, height: row[1] };
});
export const infographicSegments = (visual: LessonInfographic) => visual.regions.map(region => ({ id: region.id, text: `${region.title}. ${region.narration}`, kind: 'explanation' as const }));
export const infographicText = (visual: LessonInfographic) => infographicSegments(visual).map(segment => segment.text).join(' ');

export function infographicPrompt(visual: LessonInfographic) {
  return `Use case: infographic-diagram. Asset type: a complete illustrated educational PNG infographic for an existing Claude Managed Agents course. Brand-new artwork, accurate teaching content, landscape 3:2 canvas, high resolution and crisp readable English typography.
Audience: software developers. Style: polished illustrated workbook, warm white background, navy headings, blue and teal accents, thin connector arrows and restrained orange caution details. Relevant small technical illustrations in each card; no mascot required. No photographs, screenshots of real accounts, secrets or claims of real execution.
Layout is critical for synchronized highlights: a header in the top 14% of the canvas. Exactly six equal rectangular teaching cards in a three-column, two-row grid. Card left edges at 3%, 35%, 67%; each card width 30%. Top-row cards span y=18% through y=53%. Bottom-row cards span y=57% through y=92%. Keep all illustration and card text inside each respective card. Do not put red highlight rectangles into the artwork. Number cards 1 through 6 in left-to-right reading order, then the second row. Use bold card titles, large concise body text and a meaningful icon or miniature diagram. Keep the content clear at normal screen size.
Header text verbatim: "LAB ${String(visual.lessonId).padStart(2, '0')} / ${visual.kind === 'concepts' ? 'CONCEPT MAP' : 'LAB WALKTHROUGH'}" and "${visual.title}".
The exact text for each card is:
${visual.regions.map((region, index) => `${index + 1}. "${region.title}" / "${region.summary}"`).join('\n')}
Footer text verbatim: "Illustrated teaching summary. Run the exercise to inspect actual evidence."
Render the specified copy accurately, with no invented API calls, endpoint names, code snippets, extra cards or extra paragraphs. Distinguish Claude Managed Agents from Claude Agent SDK. All artwork stays inside the complete canvas; do not crop any card.`;
}
