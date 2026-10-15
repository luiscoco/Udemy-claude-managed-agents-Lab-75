# Lab 45: Provider availability and configuration

## Prerequisites

Run the local development server. The catalog is based on current official documentation and installed `@anthropic-ai/sdk` 0.133.0. The emulator needs no cloud account or credential.

## Controls

Load the capability catalog, choose a target and compare Messages versus Managed support. Run synthetic ready, bad-auth, model-mismatch, missing-config and missing-feature preflights against a loopback emulator.

## Exercise

The direct Claude API is the installed Managed-session baseline. [Anthropic's API overview](https://platform.claude.com/docs/en/api/overview) lists Managed Agents on the direct Claude API and Claude Platform on AWS. [AWS feature support](https://docs.aws.amazon.com/claude-platform/latest/userguide/feature-support.html) documents Managed Agents on Claude Platform on AWS, with outcomes and multi-agent sessions unavailable; its [authentication guide](https://docs.aws.amazon.com/claude-platform/latest/userguide/authentication.html) describes SigV4 or a separate API key, regional endpoint and workspace. This project has not verified an installed Managed AWS TypeScript client path, so that route remains unavailable here. Bedrock, Vertex and Foundry Messages access does not prove Managed-session support. The loopback emulator uses synthetic credentials and never creates a session.

## Evidence to inspect

Compare `managedDocumented`, `installedManagedClientVerified` and `managedRouteEnabled` separately. Inspect target authentication shape and prerequisites, emulator HTTP status, redacted credential field and `sessionCreated: false`. `server/lib/lab45-providers.ts` holds the catalog and preflight decisions. Documentation was checked on 2026-10-15; recheck before a real integration.

## Troubleshooting

If the emulator says ready but the target route is disabled, its wire-shape check is only synthetic. Check the exact installed client, endpoint, workspace, model and feature availability before any live request. A first-party setup check reports missing names, not secret values.

## Limitations

No cloud provider was called, and no account, deployment, provisioning or billable run was started. The emulator does not attest actual provider authentication or model availability. Provider capabilities can change; the linked official pages are authoritative for a later deployment.

## Challenge

Identify a preflight check that catches an unsupported provider path.

## Run locally

```powershell
node --import tsx --test tests/lab45-providers.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab45-browser-demonstration.mjs
```
