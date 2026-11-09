# Portal dependency upgrade — 9 November 2026

The main portal and all three standalone learning projects now use the reviewed
current npm versions and refreshed lockfiles. The independent Python worker and
publishing libraries are upgraded through their pinned requirements files.
Node 24 remains the runtime baseline; the CI Python interpreter remains 3.13.

| Dependency | Previous | Updated |
| --- | --- | --- |
| Anthropic TypeScript SDK | 1.3.0 | 1.7.0 |
| Anthropic AWS SDK | 0.8.0 | 1.1.2 |
| Azure Monitor exporter | 1.0.0-beta.46 | 1.0.0-beta.47 |
| Microsoft authentication | 7.1.0 | 7.2.1 |
| OpenTelemetry resources and trace base | 2.12.0 | 2.12.1 |
| MCP TypeScript SDK | 1.32.1 | 1.32.2 |
| Playwright MCP | 0.0.83 | 0.0.85 |
| Playwright and its test runner | 1.61.1 / 1.64.0 | 1.65.0 |
| React and React DOM | 19.3.0 | 19.3.1 |
| Express | 5.2.1 | 5.3.0 |
| Vite | 8.3.0 / 8.3.4 | 8.3.7 |
| Vite React plugin | 6.1.1 | 6.3.0 |
| Concurrently | 10.0.5 / 10.0.6 | 10.0.7 |
| WebSocket library | 8.22.0 | 8.22.2 |
| Zod | 4.6.5 | 4.6.7 |
| Highlight.js | 11.11.1 | 11.12.0 |
| Node type declarations | 26.6.2 | 26.6.6 |
| VS Code type declarations | 1.140.0 | 1.145.0 |
| Python Anthropic SDK | 1.7.0 | 2.7.0 |
| Pillow | 12.3.0 | 13.0.0 |
| PyMuPDF | 1.28.2 | 2.1 |

Dependencies already at their reviewed latest versions retain their versions.
Compatible transitive packages are refreshed through npm rather than forced
outside their declared ranges.

## Compatibility decisions

- Azure's `latest` tag still points to beta.32, older than the installed beta.46.
  This upgrade follows its current `beta` tag, beta.47, rather than downgrading.
- OpenTelemetry resources 3.1.1 requires the API 1.10 line, while the Azure
  exporter and trace-base 2.x integration use the API 1.9 line. Both direct
  OpenTelemetry packages therefore use the newest compatible `latest-2` release,
  2.12.1. Mixing incompatible major lines is not part of this upgrade.
- The VS Code extension uses existing APIs; upgrading declarations does not add
  new editor APIs or change its declared minimum editor version.
- API credentials and provider resource identifiers remain private local setup.
  TypeScript retains zero retries, bounded deadlines, explicit live gates and
  disabled automatic SDK tracing. Python readiness inspects the installed local
  API surface without sending a provider request.

## Student installation

Preserve your work, stop your own development processes, update your source, then
run `npm ci` followed by `npm run projects:install`. Reinstall the selected
Playwright browsers after upgrading Playwright. In your isolated Python
environment, install both `python/lab70/requirements.txt` and
`mini-projects/agent-publishing-studio/requirements.txt` when using those features.
Follow `docs/managed-milestone-projects.md` for the full project prerequisites.

Run typecheck, offline checks, project checks/builds, browser regression, the
production build and distribution checks. Read the actual GitHub Actions result
for the tested commit. Passing offline checks does not establish paid live
provider acceptance or cloud deployment compatibility.

Current SDK facts, Lab 55 baseline and the student build curriculum are refreshed.
Historical checkpoint and live-run reports retain their tested versions. Eleven
main concept files change version labels only; their line counts, spoken text,
audio, word timings and section anchors are retained. Their source identity pins
are refreshed only after comparing the exact version-only substitutions.

## Sources

- [Anthropic TypeScript changelog](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/CHANGELOG.md)
- [npm registry](https://registry.npmjs.org/)
- [Python package index](https://pypi.org/)

The local audit and validation logs are under the ignored
`artifacts/dependency-upgrade/` directory. They are production evidence rather
than student source files.
