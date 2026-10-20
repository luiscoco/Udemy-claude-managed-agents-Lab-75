# Lab 17 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 17 — Concept map"; then "Host snapshots and file restoration". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Bracing one knee while checking a shield-shaped control panel, three-quarter side view, looking upward toward the diagram. The prop illustrates Host snapshots and file restoration. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Restore tracked host fixture files from an owned snapshot while the retained Managed conversation remains intact."
Teaching context for the visual explanation (do not print this entire paragraph): Restore tracked host fixture files from an owned snapshot while the retained Managed conversation remains intact.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "The tracked host files, not remote conversation history."
Teaching context for the visual explanation (do not print this entire paragraph): What does restoring host fixture files restore? The tracked host files, not remote conversation history.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "A host file snapshot does not rewind a retained Managed conversation."
Teaching context for the visual explanation (do not print this entire paragraph): A host file snapshot does not rewind a retained Managed conversation.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Prepare an offline fixture session and take a snapshot of notes.md and absent draft.md."
Teaching context for the visual explanation (do not print this entire paragraph): Prepare an offline fixture session and take a snapshot of notes.md and absent draft.md. Send turns that edit notes.md, create draft.md and create untracked scratch.md.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "The tracked host files, not remote conversation history."
Teaching context for the visual explanation (do not print this entire paragraph): The tracked host files, not remote conversation history. A host file snapshot does not rewind a retained Managed conversation. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Explain why restoring notes.md and deleting draft.md leaves the conversation and untracked scratch.md intact."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why restoring notes.md and deleting draft.md leaves the conversation and untracked scratch.md intact. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Start an offline fixture session and take a host snapshot. The tracked paths are exactly `notes.md` and `draft.md`; `scratch.md` is deliberately untracked. The UI action sends a bounded conversation turn through the shared retained-session event consumer. Once confirmed idle, the selected host handler reads, edits or creates a file in the isolated tree. Its effect is application-controlled and independent of the model's answer. Three turns are allowed per session.

After editing `notes.md` and creating `draft.md`, select the original snapshot and **Dry-run restore**. The plan lists exact tracked-path operations and hashes. **Confirm restore** requires that plan ID, the same owner, snapshot and unchanged fixture version. It restores the original `notes.md` and deletes the newly created `draft.md`; it leaves `scratch.md` and conversation turns alone. A new edit invalidates the plan. Unknown snapshots, foreign owners, stale versions and active or uncertain sessions are refused.

**Inspect remote outputs separately** is available after an idle turn. Offline it reports that no remote files exist. Live it lists session-scoped Files API outputs and downloads up to three bounded `.txt` or `.md` files for size/hash inspection, never into the snapshot tree. **Close session** archives the retained session; **Run one-shot offline** demonstrates a separate session that closes after one turn.

Routes under `/api/c17` are `POST /session`, `/send`, `/snapshot`, `/restore`, `/end` and `/oneshot`. Closed Zod request/report shapes, local origin and owner checks, a five-snapshot and two-session cap, version guards, cancellation, deadlines, SSE events and cleanup bound the exercise.


## Evidence to inspect

Compare file content and SHA-256 before and after restoration. A snapshot records its ID, tracked hashes, related session ID, host event IDs and up to twelve **observed** Managed stream event IDs. An ID records correlation, not proof that every remote event was seen. Confirm that the conversation list and session ID remain the same after restore, while `scratch.md` remains present. The `generated/lab17/<run-id>/snapshots/<snapshot-id>.json` file contains only the two tracked contents.


## Limitations

The host file handlers follow explicit UI actions after a model turn; the agent does not invoke a filesystem tool. Offline event and answer evidence is authored. Restoring host files does not reverse conversation events, API calls, remote outputs, usage, network effects or the cloud sandbox. The live output list is bounded and only reports files available through the session-scoped API. A local cancellation does not prove a remote stop.


## Challenge

Edit the original note, create the tracked draft and untracked scratch file, then restore the first snapshot. Explain why the conversation still records those turns and why a remote output would need separate inspection or cleanup.

Official references checked 2026-10-15: [Managed files](https://platform.claude.com/docs/en/managed-agents/files), [events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), and [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations).


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Edit target infographic, preserve all panels, typography, colors, dimensions and astronaut. Correct ONLY panel 4 chronological workflow. Must show LEFT TO RIGHT: Start offline fixture session (notes.md exists, draft.md absent) -> Take original host snapshot NOW (records notes.md and absent draft.md) -> Send turns: edit notes.md, create draft.md, create untracked scratch.md -> Dry-run restore original snapshot (inspect tracked operations/hashes) -> Confirm restore (notes.md original; draft.md deleted; scratch.md unchanged). Absolutely snapshot BEFORE edits, not after. Keep 6 panel numbers and other content unchanged.
````

COPY PROMPT END
