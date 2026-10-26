# Lab 70: Python client for Managed Agents

## Prerequisites

The platform remains TypeScript and uses npm `@anthropic-ai/sdk@1.3.0`. The independent Python requirement is `anthropic==1.7.0` in `python/lab70/requirements.txt`. That official package was inspected locally for session create, event stream/send, custom-tool result, retrieve/archive and agent lookup APIs. Its [PyPI release](https://pypi.org/project/anthropic/1.7.0/) and [official SDK source](https://github.com/anthropics/anthropic-sdk-python) identify the client. No Agent SDK query or `ClaudeSDKClient` is used.

The bridge prefers `.venv`, then an allowlisted system interpreter. It uses fixed `-I -u -B` arguments and a narrow environment. Isolated Python ignores user-site packages, so a package installed only in the user profile does not make the selected worker ready. Install explicitly when you want live capability:

```powershell
cd C:\claude-managed-agents
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r python\lab70\requirements.txt
$env:PYTHON_SDK_EXECUTABLE = 'C:\claude-managed-agents\.venv\Scripts\python.exe'
npm run dev
```

Readiness, build and offline tests never run pip or contact Anthropic.

## Controls

**Check Python readiness** inspects the selected interpreter without network calls. **Start offline Python** runs a real standard-library JSON-lines worker. Compare one-shot cleanup, retained start, another retained turn and idle close. The host accepts only its opaque session handle and checks owner/mode/idle state before reuse; the browser cannot submit a remote session ID.

Choose **custom-tool** to see Python emit `agent.custom_tool_use`, Node validate the closed tool input and return `user.custom_tool_result` by `sevt_` ID. Compare malformed stdout, diagnostic overflow, hang/cancel and missing-Python scenarios. Live mode requires the exact verified package surface, existing server Managed setup and explicit user selection.

## Evidence to inspect

Node spawns one worker request with fixed arguments and no shell. Offline workers never import the provider package. JSON-lines frames, line size, total stdout, stderr capture, calls and process lifetime are bounded. Host custom tools replace Python hooks; the formatting tool has no business effect. Event IDs correlate replies and are not business idempotency keys.

The live adapter uses official `client.beta.sessions.create`, `events.stream`, `events.send`, `retrieve` and `archive` calls. It establishes the stream before sending the message, deduplicates events, handles custom-tool results and verifies the resolved tools/MCP/skills configuration. Retained reuse requires confirmed idle. Cancellation sends an interrupt, then retrieves status before retention or archive. Acknowledgement, local process termination and confirmed remote idle remain separate evidence.

## Routes

`GET /api/c70/facts` returns non-network readiness facts and the independent pins; `GET /code` lists TypeScript and Python sources. `POST /probe` explicitly inspects the isolated interpreter. `POST /runs` starts one bounded worker, `GET /runs/:id` polls evidence, and `POST /runs/:id/cancel` requests graceful cancellation. `GET /sessions` lists owner-scoped retained handles. All routes require the local experiment owner.

## Troubleshooting

If readiness says not installed, create the venv and install the exact requirements manually. A user-profile install is ignored by `-I`. Malformed stdout terminates the worker and is reported as a protocol failure. Diagnostics are bounded and redacted. A missing interpreter produces an actionable error without invoking a shell. Use the same mode and an idle owned handle for retained turns; close it before starting another retained session.

## Limitations

After explicit setup, the pinned Python 1.7.0 requirements were installed in the local .venv and capability probing passed. Actual live tests verified retained-session reuse, explicit close and a correlated host-tool call. The budget uses integer decimal strings, and descriptor-based control reads permit clean shutdown with stdin open. See [live evidence](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/blob/main/docs/course-validation.md). A fresh checkout still requires the explicit venv setup and probe. Offline retained IDs and cleanup are authored simulations. Killing a worker cannot establish remote stop; inspect interruption/cleanup or perform an owner-authorized follow-up through the provider API.

## Challenge

Compare an interrupt acknowledgement, an idle confirmation, archive evidence and a killed child process. Identify which evidence permits retained-session reuse.

## Run locally

```powershell
node --import tsx --test tests/lab70-python-sdk.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab70-browser-demonstration.mjs
```
