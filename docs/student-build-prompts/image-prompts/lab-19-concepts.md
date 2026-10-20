# Lab 19 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 19 — Concept map"; then "Session inventory and explicit branches". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Kneeling while examining a holographic document with a magnifier, front view with the working prop raised at shoulder level. The prop illustrates Session inventory and explicit branches. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Inventory owned Managed sessions, inspect bounded history pages and derive a fresh conversation from an explicit host summary."
Teaching context for the visual explanation (do not print this entire paragraph): Inventory owned Managed sessions, inspect bounded history pages and derive a fresh conversation from an explicit host summary.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Create fresh context from an explicit host summary."
Teaching context for the visual explanation (do not print this entire paragraph): How is a summary-based conversation derived? Create fresh context from an explicit host summary.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "A fresh summary handoff is distinct from retaining the original session history."
Teaching context for the visual explanation (do not print this entire paragraph): A fresh summary handoff is distinct from retaining the original session history.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Start an offline session and send a second turn to the same session ID."
Teaching context for the visual explanation (do not print this entire paragraph): Start an offline session and send a second turn to the same session ID. Inspect the inventory and history pages, then branch from a selected host event boundary.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Create fresh context from an explicit host summary."
Teaching context for the visual explanation (do not print this entire paragraph): Create fresh context from an explicit host summary. A fresh summary handoff is distinct from retaining the original session history. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Show why a derived conversation is a new session with explicit selected history, not a native fork carrying hidden state."
Teaching context for the visual explanation (do not print this entire paragraph): Show why a derived conversation is a new session with explicit selected history, not a native fork carrying hidden state. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

1. Start an offline session with the Aurora Finch reminder. Note the local conversation ID and remote fixture session ID.
2. Change the prompt and send another turn. Confirm that the same session ID is retained, the turn count increments and host-captured events contain both user and agent messages.
3. Select a host event as the branch boundary, then derive a conversation. Compare the distinct IDs, parent and boundary fields, and the exact handoff summary. Inspect the original again to confirm its history remains intact.
4. Rename and tag an idle session. Archive it and inspect the retained host history. Start a separate offline session and select **Delete selected idle session** to remove that owned fixture. Delete requires the explicit selected action; archive is history-preserving.
5. Use a third turn to create more than one history page. Follow **Load next history page** and check the omission indicator. Try an unknown conversation ID or foreign owner in the API tests; neither can access or mutate it.

The exercise uses `POST /api/c19/turn`, `GET /sessions`, `GET /sessions/:id`, `POST /sessions/:id/rename`, `/tag`, `/branch`, `/archive`, `/delete`, and `POST /reset`. Turn and branch responses are SSE streams. A live provider `sessions.list`, `sessions.retrieve`, or paginated `sessions.events.list` occurs only after explicit inspection, after host ownership checks. Provider listing is a bounded page, so absence from that page is not proof that a host-owned session ceased to exist.


## Evidence to inspect

Compare the retained ID across two turns, then the distinct derived ID and recorded parent/boundary. Verify the original event list is unchanged. Read the summary handoff and both history pages. Archive keeps the host record and captured history; deletion removes the selected owned idle record.


## Limitations

Only confirmed-idle, owned active sessions can be continued, branched, renamed, tagged, archived or deleted. The host retains at most six records and three active records per owner. Prompt, event text, history page, cursor, title and tag lengths are bounded; request objects are closed. The offline reset affects only owned fixture records. Local cancellation does not establish a remote stop; inspect cleanup before retrying. Archive preserves session history, while deletion removes the selected idle remote session and cannot be undone.

The host handoff summarizes selected **observed** text. It can omit older details and loses unobserved context. A branch from a user-message boundary excludes the following agent reply. The provider event page is also limited and may omit more pages. Fixture agent replies are authored examples, not model recall evidence.


## Challenge

Explain why the derived conversation's new session ID and explicit summary are evidence of a host-created branch, rather than native `forkSession` or `resumeSessionAt` semantics.

Official reference: [Managed session operations](https://platform.claude.com/docs/en/managed-agents/session-operations), [Sessions API](https://platform.claude.com/docs/en/api/typescript/beta/sessions), [session event pagination](https://platform.claude.com/docs/en/api/typescript/beta/sessions/events/list) (checked 2026-10-15).


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END
