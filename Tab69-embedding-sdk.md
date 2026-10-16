# Lab 69: Desktop and IDE host integration

## Prerequisites

Run the local learning platform. Guided mode uses an authored remote-review fixture and an owner-scoped fictional document; no Anthropic call is made. The separate VS Code extension is in `extensions/lab69`. API keys remain in the Node backend, outside the webview and extension bundle.

## Controls

**Start guided review** captures explicit document text, version and SHA-256 hash. Inspect previews and the proposed replacement. **Apply reviewed patch** asks the local host to check identity, correlation, version and hash before changing the document. **Change local document** makes an older patch conflict. Choose transport failure or hang to inspect errors and **Cancel review**. Live review is available only with existing Managed setup and explicit user selection.

## Evidence to inspect

The backend validates the context hash and final closed patch JSON. A remote sandbox never directly edits the local document. One active run per host owner, a global concurrency bound, a deadline and correlation deduplication control execution. Cancellation requests and cleanup evidence are separate. A lost start response can be resolved by correlation ID before cleanup is requested.

The extension manifest declares workspace-trust requirements. Its trusted Node host resolves the active saved document through real paths inside an allowed workspace folder; the webview sends only closed start/cancel/apply messages and correlation IDs. The webview has no network access or local resource roots and renders evidence through `textContent`. The host ignores stale messages, aborts polling on disposal, requests backend cancellation with a fresh signal and checks cleanup. Patch application rechecks workspace trust, URI/document identity, version and hash, then uses the VS Code editor edit operation.

## Run the extension

```powershell
cd C:\claude-managed-agents
npm run lab69:extension:build
npm run dev:server
# In another terminal:
code --extensionDevelopmentPath="C:\claude-managed-agents\extensions\lab69" "C:\claude-managed-agents\extensions\lab69\fixture"
```

Open `observation.md` in the Extension Development Host, trust the fictional fixture workspace, and run **Managed Labs 69: Review Active Document** from the Command Palette. The extension's [README](extensions/lab69/README.md) describes conflict and transport checks. Official [workspace trust](https://code.visualstudio.com/api/extension-guides/workspace-trust) and [webview API](https://code.visualstudio.com/api/extension-guides/webview) guidance informs these boundaries.

## Routes

`GET /api/c69/facts`, `GET /code`, and `GET /document` provide readiness, sources and the browser fixture. `POST /document/change` changes that fixture; `POST /document/apply` accepts only a stored run ID. `POST /runs` starts an explicit-context review, `GET /runs/:id` polls evidence, `GET /correlations/:id` resolves a lost start response, and `POST /runs/:id/cancel` requests cleanup. All routes require the local host owner header.

## Troubleshooting

A changed document is expected to reject an older patch; capture fresh context and review again. A stale correlation cannot replace the current review. If transport fails, local cancellation alone cannot prove a remote stop; inspect cleanup or retry lookup through the trusted backend. The extension accepts User-level loopback backend configuration only.

## Limitations

The browser is a simulation of a host document. Tests execute the bundled extension in a mocked VS Code host and validate actual file guards; an interactive VS Code launch is not claimed. The fixture does not grant arbitrary file tools or cloud access to local paths. Live mode reuses the existing text-only Managed runner and validates final JSON; no live session was started during implementation.

## Challenge

Capture context, obtain a valid patch, then edit the document locally. Explain why the patch's correct JSON and correlation still cannot overcome the version/hash conflict.

## Run locally

```powershell
node --import tsx --test tests/lab69-embedding-sdk.test.ts tests/lab69-extension.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab69-browser-demonstration.mjs
```
