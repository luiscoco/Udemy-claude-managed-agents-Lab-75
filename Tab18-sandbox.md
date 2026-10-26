# Lab 18: Cloud sandbox and host boundaries

Inspect the configured Managed environment separately from an application's host path policy. A local allowlist can protect a host handler, but it cannot attest the cloud container's OS isolation.

## Prerequisites

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
npm.cmd run dev
# Open the Local URL printed by Vite, then ?lesson=18.
```

The offline path needs no credentials and makes no Anthropic or network request. A deliberate live diagnostic requires an isolated server API key, active single-agent base, cloud environment and `MANAGED_LIVE_ENABLED=true`. The server requires the observed cloud environment to have limited networking with no allowed hosts, MCP egress or package managers, and no installed packages. No environment is provisioned by this lab.

## Controls

On page load, `GET /api/c18/platform` reads **local configuration only**: environment ID, optional agent version pin, the authored policy and the single approved offline host fixture path. SDK 1.3.0 exposes no environment version field. A separately requested live availability check retrieves the environment's `updated_at` as a revision marker; it starts no session.

Use **Run offline host test** for Allowed mount, Outside mount, Blocked network and Missing environment. Each available case creates a disposable host tree. Allowed mount reads an exact allowlisted text file and hashes actual bytes. Outside mount is denied before a read. Blocked network is an authored host policy decision with zero socket calls; it is not a cloud egress test. Missing environment fails closed before creating a fixture tree. The tree is deleted after evidence is captured.

**Inspect live environment** is a deliberate metadata-only provider read. **Run live** separately rechecks the cloud policy, creates one budgeted session with only `bash` enabled under `always_ask`, and asks for `pwd`. The host confirms only the exact `pwd` command; all other calls are denied. The built-in command executes in the Managed cloud sandbox, never in native Windows PowerShell. No file resource is mounted in this live diagnostic. The result shows observed tool use, tool result and cleanup; an agent answer alone is not command evidence.

Routes under `/api/c18` are `GET /platform`, `POST /availability` and `POST /run`. Closed Zod requests reject Agent SDK native sandbox flags. Origin, owner, deadline, budget, concurrency, cancellation and session cleanup are bounded. Setup checks do not create a billed session.

## Evidence to inspect

Compare the four offline cases: one allowed read with a SHA-256 hash; outside path and blocked network with zero read/socket calls; missing environment with no fixture ID and no effects. Inspect the live environment ID, `updated_at`, network policy and archive status before a session. For a live run, require a matching `agent.tool_use`, host confirmation and non-error `agent.tool_result` for `pwd` before calling the command successful.

## Troubleshooting

If live setup is unavailable, check the isolated server API key, base agent, cloud environment, opt-in and bounds. An archived, self-hosted, unrestricted or otherwise unexpected environment fails closed before session creation. A local cancellation does not prove a remote stop; inspect cleanup and Claude Console before repeating a paid diagnostic. An outside host path denial is evidence of this application's guard, not a remote filesystem test.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab18-sandbox.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab18-browser-demonstration.mjs
```

## Limitations

The offline network denial is simulated; no socket or cloud sandbox is exercised. The live diagnostic has no file mount, so it observes a remote `pwd` call only and cannot prove mount enforcement or every OS containment property. A permission flag governs agent tool use, while cloud environment configuration governs sandbox networking; custom host handlers still require their own validation. The environment's `updated_at` is not a version pin.

## Challenge

Run Missing environment and explain why no file read, socket call or session starts. Then contrast that result with Outside mount and explain why neither local observation proves cloud OS containment.

Official references checked 2026-10-15: [cloud environment setup](https://platform.claude.com/docs/en/managed-agents/environments), [secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [sandbox boundaries](https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks), and [cloud sandbox reference](https://platform.claude.com/docs/en/managed-agents/cloud-sandboxes-reference).
