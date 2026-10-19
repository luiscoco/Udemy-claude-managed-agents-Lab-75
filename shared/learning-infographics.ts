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
// Measured panel bounds in the final 1672 x 941 reference-style artwork.
// Panels have different sizes; the last region is a wide takeaway strip.
const artworkPanels: Record<string, [number, number, number, number][]> = {
  '1:concepts': [[24,217,622,314],[651,217,467,314],[1126,217,523,314],[24,539,965,267],[995,539,654,267],[24,813,1625,91]],
  '1:lab': [[24,217,622,364],[651,217,467,364],[1126,217,523,364],[24,588,965,225],[995,588,654,225],[24,819,1625,85]],
  '12:concepts': [[24,217,645,324],[674,217,444,324],[1126,217,523,324],[24,548,957,270],[988,548,661,270],[24,825,1625,79]],
  '12:lab': [[24,217,621,316],[651,217,467,316],[1126,217,523,316],[24,539,965,263],[995,539,654,263],[24,808,1625,96]],
  '65:concepts': [[24,214,633,329],[663,214,455,329],[1123,214,526,329],[24,550,974,252],[1005,550,644,252],[24,810,1625,94]],
  '65:lab': [[24,217,626,310],[656,217,462,310],[1126,217,523,310],[24,534,965,275],[995,534,654,275],[24,816,1625,88]],
};
for (const item of lessonInfographics) item.regions.forEach((region, index) => {
  const [x, y, width, height] = artworkPanels[infographicKey(item.lessonId, item.kind)]![index]!;
  region.box = { x: x / 1672 * 100, y: y / 941 * 100, width: width / 1672 * 100, height: height / 941 * 100 };
});
const astronautPoses: Record<string, string> = {
  '1:concepts': 'Floating with bent knees, presenting the event stream with an open left palm and holding a glowing message card in the right hand.',
  '1:lab': 'Seated at a violet control laptop, leaning forward to operate the fixture with one hand and pointing to its outcome with the other.',
  '12:concepts': 'Floating diagonally with two separate message envelopes held in outstretched arms, arranging messages for one retained session.',
  '12:lab': 'Crouching to place a message block at the back of a queue, with the other gloved hand raised in a wait gesture.',
  '65:concepts': 'Standing with a proposal clipboard and raising an open STOP palm beside a shield, checking the approval gate.',
  '65:lab': 'Kneeling to inspect an approval ledger with a magnifying glass and pointing to one recorded entry.',
};
export const infographicSegments = (visual: LessonInfographic) => visual.regions.map(region => ({ id: region.id, text: `${region.title}. ${region.narration}`, kind: 'explanation' as const }));
export const infographicText = (visual: LessonInfographic) => infographicSegments(visual).map(segment => segment.text).join(' ');

export function infographicPrompt(visual: LessonInfographic) {
  return `Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab ${String(visual.lessonId).padStart(2, '0')} — ${visual.kind === 'concepts' ? 'Concept map' : 'Lab walkthrough'}"; then "${visual.title}". Astronaut stays in the header and does not cover text. Its unique content-specific pose: ${astronautPoses[infographicKey(visual.lessonId, visual.kind)]}
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
${visual.regions.map((region, index) => `REGION ${index + 1}\nTitle verbatim: "${region.title}"\nSummary verbatim: "${region.summary}"\nTeaching context for the visual explanation (do not print this entire paragraph): ${region.narration}`).join('\n\n')}
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. If event types are shown, use event_start, event_delta, agent.message, session.status_running and session.status_idle in the correct lifecycle order. The fictional approval case is CASE-2042 and its effect business key binds owner and case. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."`;
}
