# Learning Guide: Inworld narration and highlighted explanations

Every implemented Lab 01-75 has a seven-section Learning Guide: objective, preparation, example, controls, evidence, source and practice. Select **Start guided tour**. The guide opens the appropriate view, expands the explanation and draws a red rectangle around it. Its floating player stays available while you read.

Use **Next section**, **Previous section**, **Show section**, **Minimize guide** or **Close guide**. Escape closes the tour and removes the highlight. Switching tabs preserves exercise state and pauses narration; Show section returns to the current guide step. The tour never clicks an exercise control, runs an agent, sends email or approves an effect.

Your last visited section is saved per lab in this browser. Returning to a lab offers **Resume saved tour**; it does not resume automatically or start audio. **Finish tour** clears that saved position. Use **Jump to section** to move directly to any explanation.

When a relevant exercise input, control group, result panel or source block is visible, a second red rectangle marks it. **Show exercise target** scrolls to that element without focusing, clicking or changing it. If a lesson has no separate result panel yet, the guide explains that you must run the example yourself and inspect its output. Dynamically loaded targets are detected as the exercise renders.

## Voice setup

Set these in the server's ignored `.env`, then restart `npm run dev`:

```dotenv
INWORLD_API_KEY=<Base64 credentials copied from the Inworld portal>
INWORLD_NARRATION_ENABLED=1
INWORLD_VOICE_ID=Yash
INWORLD_MODEL_ID=inworld-tts-2
```

Use an exact voice ID available to your Inworld workspace. The voice is configurable; the reference recordings used Yash. Do not encode portal credentials a second time, put them in a `VITE_` variable or commit them. Existing Anthropic settings are independent.

**Play narration** explicitly requests synthesis for the selected authored section. Provider charges can apply. Opening a lab or starting the tour does not generate audio. Pause cancels a pending local request or pauses playback; cancellation cannot guarantee that Inworld did no billable work. Replay reuses the current recording. A bounded in-memory server cache also reuses identical text, voice and model combinations until eviction or server restart.

The player supports native audio controls, 0.75x-1.5x playback, replay and optional section advancement after narration. It always waits at learner-action steps. Advancing does not generate the next clip automatically. Written transcripts remain available when the key is missing, the provider rejects a request or playback fails.

The four learning checkboxes are self-assessment saved per lab in this browser. They do not certify exercise success or live execution.

An explicitly requested live smoke test is available as `npm run guide:live:test`. It synthesizes one Lab 65 objective clip, checks the MP3 header and writes audio plus redacted evidence to ignored `artifacts/learning-guide`. This incurs one provider request; it does not run a lesson agent. Listen to the saved clip separately to assess pronunciation and delivery.

The authorized initial live test passed on 18 October 2026 with Yash and inworld-tts-2. One request returned a 259,584-byte MP3 (32.448 seconds, 48 kHz mono), decoded without errors by FFmpeg. The local API key remains ignored; narration requires restarting the backend after configuration changes. The live test is separate from offline checks and does not claim every lab recording has been generated.

## How it was built, step by step

1. Inspected the named [reference repository](https://github.com/luiscoco/Udemy-Claude-Agent-SDK-Learning-Platform-v2), local checkout commit `6fb4c239d5ad1458f54ae14a1f2381306c9e7d47`, especially SectionTour, SectionExplanation, GuidedLesson and its audio-generation script.
2. Shared existing Managed Agents learning metadata through `shared/learning-content.ts`, preserving the frontend import for existing consumers.
3. Authored `shared/learning-guide.ts` to derive lesson-specific explanations and student actions from those objectives, steps, inspection paths and challenges. Page explanations and narration use this same catalog.
4. Added explanations to the Learn, exercise, review and source views. Added the floating tour, transcript, persistent checklist and red outline. Reduced-motion users receive immediate scrolling.
5. Added `/api/learning-guide/status` and explicit POST `/api/learning-guide/audio`. Only known lesson and step IDs are accepted; arbitrary browser text is rejected. The key stays on the server. Requests use a fixed Inworld HTTPS endpoint, timeout, response-size limit, one concurrent synthesis and a twelve-uncached-request-per-minute limit.
6. Added bounded caching by text, voice and model. Provider errors are sanitized. Tour navigation does not submit an exercise request.
7. Added tests for all 525 authored sections, closed synthesis input, origin/header checks, authentication, caching, credential redaction, browser highlighting and mobile controls.

The guide highlights explanations and visible exercise targets without selecting values or activating controls. The reference's Agent SDK narration was adapted to Managed Agents concepts and host evidence.

API references: [Inworld synthesis](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech), [workspace voice catalog](https://docs.inworld.ai/api-reference/voiceAPI/voiceservice/list-voices).
