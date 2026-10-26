# Lab 25: Context growth and compaction evidence

This lab separates three observations: a persisted `agent.thread_context_compacted` event, cumulative thread usage, and an explicit host-authored summary used to start a different session. None of them supplies an exact free-token count. The offline replay is authored evidence, not a measured platform threshold.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=25`. Offline scenarios use three small reviewed report files and require no credentials. The installed `@anthropic-ai/sdk` version is `1.3.0`. Its compaction event has an ID and timestamp; thread usage and stats can be unavailable.

## Controls

`GET /api/c25/window` inspects checked report hashes and the known/unknown metric categories. `POST /api/c25/run` replays Compacted, No compaction, Missing metrics, or Summary omits. Toggle the separate host summary handoff. `GET /api/c25/code` describes the pinned event and thread shapes. Live mode is rejected until a small, separately opted-in Managed report run is configured.

## Evidence to inspect

The server reads `r1.md`, `r2.md`, and `r3.md` only through an allowlisted path, file-size and symlink check. It hashes the actual bytes and verifies one expected fact per file. The replay feeds typed events through the shared event consumer, while separately recording the documented compaction event ID. A missing event means no compaction was observed in that stream, not that the platform never compacted. Input/output/cache counters are cumulative thread usage, not present-window occupancy. Missing usage remains unavailable rather than zero.

The host summary handoff uses a new fixture session ID and an explicit summary string. In Summary omits, the `r2` fact is absent from the summary and new-session fixture answer. The retention list is checked against the original report facts. This workflow is separate from platform compaction; the authored replay never proves a trigger threshold.

## Troubleshooting

A missing or changed report causes the reviewed read to fail. Invalid extra fields, Agent SDK settings and unbounded deadlines are rejected before a replay. A 429 means this owner or the four-run global limit already has an active replay. A local deadline or disconnect aborts local work without claiming a remote stop.

## Limitations

This checkpoint does not assume `/compact`, PreCompact/PostCompact callbacks, or an automatic-compaction query setting. It does not fill a large context window or use a billed run to force compaction. A live option requires separately provisioned and reviewed Managed resources. [Managed event reference](https://platform.claude.com/docs/en/managed-agents/reference) documents `agent.thread_context_compacted`; [session observability](https://platform.claude.com/docs/en/managed-agents/session-observability) describes cumulative usage and thread views.

## Challenge

Compare an observed compaction event with a host summary handoff. Which could prove a platform action, and which retained facts can be checked against the source reports?

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab25-compaction-context.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab25-browser-demonstration.mjs
```
