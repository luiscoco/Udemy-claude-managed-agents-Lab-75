# Lab 07: Tool policy and execution audit

Replace Agent SDK tool hooks with an explicit host pipeline around Managed Agents custom tools.

## Prerequisites

- Complete Labs 01–06 and install dependencies with Node.js 24 or newer.
- Offline mode needs no credentials and never contacts Anthropic.
- Live mode requires the base Managed environment plus a dedicated Lab 07 agent provisioned with `npm.cmd run managed:provision -- lab07`.

## Controls

- **Audit only** validates and executes a safe edit of `/workspace/draft.md`.
- **Deny write** refuses a protected-file edit before its handler runs.
- **Rewrite input** changes `/workspace/proposed.md` to `/workspace/draft.md`, then validates the effective input again before execution.
- **Handler exception** demonstrates a permitted call whose handler fails without changing the file.
- **Repeated call** proves one `sevt_` custom-tool call receives at most one result.
- **Hang** can be cancelled to inspect bounded interrupt and cleanup.

## Evidence to inspect

Every audit row separates original input, effective input, policy decision, validation phase, whether the handler ran, execution outcome, result sent and file contents before and after. A denial has identical before and after values. A rewrite displays both paths and `revalidated`. A handler failure is distinct from a policy denial.

The three tools are custom tools on a dedicated versioned agent. Built-in filesystem and Bash tools are absent. The host answers `agent.custom_tool_use` with exactly one `user.custom_tool_result` correlated by the call's `sevt_` ID.

## Troubleshooting

- **Live unavailable**: provision the Lab 07 agent, set `CLAUDE_MANAGED_LAB07_AGENT_ID`, verify it, and restart the server.
- **Rejected path**: only the named `/workspace` fixtures are accepted; traversal, Windows paths and other roots are refused.
- **Missing oldText**: the policy allowed the call, but the handler failed and recorded no effect.
- **Protected file changed unexpectedly**: inspect the before/after evidence and the selected policy; deny-write must report that the handler did not run.

## Limitations

Pre-execution and post-execution phases are application code, not native Managed Agents hook events. A post-execution audit can record a completed effect but cannot undo it. Built-in `always_ask` calls can be approved or denied with `user.tool_confirmation`; that confirmation cannot rewrite their input. This lab uses custom tools because rewriting occurs inside the host handler boundary.

## Challenge

Block a protected-file call and identify the host decision that prevented the effect before any handler ran.

