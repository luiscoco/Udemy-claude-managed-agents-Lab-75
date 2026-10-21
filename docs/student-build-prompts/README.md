# Build the Claude Managed Agents learning platform from zero

A copyable prompt curriculum for Udemy students. Authored 20 October 2026 against source 963cbbf; interface revised 21 October 2026 to remove the duplicate numbered lesson button grid use black TypeScript source backgrounds in both themes, and add six semantic colour families. Start with an empty folder and build the application incrementally; the finished instructor repository is an optional read-only reference, not a prerequisite application to clone. This replaces the earlier assumption that the first five labs or the app shell already exist.

## What you will build

All 75 Managed Agents lessons and 11 detailed extensions; the responsive shell, safe source views, guides and exact spoken-fragment highlights; optional progress, notes/backups, quizzes/paths/review, milestones and solutions; 150 astronaut infographics with zoom/pan and 900 timed regions; 525 lesson and 150 visual recordings; offline/browser checks, explicit live acceptance, sanitized packaging and release delivery.

## Choose how to read

Use [WORKBOOK.md](WORKBOOK.md) for one complete document, or open the smaller step files from the sequence below. Each COPY PROMPT block is a complete request to your coding assistant. Copy only one at a time, let it implement and verify the step, inspect the result and save a working checkpoint before continuing. Recovery prompts are at the end.

The [six-colour visual style prompt](12-six-colour-visual-style.md) is included in P01 and can also be copied independently to improve an existing app.

The [Home presentation banner prompt](13-home-portal-banner.md) documents the portal title, artwork, responsive and accessible implementation, fallback and source-package inclusion. It is also embedded in P01.

## Prerequisites

Use an AI coding assistant with local file/terminal access, Node 24 or newer, Git and VS Code or another editor. Chrome is used by browser checks. Windows examples use PowerShell and npm.cmd; use npm on other systems. The reference folder is claude-managed-agents, but it can live anywhere. Dependency installation and obtaining instructor materials need internet access. Local fixtures and included audio playback need no model or Inworld key.

## Build order

1. [Build the foundations](01-foundations.md)
2. [Build lessons 1 through 15](02-lessons-01-15.md)
3. [Build lessons 16 through 30](03-lessons-16-30.md)
4. [Build lessons 31 through 45](04-lessons-31-45.md)
5. [Build lessons 46 through 60](05-lessons-46-60.md)
6. [Build lessons 61 through 75](06-lessons-61-75.md)
7. [Build the complete learning experience](07-learning-experience.md)
8. [Verify and deliver the platform](08-quality-and-delivery.md)
9. [Final parity checklist](11-final-parity-checklist.md) and [recovery prompts](09-recovery.md).

Complete the numbered lessons in order. Insert 50A/50B after L50, 71A after L71, 72A after L72, 73A after L73, 74A after L74 and 75A through 75E after L75. The small chapter indexes already insert them correctly. Learning features follow the 75 lessons so every catalog can reference actual implemented content.

## Media reuse and new media authoring

**Recommended no-key student path:** build the application code from zero, then reuse the instructor-provided media and matching authored data when you reach P02/P05/P14. Obtain the licensed media from the v0.2.0 source ZIP or a teacher-provided equivalent. Copy public/audio/guides, public/audio/infographics and public/infographics, including manifests/timing JSON. Use [course.json](reference-data/course.json) and [media-catalog.json](reference-data/media-catalog.json) to reproduce the exact spoken text, segment/region IDs, guide actions, image dimensions/boxes and file identities. Their structure is authored teaching data, not a complete app implementation. Do not change text and pretend the old recording still matches. Access to the private repository must be granted or supplied through Udemy downloads.

**Author path:** write your own teaching text and create new images/recordings deliberately. The [150 image prompts](image-prompts/README.md) include topic-specific astronaut poses and observed corrections. New images need fresh visual review and measured boxes. New Inworld MP3s need the author's separate paid account, real WORD timestamps and decode/hash checks; FFmpeg/ffprobe is an author prerequisite. Image tools may also have account/cost requirements. This workbook does not authorize billed generation or live calls. Students playing supplied media need neither service key.

## Verification and honest limits

A prompt is an implementation specification, not evidence that its output works. Compare actual files/UI and run the stated checks. During the early build count only registered implemented lessons; require all 75 and complete media inventory only at the final gate. Report unsupported live adapters and missing external configuration rather than simulating a live success. Never use a web/desktop login as a substitute for the app's server-side API key. Keep keys out of chat, Git, notes, browser storage and source views. Local owner headers and worktrees are teaching boundaries, not production authentication or OS containment.

The pinned source documents what was implemented; later official APIs, available models and dependency versions may change. [reference-versions.json](reference-data/reference-versions.json) records the frozen dependency/script inventory. Inspect installed official types and current primary documentation for a provider-specific operation instead of guessing. A from-zero replay has not been executed for this entire curriculum, and an AI rebuild is not guaranteed pixel- or byte-identical. [coverage.json](coverage.json) maps the authored build steps, all lessons and image prompts.

The student prompt ZIP contains Markdown and authored reference JSON, not the large media files, credentials or runtime evidence. The instructor supplies the media archive separately.

## Your first coding session

1. Extract this prompt ZIP into a reference folder outside the empty app folder. Give your coding assistant read access to that reference folder, especially its reference-data files.
2. Create a separate empty application folder and open it in your editor/assistant. Do not run these build prompts over the instructor application or an unrelated project. Replace C:/claude-managed-agents in an older lesson brief with your own application path.
3. Open steps/F01.md, copy the text between COPY PROMPT START and COPY PROMPT END, and send it to the assistant. Do not paste the entire 120-prompt workbook into one request.
4. Run the checkpoint commands and inspect the result. Continue to F02 only after F01 works. Keep a checkpoint after each successful step so a later failure can be repaired locally.

There are 117 ordered implementation/delivery prompts and three recovery/parity prompts, for 120 total. The 150 image-tool prompts are additional separate assets. If the assistant cannot read the reference folder, attach the specific JSON or prompt file needed by that step. Local build steps do not authorize optional paid recording, live sessions or publication.
