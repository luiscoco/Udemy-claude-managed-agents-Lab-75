# Managed Agents foundation migration

Created 2026-10-12 from the original empty-registry checkpoint.
Copied authored source, reusable tests and build scripts only. Excluded secrets,
node_modules, build results, runtime workspaces and historical SDK presentations.

## Architecture

Browser → local Express → official Anthropic TypeScript SDK → managed session.
The browser sees normalized, bounded events and results, never API credentials.
Managed sessions have a separate shared/managed.ts contract; original scripted
lesson contracts and adapters remain available for future deterministic Labs.
server/lib/managed-port.ts isolates API details. managed-run.ts owns session
lifecycle, bounded output, verification, usage and cleanup. The router limits
concurrency to two and checks loopback Host and same-origin mutations.

## Curriculum

Numbered registries remain empty. Original IDs 1–75 are reserved identifiers,
not a promise that the original SDK curriculum maps to Managed Agents.
Review each planned Lab before implementation. Teach agents/environments,
session events, tools/MCP/skills, usage/budgets and lifecycle first. SDK-specific
hooks, local subprocess settings and SDK permission APIs need replacement topics
or explicit comparison guides. Advanced workflow runs, persistent memory and
multiagent coordination need their own lifecycle and completion contracts.
Every Lab still needs a scripted/guided path, strict contracts, real evidence,
an authored guide, source inspection, focused tests and explicit registration.

## Verification

Results are recorded after running the new app's checks. A paid live run requires
the user's configured Console resources and is not claimed by offline tests.

Verified on 2026-10-12:

- TypeScript check and production build passed.
- Offline suite: 58 passed, including the injected lifecycle and official SDK HTTP tests.
- Browser suite: 20 passed on Google Chrome, including 320/390/1280px layouts.
- Distribution scan passed; dependency install reported zero vulnerabilities.
- Desktop and mobile screenshots were rendered and visually inspected.
- Paid live execution has not been attempted: no account credentials or remote
  agent/environment resources were copied or provisioned during migration.

Screenshots: [desktop](managed-foundation-1280.png), [mobile](managed-foundation-390.png).
Local runtime: frontend 5174, API 3076. Test runtime: frontend 5184, API 3086.
