# Learning Guide: Inworld narration and highlighted explanations

Every implemented Lab 01-75 has a seven-section Learning Guide: objective, preparation, example, controls, evidence, source and practice. Select **Start guided tour**. The guide opens the appropriate view, expands the explanation and draws a red rectangle around it. Its floating player stays available while you read.

To find it, open any lesson and select **Open Learning Guide** beside the lesson title. This shortcut scrolls to and focuses the guide without starting audio or an exercise. The guide sits below the lesson heading and shortcuts, above the lesson workspace tabs. **My lesson notebook** is inside the guide, below the learning checklist.

Use **Next section**, **Previous section**, **Show section**, **Minimize guide** or **Close guide**. Escape closes the tour and removes the highlight. Switching tabs preserves exercise state and pauses narration; Show section returns to the current guide step. The tour never clicks an exercise control, runs an agent, sends email or approves an effect.

Your last visited section is saved per lab in this browser. Returning to a lab offers **Resume saved tour**; it does not resume automatically or start audio. **Finish tour** clears that saved position. Use **Jump to section** to move directly to any explanation.

When a relevant exercise input, control group, result panel or source block is visible, a second red rectangle marks it. **Show exercise target** scrolls to that element without focusing, clicking or changing it. If a lesson has no separate result panel yet, the guide explains that you must run the example yourself and inspect its output. Dynamically loaded targets are detected as the exercise renders.

## Included voice recordings

All 75 labs ship with seven prerecorded Inworld MP3s each: **525 recordings**. Students need **no Inworld account, API key or synthesis request**. Select **Start narrated tour** for the compact player, or start a written tour and press **Play narration**. Nothing plays automatically when you open a lesson.

The manifest in `public/audio/guides/manifest.json` binds each recording to its exact authored transcript, SHA-256, duration and timing file. MP3s and timing JSON files are committed to GitHub, copied by Vite into the production build, and included in the downloadable source ZIP. Serve them with the app; no external audio service is needed during lessons.

Red rectangles follow the provider's verified word timestamps and the actual media clock. Pause holds the current rectangle; seeking and replay move it. A missing timing file falls back to a whole-section outline. A missing, stale or damaged MP3 leaves the written explanation available. Playback supports 0.75x?1.5x speed. Automatic continuation stops at learner-action steps and never runs an exercise.

### Author-only recording workflow

Students can leave all `INWORLD_*` settings empty/disabled. Only course authors recording new or changed narration configure these in the ignored `.env`:

```dotenv
INWORLD_API_KEY=<Base64 credentials copied from the Inworld portal>
INWORLD_NARRATION_ENABLED=1
INWORLD_VOICE_ID=Yash
INWORLD_MODEL_ID=inworld-tts-2
```

Do not encode portal credentials again, expose them through `VITE_` variables, or commit `.env`. Use Node 24+ and install FFmpeg/ffprobe on the author's machine for full MP3 decode and duration verification. Inspect the bounded plan first:

```powershell
npm run narration:plan
npm run narration:record
npm run narration:check
```

Recording is an explicit paid authoring operation. The command processes only the known 525 authored sections, with bounded concurrency, text size and response size. It reuses matching recordings and an ignored author cache; rerunning resumes completed work. It retries rate-limit responses only. Review failures before retrying other errors. After changing a transcript, record the updated clip, remove its superseded public MP3/timing pair, run the audit and commit `public/audio/guides` with the changed lesson code. Runtime caches under `artifacts` remain private and excluded from distribution.

Each generated MP3 is fully decoded with FFmpeg, measured with ffprobe and matched to Inworld WORD timings before entering the public manifest. The offline audit checks every clip's hash, exact transcript, cue coverage, duration bounds and file inventory without an API key. Browser tests play committed recordings and check timing controls without provider requests. The optional local author synthesis endpoint remains disabled by default and is not used by the student player.

The four learning checkboxes are self-assessment saved per lab in this browser. They do not certify exercise success or live execution.

## Course progress and continuing your learning

Home shows completed learning checklists, lessons in progress, lessons not started and a progress bar. Expand **Progress by topic** or **Review lesson checklists** to see the details. Completed checklists also receive a labeled badge in course navigation. Existing checklist and saved-tour keys are reused without migration.

**Continue learning** opens your last unfinished lesson. If it is complete, the overview recommends another started lesson or the first unfinished lesson in course order. A saved tour still requires an explicit **Resume saved tour** click, and audio requires Play. Opening a lesson counts as started, not passed. Completing all four checkboxes means self-assessed completion only.

Counts update when you change checkboxes in the current tab or when another tab changes browser storage. Unknown lesson IDs, invalid saved section IDs and malformed checklist values are ignored. The overview reads only known learning-progress keys, performs no network request and does not inspect credentials. Private browsing or blocked storage may prevent persistence; a warning explains that limitation. There is no server sync or account-wide progress claim.

The progress implementation uses `src/lib/learning-progress.ts` to validate known browser values, a shared change event to update the application, `src/components/CourseProgress.tsx` for the overview and the existing lesson navigation for continuation. It does not infer a verified run from a visited page, saved tour or checked box.

## Personal notebook and learning backups

Open **My lesson notebook** in the Learning Guide to write up to 4,000 characters of plain-text observations or questions. Choose **Save note** before leaving; unsaved edits are labeled. Notes never go to Inworld, Anthropic or the backend. **Bookmark this lesson for review** saves immediately. Home lists bookmarks and indicates which lessons have saved notes. Neither notes nor bookmarks mark an exercise complete.

On Home, expand **Back up or restore my learning** and choose **Download learning backup**. The JSON includes only registered lesson IDs, four self-assessment flags per lesson, saved tour positions, visited flags, saved notes, bookmarks, knowledge-check answers and the last visited lesson. It excludes server credentials, unrelated browser settings, exercise outputs, remote sessions and audio. Keep the file private because it contains personal notes.

Choose a JSON file to validate it locally and inspect its preview. No data changes until you select **Restore this backup**. **Cancel restore** leaves storage unchanged. Restoration replaces the learning fields for included lessons; other lessons remain unchanged. Download the current backup first if you want to preserve both versions. Restoring never runs a lesson, resumes narration or establishes verified completion.

The versioned closed schema rejects unknown fields, wrong course/version, unknown or duplicate lessons, invalid checkboxes or tour positions, notes over 4,000 characters and files over 2 MB. The write boundary revalidates the preview and touches only known learning keys. If storage refuses a write, the restore attempts to put previous values back and reports whether rollback succeeded. If browser storage refuses rollback too, the status explicitly warns that some learning values may have changed. This is browser-local portability, not account synchronization.

Downloads now use backup version 2 and include the latest knowledge-check answer per lesson. Version 1 backups remain supported and leave existing knowledge answers unchanged. Version 2 restores replace knowledge answers for included lessons. Stored correctness is never trusted; it is calculated again from the current authored question version.

Implementation: `src/components/LessonNotebook.tsx`, `src/components/LearningBackupControls.tsx` and `src/lib/learning-backup.ts`. Automated checks cover round-trip preservation, unrelated-key exclusion, malformed backup rejection, partial restores, cancellation and rollback after a storage failure.

## Lesson knowledge checks

Select **Open knowledge check** beside a lesson title, or expand the Knowledge check section below its Learning Guide. Each of Labs 01-75 has one authored multiple-choice concept question, three choices and an explanation. Choose an answer and select **Check answer**. Feedback explains the lesson boundary; an incorrect attempt also shows the correct answer. You can change your choice and try again. **Review lesson source** opens the actual implementation.

Only the latest checked choice, its question version and a timestamp are saved in this browser. Selecting a radio button alone does not change the saved result. Correctness is computed locally from the authored answer key, not from a model or a stored success flag. Stale or malformed saved attempts are ignored. A correct answer is a practice result, not proof of a live run, host effect, cleanup or professional certification. It does not tick the learning checklist.

Home reports correct and attempted knowledge checks separately from completed self-assessment checklists. Review lesson checklists shows each attempted lesson's knowledge status. Knowledge checks work without any provider key or request. They remain usable when storage is unavailable, with a message explaining that the answer could not be saved.

The question catalog is `shared/learning-quizzes.ts`, adapted from the implemented Managed Agents objectives in `shared/learning-content.ts`. `src/lib/learning-knowledge.ts` validates saved attempts and grades them against the catalog. `src/components/LessonKnowledgeCheck.tsx` renders accessible radio choices, explicit grading and retry feedback. Question changes require a catalog version update so old attempts cannot silently certify a different question.

## Suggested learning paths and review queue

On Home, use the **Learning paths** and **Review queue** shortcuts at the top of Course progress. Four suggested paths are available: **Managed Agents foundations**, **Application builder**, **Reliable orchestration** and **Complete course**. The first three adapt the reference platform's role-oriented sequences to this Managed Agents implementation. Complete course includes all 75 labs in numeric order. Some curated paths share foundation lessons; shared checklists are counted once in course totals.

Select a path to save your preference in this browser. Its card reports existing checklist completion and offers **Continue path** for an unfinished lesson. Lessons then show your position and **Previous in path / Next in path** links. Numeric lesson navigation remains available, and no lab is locked. A lesson outside the selected path is labeled as such without blocking access. Clear the path on Home whenever you want.

Path selection is a browser display preference, like the theme, and is not included in learning backups. Checklists and knowledge results remain portable; select a path again after restoring them in a new browser. Blocked storage keeps selection in memory where possible and explains that it could not be saved.

The review queue combines the latest incorrect knowledge answers and bookmarked lessons, with incorrect answers first. A lesson appears only once even when both reasons apply. Filter by **All review items**, **Knowledge checks** or **Bookmarks**. A correct retry removes the knowledge-review reason. An explicit bookmark remains until you remove it in that lesson's notebook. Opening a queue item navigates to the lab; it does not grade another answer, start a tour or play narration.

Implementation: `src/lessons/learning-paths.ts`, `src/lib/useLearningPath.ts` and `src/components/LearningPaths.tsx`. Suggestions use registered lessons only. Their progress is self-assessment and does not establish a live exercise result or certification.

## Direct access to notebooks progress and backups

The Learn view also contains **Try a baseline and compare** for each of the 75 lessons. It reuses authored lesson steps and concept explanations, with detailed examples for Labs 01, 12 and 65. The evidence principle is included in the shared narration transcript. It describes what to inspect, rather than certifying an unexecuted result. Final prose in Labs 01–05, 09, 11, 13 and 14 uses a limited safe Markdown presenter and an optional exact redacted message view. Raw HTML stays text, embedded images are not loaded, and unsupported URL schemes do not become links.

Use **Open notebook** beside a lesson title, or **My notebook / Lab NN** in the sidebar or mobile Menu. The existing notebook opens directly with keyboard focus. **Course progress** and **Back up or restore** are always available in navigation. The latter goes straight to expanded backup controls on Home; **Open learning backup** also appears near the progress heading.

Paths, checklists and knowledge checks are optional. You can explore any lesson without completing them, and development verification does not require you to navigate every lesson. The [implementation prompt supplement](learning-platform-prompts.md) captures these requirements alongside narration, learning state and milestones. The [updated Word workbook](prompt-migration/Claude-Managed-Agents-Prompts-Labs-01-75.docx) preserves the original prompts and adds the adopted learning platform requirements.

## Offline milestone projects

Use **Home → Milestone projects** to practise an event viewer, a local SSE endpoint or a fictional approval ledger. Each has a downloadable starter, requirements, hints and Node 24 tests, with no dependency installation or provider call. Starters fail intentionally until implemented. Run them in a separate study folder; the platform never executes your edited code or marks it complete automatically. See [Milestone instructions](learning-milestones.md).

An explicitly requested live smoke test is available as `npm run guide:live:test`. It synthesizes one Lab 65 objective clip, checks the MP3 header and writes audio plus redacted evidence to ignored `artifacts/learning-guide`. This incurs one provider request; it does not run a lesson agent. Listen to the saved clip separately to assess pronunciation and delivery.

The authorized initial live test passed on 18 October 2026 with Yash and inworld-tts-2. One request returned a 259,584-byte MP3 (32.448 seconds, 48 kHz mono), decoded without errors by FFmpeg. That initial transport smoke test predates the included 525-recording catalog and is retained as historical author evidence. Student playback now uses the committed static files.

## How it was built, step by step

1. Inspected the named [reference repository](https://github.com/luiscoco/Udemy-Claude-Agent-SDK-Learning-Platform-v2), local checkout commit `6fb4c239d5ad1458f54ae14a1f2381306c9e7d47`, especially SectionTour, SectionExplanation, GuidedLesson and its audio-generation script.
2. Shared existing Managed Agents learning metadata through `shared/learning-content.ts`, preserving the frontend import for existing consumers.
3. Authored `shared/learning-guide.ts` to derive lesson-specific explanations and student actions from those objectives, steps, inspection paths and challenges. Page explanations and narration use this same catalog.
4. Added explanations to the Learn, exercise, review and source views. Added the floating tour, transcript, persistent checklist and red outline. Reduced-motion users receive immediate scrolling.
5. Added `/api/learning-guide/status` and explicit POST `/api/learning-guide/audio`. Only known lesson and step IDs are accepted; arbitrary browser text is rejected. The key stays on the server. Requests use a fixed Inworld HTTPS endpoint, timeout, response-size limit, one concurrent synthesis and a twelve-uncached-request-per-minute limit.
6. Added bounded caching by text, voice and model. Provider errors are sanitized. Tour navigation does not submit an exercise request.
7. Added tests for all 525 authored sections, closed synthesis input, origin/header checks, authentication, caching, credential redaction, browser highlighting and mobile controls.
8. Replaced student synthesis requests with committed MP3s, an exact-transcript manifest and word-aligned timing files. The compact narrated tour follows the actual audio clock and waits for learner actions. Recording and paid API access now belong to the separate author workflow.

The guide highlights explanations and visible exercise targets without selecting values or activating controls. The reference's Agent SDK narration was adapted to Managed Agents concepts and host evidence.

API references: [Inworld synthesis](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech), [workspace voice catalog](https://docs.inworld.ai/api-reference/voiceAPI/voiceservice/list-voices).

## Direct lesson shortcuts

Each lesson has **Open notebook**, **Open checklist** and **Open exercise** links beside its title. The same destinations are available in the sidebar and mobile Menu. Course progress offers these links for the next lesson and for all lessons under **Review lesson checklists**.

You can bookmark, copy or open these links in a new tab. Refresh and browser Back return to the selected section. Notebook and checklist links expand their panels and move keyboard focus there; an exercise link selects the exercise tab and leaves execution to your explicit Run action. Existing saved notes and checklist choices are retained.

The TypeScript source tab uses a black code background in both themes across all 75 lessons, with readable syntax colors and line numbers. File selection, copying and supporting import links remain available.
