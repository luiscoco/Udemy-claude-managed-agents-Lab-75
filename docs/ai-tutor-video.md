# AI Tutor Live Lab video

Title: **AI Tutor Live Lab: Choose a Claude Model, Ask Questions, and Save Answers**.

The final narrated MP4 is complete: **9:29**, 1920 × 1080 at 30 fps, approximately 54 MB. Full audio/video decoding, audio synchronization, all 23 cube transitions and 43 word-aligned highlights passed verification. The deliverables include English SRT/VTT captions, narration MP3, cover PNG, chapter notes and a local player with 24 chapter links. Use `AI-Tutor-Live-Lab.mp4` for Udemy; the silent preview is an earlier review artifact.

Open the generated `index.html` directly from the filesystem, as with the previous video players. Playback, chapter seeking and the narrow layout passed the browser check. The app's Vite server blocks folders ending in `-lab`; for HTTP playback with external captions, serve this output separately with `python -m http.server 8095 --bind 127.0.0.1 --directory videos/ai-tutor-live-lab` and open `http://127.0.0.1:8095/`.

The 24-scene lesson uses the existing Learning Portal cover artwork with the new title. It covers installation, tutor configuration, three prepared questions, model selection, focused questions, per-request paid consent, coloured code, usage, saving, reopening after reload, removal, lesson-specific libraries, storage limitations and troubleshooting.

The completed browser demonstration contains real Haiku 4.5 and Sonnet 4.6 responses. An earlier Haiku response completed before a capture selector failed; its answer and usage remain in `previousAttempts`. Three paid questions were sent in total. The final demonstration contains two of them. No automatic provider retry was used. Reopening and removing saved answers made no model request.

Local production files are ignored by Git:

- `presentations/ai-tutor-live-lab/`: authored HTML, storyboard, actual app screenshots and private capture checkpoints.
- `videos/ai-tutor-live-lab/`: narration plan, script, capture evidence and visual review. The silent preview is labelled `AI-Tutor-Live-Lab-SILENT-PREVIEW.mp4` and is not the final narrated lesson.
- Final deliverable after narration succeeds: `videos/ai-tutor-live-lab/AI-Tutor-Live-Lab.mp4`, plus SRT captions and a chaptered local player.

The narration settings are Inworld Yash, TTS 2, enhanced, balanced, 1.25× and 48 kHz. The original narration key expired; replacing the private local credential restored access, and all 24 scenes recorded successfully. Future rebuilds need a valid `INWORLD_API_KEY` in the root `.env` and `INWORLD_NARRATION_ENABLED=1`. Keep credentials private and reuse successful narration caches; do not rerun the live capture to fix narration.

Resume from the existing captures and narration plan:

```powershell
python -u scripts/build-narrated-presentation.py --project ai-tutor-live-lab
if ($LASTEXITCODE -ne 0) { throw 'Review the production logs before continuing.' }
python scripts/finish-ai-tutor-live-lab.py
node scripts/check-ai-tutor-live-lab-player.mjs
```

The shared build records narration, renders the MP4 and cube transitions, verifies full audio/video decoding and soundtrack synchronization, and checks phrase-boundary highlights. It reuses successful cached narration. The finalization step adds the cover, chapter links, teaching script, Udemy chapter notes and local video catalog entry only after media validation passes.

To revise the visuals, run the author, slide exporter, author again, then the visual audit before rebuilding. Do not run multiple copies of the production pipeline.

```powershell
python scripts/create-ai-tutor-live-lab.py
node scripts/capture-ai-tutor-live-lab-slides.mjs
python scripts/create-ai-tutor-live-lab.py
python scripts/audit-ai-tutor-live-lab-visuals.py
```
