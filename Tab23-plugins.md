# Lab 23: Reusable capability bundles

This lab treats a plugin as a reviewed application bundle, not an Agent SDK plugin loader. A local manifest pins six fixed contributions by SHA-256: a command template, a read-only custom tool, a skill snapshot, a primary agent definition, a restricted worker definition, and an optional URL MCP declaration. Its `1.0.0` version is a host bundle version, not a provisioned Managed agent version.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=23`. All exercises are offline and require no credentials. The bundle files live under `fixtures/lab23/bird-notebook`; the server reads only those fixed paths. No live resource IDs or pins are provisioned by this lesson.

## Controls

`GET /api/c23/plugins` shows the active manifest and recent owner-local comparisons. `POST /api/c23/reload` rereads the reviewed files. Try Valid, Malformed, Missing directory, Changed hash, and Elevated worker; a rejected reload leaves the active inventory unchanged. Select bundle on/off, skill and optional MCP inclusion, and one of two fictional locations. `POST /api/c23/inventory` compares requested capabilities with an authored fixture resolution. `POST /api/c23/run` invokes the actual read-only host handler only when the bundle is enabled. `POST /api/c23/reset` clears this owner's local comparisons after confirmation.

## Evidence to inspect

Compare each contribution path and pinned hash with the active manifest digest. When disabled, the handler count is zero. When enabled, the `bird.list_sightings` handler reads its validated fixture records and records the checked result. The worker has no tools, skills, MCP servers or dynamic delegation. Skill inclusion is metadata in this exercise, not evidence of an agent file read. MCP inclusion is a declaration; the reserved `example.invalid` endpoint is never contacted. Requested and resolved inventories match only in the authored fixture; no Managed session is created.

## Troubleshooting

If the bundle fails to load, check the six authored fixture files and the pinned hashes in `manifest.json`. A changed file requires a deliberate review and manifest repin; Reload does not silently accept it. Malformed and elevated-worker variants deliberately fail validation. An invalid request field or arbitrary path is rejected before a host tool effect.

## Limitations

This lab does not install a marketplace plugin, register hooks, provision a Managed agent, upload a skill, or connect to MCP. Live mode returns unavailable until those resources are reviewed and provisioned in a separate explicit setup workflow. A future live session would need exact resource IDs and versions, a capability check, and resolved session verification. [Managed agent configuration](https://platform.claude.com/docs/en/managed-agents/agent-setup) is versioned; [session updates](https://platform.claude.com/docs/en/managed-agents/session-operations) can replace tools and MCP servers only while eligible and idle. A changed skill or system value requires a fresh session. Local Reload never updates a remote session.

## Challenge

Reload the reviewed bundle and compare requested with fixture-resolved capabilities. Which observations prove a host effect, and which Managed capabilities remain unverified?

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab23-plugins.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab23-browser-demonstration.mjs
```

Official references: [agent setup](https://platform.claude.com/docs/en/managed-agents/agent-setup), [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations), [skills](https://platform.claude.com/docs/en/managed-agents/skills), [MCP connector](https://platform.claude.com/docs/en/managed-agents/mcp-connector).
