# Lab 39: Trusted configuration and untrusted checkouts

## Prerequisites

Run the local development server. Git enables the disposable worktree; if Git is absent, the exercise uses a host-created local fixture. No Anthropic key is needed.

## Controls

Choose conflict, missing-manifest, modified-hash or takeover. Press **Create disposable worktree**, then inspect provenance, attempt takeover, or use the checked read/edit controls. The dry check only reports the host manifest hash.

## Exercise

The host owns an immutable agent configuration manifest and SHA-256 hash. It selects the agent, custom tool names, MCP and skills. The branch checkout contains fictional notes and a conflicting `CLAUDE.md` marker. Checked reads may show branch text as data, but cannot promote it to system instructions. Edits are limited to `notes.txt`; traversal, absolute paths, repository metadata and links are refused. Git fixture creation disables hooks. Missing or changed hashes reject the session before checked tools run.

## Evidence to inspect

Compare expected and supplied hashes, host and branch markers, tool decisions, branch hook count and provider call count. Inspect `server/lib/lab39-project-config-root.ts` for provenance, path checks and worktree cleanup. The evidence is host-generated; branch text is not an instruction.

## Troubleshooting

If Git cannot create the worktree, the local fixture keeps the boundary exercise available. A rejected manifest disables checked reads and edits. Use `notes.txt` for a permitted edit; `CLAUDE.md` is read-only branch data.

## Limitations

This is a local authored fixture. It does not mount an unreviewed remote repository, start a Managed session, discover `.claude/skills`, execute branch hooks or prove model behavior. A remote mount would require a reviewed resource policy. The checked tools demonstrate the host boundary, not a general repository sandbox.

## Challenge

Identify a branch rule the trusted configuration refuses to execute.

## Run locally

```powershell
node --import tsx --test tests/lab39-project-config-root.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab39-browser-demonstration.mjs
```
