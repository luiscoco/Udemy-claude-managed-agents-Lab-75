# Lab 64: Browser tools across host and cloud

## Prerequisites

Install the pinned development dependencies and a local Chrome browser. The exercise starts an ephemeral loopback fixture and fresh isolated Playwright browser profile. It makes no Anthropic request and needs no API key.

## Controls

**Inspect product** navigates to the fixed fictional field kit page, requests an MCP snapshot and independently checks heading and price in the live DOM. **Fill fictional form** uses MCP fill and click operations, then checks the rendered confirmation. **Try blocked navigation** submits an external URL to the host bridge; the host refuses it before MCP dispatch. **Missing browser** shows the absence of proof without a model claim.

## Evidence to inspect

The host client connects to pinned `@playwright/mcp@0.0.83` through an in-memory MCP transport. Only navigate, snapshot, fill, click and screenshot are issued; unsafe evaluation, file upload, download and arbitrary URLs are not bridged. A Playwright route blocks requests beyond the fixture origin, including redirected requests. Each run gets a fresh host browser context and fixture server. Proof checks MCP snapshot text against independent live DOM reads and a host-captured screenshot. Model prose and cloud event fixtures are not browser proof.

The screenshot route requires the same local experiment owner as the run. The cloud Managed session cannot access host localhost or spawn this local MCP server; a reachable remote browser is a separate setup and is not configured here.

## Troubleshooting

If Chrome is missing, install a local Playwright-compatible browser. A blocked URL is an expected refusal, not a product failure. The browser and fixture server close after every run, including failure. The host limits concurrent runs and MCP calls.

## Limitations

This is a local, guided browser experiment. The attached host context requires `isolated: false` in the MCP connection; `isolated: true` asks the package to create an unsupported second context. The host already creates a fresh temporary profile for each run. It does not grant a cloud agent browser access. The fixture form records no real personal information.

## Challenge

Compare the MCP action trace with the host-verified DOM fields and screenshot. Explain why a successful tool result alone cannot prove the expected product state.

## Run locally

```powershell
node --import tsx --test tests/lab64-browser-playwright-mcp.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab64-browser-demonstration.mjs
```
