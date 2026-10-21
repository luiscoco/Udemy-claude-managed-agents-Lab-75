# Main TypeScript concept narration

Each of the 75 labs has exactly one narrated file: its `server/concepts/NN-topic.ts` module. Other files remain available in the source selector without narration. The catalog at `public/code-tours/catalog.json` records 498 exact code sections with explanation text, source SHA-256 and line ranges.

Open **TypeScript source**, then choose **Play code tour**. Use Pause, Replay, the native seek bar, playback speed and the explanation selector. Red rectangles follow the MP3 media clock. With Follow enabled, Play first brings the reading area into view below the app header and focuses the code viewport; each recorded cue then scrolls the code to its anchored range. The complete red overlay is clipped to the visible source range and updates on scrolling/resizing. Turning Follow off preserves both page and source scroll; the transcript and source remain available without audio. Changing source file, lab or view stops obsolete playback. Playback pauses other course audio.

## Author workflow

The source-derived starting catalog can be rebuilt with `node --import tsx scripts/build-code-tours.ts`; review its explanations and line anchors against actual code before recording. This uses the installed Rolldown TypeScript parser, without executing the teaching files. Edit authored catalog text/ranges when a more detailed explanation is needed. Changing code/text invalidates matching recordings.

- `npm run code:plan`: no provider calls; prints the bounded 75-clip plan.
- `npm run code:record`: author-only Inworld recording, requiring configured key, enabled opt-in and explicit recording flag. Supports `--lessons=1,2` when invoking the script directly.
- `npm run code:audit`: verifies all 75 source/text/audio/timing identities, word-aligned cues and source ranges without provider calls.

The author recorder uses two workers, MP3 output, real WORD timestamps and the configured voice/model. Existing valid audio is cached and reused. Each published clip passes FFmpeg decode, FFprobe duration, source/text and media hash checks. Provider timing must match the exact authored words; failed alignment is cached privately for review, with no automatic paid retry. The [official synthesis contract](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech) documents the request and timestamp fields.

The browser verifies bounded local data and exact source/text/audio/timing hashes, rejects stale or damaged media, and loads MP3 data only on Play. Student playback needs no API key and performs no lab POST or Inworld request. The explicit course source-package allowlist includes the catalog, code MP3s, timings and recording manifest.

Student instructions are in [P20](student-build-prompts/steps/P20.md), the [standalone code narration prompt](student-build-prompts/15-typescript-code-narration.md), workbook and regenerated prompt ZIP. The prompt ZIP includes reference catalog/recording JSON, not MP3s. Use the updated instructor source package for matching media; older frozen releases predate this feature. A different student source implementation needs its own reviewed code ranges and matching recordings.

## Earlier verification on 21 October 2026 (before the deeper narration revision)

All 75 recordings were generated through the configured Inworld API (Yash, inworld-tts-2). Every MP3 passed FFmpeg decode and FFprobe duration checks before publication. The complete audit passed for 75 exact source/text/audio/timing identities and 393 word-aligned code sections, totaling 7,869 seconds. The MP3 payloads occupy 62,955,840 bytes. Auditing makes no provider calls.

Typecheck and production build passed. The two new unit checks validate the 75 file mappings/source hashes/line anchors and reject invalid media contracts. Ten initial source/workspace/navigation browser checks passed; the final production selection of 12 code-tour, guide and actual guide-playback checks also passed. Production visual/playback checks passed at 320px and 1280px in both themes, with no page overflow and preserved black source panels. Real code MP3 playback was checked in Labs 01 and 75. Seek, pause, speed, replay, Follow-off behavior, switching active files/views, stale source and damaged audio fallbacks were verified. These are scoped local checks, not new live-model exercise acceptance or a claim that every source file is narrated.

The companion guide-header correction groups the title, Restart tour and step controls into one opaque sticky header; visibility and hit-testing were verified before and after scrolling and minimize/expand. The Home cover preserves its native 1672x941 aspect ratio and offers an original-resolution link. Repairing portrait distortion already baked into that image still requires the instructor's original photo.

## Earlier Play focus and visible timed rectangles correction

The reported failure was reproduced: Play left the source viewport at page position 1269px on a 900px-high screen. The original follow effect only changed the inner scroll and did not run again when the already-selected first section began. As a result, the audio could play while its highlighted source stayed below the screen.

Explicit Play/Replay now requests a fresh reveal independently of the selected section. The reading area clears the fixed app header, the code viewport receives focus without another scroll, and its height accounts for the compact controls and available screen space. Real audio-frame cue checks move the selection at recorded boundaries; source scrolling follows that selection when enabled. A separate pointer-transparent red overlay encloses the visible intersection of the actual anchored lines, including a complete frame when the explained code block exceeds the viewport. Resize and source-scroll measurements keep that frame aligned. Follow off preserves manual page and code positions.

Verification: typecheck and production build passed. All six code-tour browser checks passed, including new desktop/320px phone checks that press Play without manually scrolling to the source, verify visible overlay bounds/focus, cross actual playing MP3 cue boundaries, verify inner scroll changes and replay. Screenshots of the long highlighted block were inspected at both sizes. No recording regeneration is needed: all 75 source/audio/timing identities are retained.

Final regression for this correction: all 14 production browser checks passed, including visible cue transitions at 320px/1280px, shrinking the desktop window to 390px height, Follow-off preserving page and source scroll, existing guide scrolling and actual recorded guide playback. The two code-tour unit checks, all-75 media audit, prompt consistency check and diff whitespace check passed.


## Deeper narration and code reading controls

The revised catalog has 498 sections. Source-derived explanations name real validation calls, local state, delegated operations, rejection statuses and observable output instead of only describing router structure. Labs 01 and 66 also have individually authored explanations of their main lifecycle and WebSocket concepts. Source changes require reviewed text/anchors and fresh matching audio; an unchanged source hash alone does not make changed narration compatible.

Use **Code font size** to select 14, 16, 18, 20 or 24px (default 18px). **Wrap code** is enabled initially; disabling it keeps horizontal scrolling inside the source panel. **Enter full-screen code** opens a viewport-filling reader with its own reading and narration controls. Escape or **Exit full-screen code** closes it and returns keyboard focus. Background scrolling is restored on close or view change. Font/wrap/resize changes remeasure the red rectangle from the rendered line spans; media cue timing remains tied to the recording.

The student specifications are [P20](student-build-prompts/steps/P20.md) for deeper narration and [P21](student-build-prompts/steps/P21.md) for reading controls, also provided as standalone prompts 15 and 16. The workbook now contains 122 implementation/recovery prompts. See [the student pilot checklist](student-pilot.md) for the next human usability review.


Revision verification: all 75 revised Inworld recordings passed decode/duration checks and the complete source/text/audio/timing audit, covering 498 real word-aligned sections and 7171.008 seconds (57,368,064 MP3 bytes). Obsolete published code media was retired after verified copies were preserved privately; the public media inventory contains exactly the current manifest plus its 75 MP3/timing pairs. Auditing made zero provider requests.

Typecheck, production build, two code-contract unit checks and all 16 relevant production browser checks passed (eight code-tour/reader checks and eight Learning Guide checks). Additional full-screen screenshots and playback checks passed at 320px and 1280px in light and dark themes; screenshots were visually inspected. These checks cover real audio cue transitions, visible red rectangles, font and wrap changes, full-screen keyboard behavior, Follow off, stale/damaged media and guide scrolling. They do not constitute a student pilot or new live-model exercise acceptance. The regenerated workbook and prompt ZIP contain 122 prompts and 297 authored files; matching revised media belongs in the course source ZIP.
