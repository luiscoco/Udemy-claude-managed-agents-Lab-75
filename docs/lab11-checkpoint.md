# Lab 11 checkpoint — Managed skills and progressive loading

Implemented on 2026-10-14 from the Lab 11 prompt in the tracked Word workbook,
including the adopted readability, lifecycle and repository requirements.
The checkpoint contains all earlier implemented lessons and the updated workbook.

## Implementation

- Registered ID 11, topic, UI, `/api/c11` router, objective, guide and real teaching sources.
- Authored formatting skill snapshots v1 and v2 with references, and a deliberate
  missing-reference snapshot. Frontmatter, file types, sizes and hashes are checked locally.
- Added explicit `skills:check` and `skills:upload` commands. Upload uses the Skills API,
  full relative filenames and immutable returned versions, with an exclusive upload lock
  and atomic pin-manifest replacement. Existing pins and pending records block re-upload.
  Local manifests and temporary records are excluded from Git and npm distribution.
- Live run requests never provision: they retrieve pinned metadata, pin the base agent
  version, attach the selected skill and compare resolved session capabilities. Only read
  is enabled; MCP and orchestration are cleared. A mismatch preserves the new session ID
  for cleanup and blocks prompt submission.
- Correlated instruction/reference read attempts with tool results, separated failures
  from successes and exact text matches, deduplicated events and excluded worker cross-posts.
  Host previews and agent claims do not count as read evidence.
- Reused the shared SSE, event consumer and tool-session runner. Requests own fresh
  sessions, accept no caller remote ID, enforce one run per owner and at most two total,
  cap events and support cancellation, deadlines and independent remote cleanup.
- Added readable comparison cards and copyable JSON with the platform's 20px base font.
  Offline fixtures compare no skill, pinned skill, missing ID, absent reference and revised
  version; metadata-only, failed-read, duplicate and hanging scenarios exercise evidence.

## Validation observed

- TypeScript check and production build passed.
- Ten focused Lab 11 tests passed after the final implementation changes.
- Full offline regression suite: 160 passed. An earlier concurrent validation run hit an
  existing Lab 04 approval timing failure; its standalone suite and the subsequent full
  regression run passed.
- Guide/objective/source audit passed for IDs 01–11; all four lesson-guide tests passed.
- Six browser checks passed: four Lab 10 regressions and two Lab 11 exercises, including
  five-variant comparison, host preview versus loading and expanded mobile JSON wrapping.
- Desktop/report-card and phone screenshots were inspected; no horizontal page overflow
  was observed at 390px.
- Authored bundle checks passed for v1, missing-reference and v2 without provider requests.
- Post-build distribution scan passed for 1060 files. Environment credential contents were
  not read by that scan; working document QA stays excluded from npm distribution.
- The live-shaped SDK tests used an injected HTTP transport, including multipart Skill
  upload construction, exact pinned attachment, stream-before-send ordering, resolved
  mismatch cleanup and deduplicated token spans. They were not real provider runs.

## Limits and live setup

Cloud Skill uploads and billed Lab 11 execution have not been exercised. Local pins are
absent until the explicit upload commands in [the guide](../Tab11-skills.md) are run.
The model can decline to load a skill; no observed read is not proof that no read occurred.
Path and exact text matching do not attest the entire remote bundle or semantic compliance.
Usage has the observed model-span scope and is not complete session billing.

Each comparison uses another fresh session; this lesson archives confirmed-idle sessions
rather than retaining them. Interrupt acknowledgments do not establish idle by themselves.
Pending remote cleanup and uncertain session creation require inspection in Claude Console;
side-effecting requests are never retried automatically.

Local skill directories are not automatic cloud mounts. Trusted GitHub repository skill
discovery is documented separately, with no repository mount in this lab. Agent SDK plugin,
Skill tool, manual-only, hot reload and subagent preload APIs are not assumed. Skill filtering
is not authorization; worker configuration requires independent checks.

## Repository checkpoint

Target: [Udemy-claude-managed-agents-Lab-11](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-11), private, branch `main`.
Prior Lab 10 history is retained under the `lab10` remote; `origin` points to this checkpoint.
