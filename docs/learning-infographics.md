# Illustrated lesson rollout

Reviewed lessons have two additional tabs: **Concept map** and **Lab walkthrough**. Each tab has a distinct illustrated PNG and a matching prerecorded Inworld tour. Each published lesson has two images, two MP3s and twelve timed study regions. The approved pilot covers Labs 01, 12 and 65; the remaining 72 lessons are being authored and validated in batches. `shared/infographic-published.ts` is the current publication list. Unfinished pairs retain their original three views.

The artwork follows the supplied teaching-poster references with bold navy/orange headings, pastel panels, architecture and decision diagrams, step-by-step checks, and a wide takeaway strip. Each image has a content-specific astronaut pose related to its content. Highlight coordinates follow the actual panel boundaries, including their different widths and heights. The existing MP3s and WORD timestamps are preserved.

Select a visual tab to read the image. Nothing runs or plays automatically. **Play visual tour** explains the six regions in order. The red rectangle follows the actual audio position, including pause, seek and replay. During a gap between regions it selects the upcoming region; at the end it keeps the final region selected. The compact controls remain available as you explore the image.

**Follow the spoken region with zoom and pan** fits the current region inside the image viewport. Use **Fit image**, **100%**, the zoom slider, mouse dragging or touch scrolling to explore manually. Manual zoom or mouse panning turns automatic following off. Enable the checkbox again to follow the narration. Focus the image area and use `+`, `-` or `0` for keyboard zoom and fit; arrow keys and scrollbars move around the enlarged canvas.

Numbered image markers, the study-link list and **Previous region / Next region** select a region. With audio loaded, selection also seeks the recording to that region. **Open related explanation** opens its existing lesson explanation, and **Open corresponding source** selects the actual teaching source file. These links do not click Run, create a session, send a notification or approve an effect. Switching tabs stops visual narration and preserves mounted exercise inputs and results.

Use **Download PNG image** for the illustration and **Read visual tour transcript** for its full text alternative. The text and related links remain available if an image or recording cannot load. Images and recordings are included in GitHub, the production build and the source ZIP. Students need no Inworld or image-generation API key. Existing live exercises keep their own explicit configuration and execution requirements.

## Teaching content

- Lab 01 separates session identity, provisional previews, authoritative messages, lifecycle evidence and outcomes.
- Lab 12 distinguishes local queue admission, provider acceptance, per-command outcomes and explicit cleanup around a retained session.
- Lab 65 separates an immutable fictional proposal, notification, trusted reviewer decision and the idempotent effect ledger.

These are illustrations of the implemented course, not screenshots of verified live provider activity. See [artwork provenance and prompts](../public/infographics/ARTWORK.md).

## Author workflow

The catalog is `shared/learning-infographics.ts`. Its final region boxes were measured against the generated artwork. The manifest binds each PNG to its exact content, SHA-256, dimensions, MP3 and region timing file. The same authored region text drives the accessible explanation and the prerecorded narration.

Images were generated with the built-in image tool, inspected, corrected where needed and copied into `public/infographics`. The original generation prompts and targeted corrections are committed under `public/infographics/prompts`. Do not silently replace an image without reviewing its content and updating its measured region boxes.

For authorized author narration generation, configure the existing server-only Inworld settings in the ignored `.env`, then run:

```powershell
npm run infographics:plan
npm run infographics:record -- --lessons=2,3
node --import tsx scripts/publish-infographic-batch.ts --lessons=2,3
npm run infographics:check
```

Only the explicit record command may make paid Inworld requests. The full-course plan is bounded to 150 authored tours, reuses matching completed assets and a private author cache, requests real WORD timestamps, and verifies every MP3 with FFmpeg/ffprobe. It stops on errors for review rather than retrying billable operations blindly. Students do not run this authoring command. Keep `.env` and `artifacts` out of Git.

The offline audit verifies all images, transcripts, hashes, source links, non-overlapping region boxes, audio identities and complete word timing. Browser checks cover both tabs, downloads, keyboard navigation, real MP3 playback, backward seeking, region transitions, mobile layout, missing images, source navigation and exercise-state preservation without provider actions.

Publication requires both images, exact matching recordings, actual WORD timestamps, measured non-overlapping region bounds and successful media/source integrity checks. The authoring plan reuses the implemented objectives, experiments, concept checks and source paths; detailed lesson guides constrain diagram semantics. Review generated diagrams against the actual source before recording and publishing them.
