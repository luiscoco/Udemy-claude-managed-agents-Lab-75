# Lab 10: Validated reports and interruption

## Prerequisites

Use Node.js 24 and installed dependencies. Offline scenarios are authored and need no credentials. Live mode reuses the text-only base agent and environment from Lab 01; the host pins the retrieved agent version and clears tools, MCP servers, skills and orchestration before sending any prompt. A server API key and explicit live gate are required.

## Controls

- **Start offline report** opens a fresh retained session and validates final JSON text.
- **Offline scenario** selects Valid, Invalid, Corrected, Exhausted, Hang or Interrupt unconfirmed. Invalid with correction disabled uses one attempt; Exhausted uses exactly two unsuccessful attempts.
- **Allow one corrective round** permits at most one extra user message after invalid JSON or a schema violation. It never starts an unlimited repair loop.
- **Interrupt and retain session** aborts the current local turn, sends `user.interrupt` alone if remote work is not already idle, and polls actual status. It permits reuse only after idle is observed.
- **Send another turn** keeps the same owned session and serializes sends. One active turn and at most two queued turns are permitted.
- **Disconnect locally** calls `AbortController.abort()` for browser waiting. The disconnected stream initiates interrupt and remote cleanup.
- **Abort and clean up** requests the same remote cleanup explicitly through the host, preserving evidence even if cleanup is pending.
- **Close idle session** archives an idle session with no pending turns. It blocks future sends and does not stop a local Claude process.
- **Inspect run state** retrieves the owner-bound run ledger and pending cleanup state.
- **Run live** explicitly starts a billed fresh text-only session. No provisioning or live execution occurs automatically.

## Evidence to inspect

The report contract requires project, summary, risks and nonempty nextSteps. It is a closed Zod schema with centrally generated JSON Schema. Only the last authoritative message from a confirmed completed turn is JSON-parsed and independently validated. Invalid output never appears as a verified report.

Each turn has a local UUID, state, outcome, attempts, validation errors and observed usage. The run records the provider session ID, queue depth, interruption evidence and cleanup outcome. Offline usage is null. Live usage comes only from deduplicated model-request spans, not a fabricated cost estimate.

Validated reports render as a project heading, summary, Risks list and numbered Next steps. Turn evidence and observed input, output and cache-token counts are separate. **View and copy validated JSON** exposes the exact validated object without placing long JSON in a wide table. The platform uses larger readable typography, and a completed idle session is labeled as retained rather than in progress.

The report is **application schema validation**. No `outputFormat` or `result.structured_output` field is sent to `sessions.create`. This lesson selects the host final-text validation route rather than a submit_report custom tool.

API inventory: `GET /api/c10/schemas`, `POST /structured`, `POST /run`, `POST /interrupt`, `POST /abort`, `POST /send` and `POST /end`. `GET /run?runId=...` adds read-only state inspection. Stateful calls require the same `X-Lab-Owner` exercise ID. IDs are local run UUIDs, not caller-selected provider session IDs.

## Troubleshooting

- 400: invalid owner, request schema, unsupported native-output field or bounds.
- 403: another exercise owner attempted to control the run.
- 404: unknown run ID.
- 409: closed, expired or stopping run; pending cleanup; or Close before idle.
- 422: missing live configuration or inherited capabilities were not cleared.
- 429: the per-session send queue or retained-session capacity is full. Close another session.
- 503: the server could not reach Anthropic. Run the development server in a terminal with network access, check connectivity, and retry explicitly. Local setup readiness does not verify provider access.
- **cleanup-pending / unconfirmed**: the interrupt acknowledgment did not prove idle. Inspect the session in Claude Console. Do not reuse it based on an HTTP acknowledgment alone.

## Limitations

Offline events are authored examples. Validation proves schema conformance, not factual truth. Only observed spans populate usage; they do not imply complete session cost. Interrupt does not undo prior effects. This text-only single-agent lesson excludes dynamic workflows. A retained run expires after 15 minutes of inactivity; expiry and shutdown request bounded cleanup. Pending remote cleanup remains visible and does not count as a successful archive. Exercise ownership isolates local runs but is not a general multi-user authentication system.

## Challenge

Run Hang, interrupt, confirm idle and send a valid report. Identify the preserved session ID. Compare this with Abort and Close, which end future sends after cleanup.

## PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab10-structured-interrupt.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/run-browser-tests.mjs browser-tests/lab10.spec.ts --reporter=list
```

Provider references: [Interrupt event semantics](https://platform.claude.com/docs/en/managed-agents/events-and-streaming) and [Session operations](https://platform.claude.com/docs/en/managed-agents/session-operations). Implementation is checked against installed SDK 0.133.0 types.
