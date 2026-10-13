# Lab 05 checkpoint

Created 2026-10-13 after all verification passed. This workspace has no `.git`
repository, so this manifest is the local review checkpoint instead of a commit.

## Verification

- TypeScript: passed (`tsc --noEmit`)
- Offline suite: 113 passed (11 new in tests/lab05-custom-tools.test.ts; the Lab 03 and Lab 04 tests pass unchanged after the runner change)
- Browser flow: 38 passed (Labs 01–05 and shell, including Lab 05 at 390px)
- Lesson guide/source audit: IDs 1, 2, 3, 4 and 5 passed
- Distribution scan: 227 files passed; `.env` contents were not read
- Production build: passed

No provisioning, live experiments, billed requests or external mutations were
performed. `managed:provision -- lab05` and `managed:verify -- lab05` were added
but not run. Test runners stopped their temporary servers.

## Presentation

22 slides built from the Lab 01 template with `presentations/lab05/.build/`
(`capture.mjs` → `build_deck.py` → `render_check.py`). All six screenshots come
from the authored offline fixtures, with live mode disabled and Anthropic hosts
blocked. The text-fit check found 0 overflows, and every rendered slide was reviewed.
Capturing the deck exposed a squashed Validation column in the calls table; the
column now has a minimum width, and typecheck, build and `lab05.spec.ts` (4 passed)
were rerun afterwards.

```text
48ecbac25ce47a413f1672e09258f9f8de077b3502b268c951a0d2f5dbbbb349 presentations/lab05/output/Lab05-Claude-Managed-Agents-Custom-Tools.pptx
```

This manifest supersedes the Lab 04 hashes for the shared files listed below.

## Changes outside new Lab 05 files

- `server/lib/tool-session-run.ts`: records `agent.custom_tool_use`, passes it to the
  `answer` hook as `PendingCall.custom`, and sends custom tool results through the
  port's `respond`. Each `sevt_` ID is answered at most once per run: a repeated
  `requires_action` pause is reported as a notice and not answered again (this also
  applies to Labs 03 and 04). `sandbox` is now optional.
- `server/lib/tool-session-port.ts`: `CustomToolResult`, optional `respond`, and the
  live provider calls extracted into `liveSessionMethods()` (used by Labs 03–05).
- `server/concepts/registry.ts`, `src/lessons/registry.ts`, `src/lessons/content.ts`: Lab 05 registered.
- `tests/lesson-guides.test.ts`, `browser-tests/shell.spec.ts`: expectations now include Lab 05.
- `scripts/managed-setup.ts`: `provision lab05` and `verify lab05`.
- `docs/managed-setup.md`, `.env.example`: `CLAUDE_MANAGED_LAB05_AGENT_ID`.
- `.gitignore`, `.npmignore`: `managed/lab05-resources.local.json`.
- `README.md`: lists Lab 05 and describes how it was built.

## SHA-256 manifest

```text
4d91798bebaa4a2616e2d34ef5105c8159c504831d1d3d2c7b133008ff1d2f7c Tab5-custom-tools.md
793f411900277683a3754b4ecb318bcde053982718d47e3cb94d5e7d23ec6411 shared/lab05-custom-tools.ts
bf4070d152ac1911639bd7b77c8244706ac02aa1fea8216459c5cc4df2bcc478 server/lib/lab05-tasks.ts
ecadad5da91061cb232cebbfc626ea60c12594e278dbdb697fa2aaf3efd47ae3 server/lib/lab05-fixtures.ts
222b1b783bd98d89d1921a42c45ab60a35d01def73ebc01b4e12108c866b9ade server/lib/lab05-port.ts
0be0f654d89ab54c4bc5ae995cdd3e38fa81a4d42d43db5a473248b8b83a1980 server/lib/lab05-run.ts
8197a5202bf6e3c6e48ee8f9417726e5340f328ee0781eb4389d2a56eef78597 server/concepts/05-custom-tools.ts
2eadd3846c796eaf5c5c9db0ea5f43cca5bef4cf4fe92a0d7a32575d0fb14bac src/concepts/Concept05CustomTools.tsx
4ce99f53b7c75b31e3ff99a8961613642ddc53dc7f85815767a88c26661243d1 managed/lab05-agent.json
d733c0b32893bc4f57583ad97c3eb41c479d61e2d8cf7a0429eb06407d28ac61 tests/lab05-custom-tools.test.ts
ded258ffcdc2823d9b3577d69b1525b7afb73729f1d3009ed2a3e7f13be5b158 browser-tests/lab05.spec.ts
8015be08e915d87e5b5a92215c4a7c58e5ec1c833cea7d6e44e282ce6c6f78b4 server/lib/tool-session-run.ts
6ce632b5ea955aa2b9b3ddb6f503ea853e1ba6ac969002dcffff1c69d0e6f0fa server/lib/tool-session-port.ts
36c8e4797a4793ceea711a803d54ed91ca34cbe857132d165e004153df6d7c20 server/concepts/registry.ts
893761046df915ef22c30847b930a7e6d6dba3276199018210409f9e2471026a src/lessons/registry.ts
e59ca97e330b0e8f981252fb299eef6fa2ea7ac7eb83d15fbbc96937318a63ce src/lessons/content.ts
9280c11e193f8a96719f1d68e95396a2482a7bfb97aeca6208b5f6c955df950b tests/lesson-guides.test.ts
e36053bfc91a894ded12fa2489f099fd0767a3b651ef217ebd0aab58e2441fe3 browser-tests/shell.spec.ts
6541ea52af81dc70383dab1f9ce6462b6d852f5cc71ed784208bca8e480744e3 scripts/managed-setup.ts
5f2ad2821cfdb081060a07afdf22d780f8adac70a53143439d2dc9a833b8a007 docs/managed-setup.md
0efd887a3b2edea4eeb418e7acf71c3d69364f9a5f8684691637d1da368f0cf7 README.md
26697540ca44aae7b59014a770df31e2f74aea57b86fd2a5014bf78671467547 .env.example
24950aee3a2ed277364737c81bf44ccdda59e9ce74b9189ba59f44060429147d .gitignore
616d672683128cc2b5666d067c0a2ba9142f0868178e8c8e68679f31a6bc4c61 .npmignore
```
