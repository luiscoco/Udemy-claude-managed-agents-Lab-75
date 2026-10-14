# Lab 09: System instructions and explicit context

## Prerequisites

Use Node.js 24 and installed dependencies. Offline fixtures need no credentials.
Live execution uses the existing single-agent base and environment from Lab 01, an API key on the server, and an explicitly enabled live gate. No new agent provisioning is required.

## Controls

- **Fixed user question** stays unchanged during Compare all offline variants.
- **System variant** selects Base, Custom replacement, Base plus appended instructions or Base plus authored project context.
- **Custom replacement instructions** replace the base system in the Custom variant.
- **Appended instructions** are joined to the retrieved base system by the host.
- **Compare all offline variants** runs one fresh fixture session at a time. The server caps simultaneous Lab 09 requests at two or the lower configured limit.
- **Run live** asks for an explicit billed run of only the selected variant.
- **Cancel query** stops the local request and invokes shared bounded interruption and cleanup.

## Evidence to inspect

Each comparison shows the same user question, a fresh session ID, source label, requested composition, resolved model/system/capabilities, answer and cleanup.
The Base variant omits `agent_with_overrides.system`, preserving the base system. Custom is an explicit replacement. Both combined variants compose a complete replacement before creating the session.
The composer pins the retrieved base agent ID and version, preserves its model, and explicitly sets `tools`, `mcp_servers` and `skills` to empty arrays. A multiagent base is rejected before creation.

The fictional `CLAUDE.md` is a server-authored constant selected by `aurora-finch-v1`. No arbitrary path, uploaded text or repository file enters privileged context. Browser-provided project text and `system.message` are rejected. This exercise leaves mid-session system messages disabled; such messages append context rather than replacing configured instructions.

## Troubleshooting

- 400: check the variant, limits or authored context ID. `claude_code`, `settings`, `systemPrompt`, `SYSTEM_PROMPT_DYNAMIC_BOUNDARY`, arbitrary project text and unknown fields are unsupported.
- 422: live mode or the base Managed configuration is unavailable.
- 429: the bounded concurrency cap is occupied.
- An error outcome can indicate a multiagent base or a resolved configuration mismatch. No user prompt is sent when capabilities remain enabled.
- Cleanup pending or unconfirmed interruption requires inspecting the reported remote session ID.

## Limitations

Offline answers are authored examples, not observations of Claude. Usage is null offline and when no live model spans report it. Reported spans do not imply complete billed session cost. The lesson makes no quality or cost ranking. Long base instructions exceeding the exercise composition bounds are rejected. Stored agent configuration remains unchanged.

## Challenge

Keep the question fixed and change only the system instructions. Identify whether the base was inherited or replaced, then explain how explicit project context changed the available facts.

## PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab09-system-prompts.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node node_modules/playwright/cli.js test browser-tests/lab09.spec.ts
```

Provider references: [Session overrides](https://platform.claude.com/docs/en/managed-agents/sessions) and [Agent configuration](https://platform.claude.com/docs/en/managed-agents/agent-setup). The installed SDK 0.133.0 types are the implementation contract.
