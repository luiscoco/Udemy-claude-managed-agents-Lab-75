# Lab 12 checkpoint: Multiple messages in one session

Implemented the next workbook lesson in the Managed Agents platform, preserving Labs 01–11 and the shared visual redesign. Lab 12 is registered at `/?lesson=12` with a detailed guide and real UI/server/support source.

Private cumulative repository: [Udemy-claude-managed-agents-Lab-12](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-12). It includes the existing prompt workbook, the validated visual redesign and every implemented lesson through Lab 12. Earlier repositories remain historical checkpoints.

## Implemented behavior

- One retained session and one provider stream; a bounded serialized host queue admits one active and two waiting commands.
- Strict request schemas, owner isolation, local-origin checks, session capacity, deadline/expiry bounds and 20-command history.
- Local command IDs, submission-returned user event IDs, observed stream correlation, agent event IDs and separate admission/processing/completion timestamps.
- Exact command replay has one effect; conflicting replay and oversized input fail before admission. Scripts reserve the entire batch atomically.
- Small base64 PNG demonstration through the installed Managed image content block; PNG framing, size and dimension checks precede submission.
- Restricted idle tools/MCP updates, explicit system context, and a new model/effort session with explicit handoff context. Old-session cleanup precedes the handoff prompt.
- Close cancels waiting work, attempts interruption only when needed, confirms idle before archive and retains cleanup-pending checkpoints/capacity. Setup failures retain the created session ID for cleanup. Shutdown waits for late creation and in-flight updates.
- Shared SSE snapshots carry revisions so stale control responses cannot overwrite newer browser evidence. Leaving the lesson disconnects the evidence stream and requests queue cleanup.

## Actual validation

- TypeScript typecheck: passed.
- Full offline regression run: 169 tests passed. This run preceded eight additional focused tests.
- Expanded Lab 12 deterministic/SDK-injected suite: 16 tests passed. SDK transport uses a local injected fetch implementation and dummy credentials; no Anthropic requests. These include late creation/shutdown, failed setup quarantine, uncertain acceptance, encoded output bounds and disconnect during model-session creation.
- Guide audit: all registered IDs 1–12 passed.
- Guide/resource/rendering tests: 4 passed, including real source catalog exclusions.
- Browser run: all 12 checks passed (4 Lab 12 experiments and 8 shell/navigation checks). Lab 12 checks include busy follow-ups, oversized rejection, queued cancellation, idle updates, new-session handoff, mobile overflow and navigation cleanup.
- Production build: passed. Existing ineffective-dynamic-import notices for shared teaching source remain nonfatal.
- Post-build distribution scan: passed (1235 files in the recorded scan; `.env` contents were not read).
- Offline browser demonstration: passed at 390 and 1440 pixels, with both script commands completed, no page overflow and confirmed simulated cleanup. Screenshots were reviewed locally.

Reproduce the offline browser demonstration with `node scripts/lab12-browser-demonstration.mjs`. It saves screenshots in ignored `artifacts/lab12/`, starts only authored commands and closes its sessions. The current application URL is `http://127.0.0.1:5174/?lesson=12`.

## Limits

No paid live run, new provider resource provisioning, upload or public MCP exposure was performed. Offline fixtures do not establish live model availability, system-context acceptance, image decoding, queue durability or billing totals. The queue is in-memory and local to one browser subscriber/server process. Provider stream failure triggers cleanup instead of reconnect/replay. This lab exposes only no-tools/read-only updates with cleared MCP; full connection experiments belong to Lab 13.

The implementation uses the installed SDK 0.133.0 types and the official [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations) and [event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming) contracts. It does not implement unsupported Agent SDK generator or setter analogies.
