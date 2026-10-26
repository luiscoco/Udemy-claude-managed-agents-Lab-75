# Build lessons 1 through 15

Open one prompt at a time in this order. A lettered lesson extension belongs immediately after its parent lesson. Do not skip its checkpoint.

- [L01 Session event streaming](lessons/L01.md) â€” Consume a Managed Agents event stream and tell agent response text apart from session lifecycle events and turn completion.
- [L02 Session options](lessons/L02.md) â€” Control a dedicated Managed Agents session with model and system overrides, a list-cost budget, connection previews and a local deadline.
- [L03 Built-in tools](lessons/L03.md) â€” Distinguish a tool being enabled in the session toolset from a call being permitted by its permission_policy and the host, and verify the effects in files rather than in agent claims.
- [L04 Permissions](lessons/L04.md) â€” Approve or deny paused tool calls through a host review dialog: the Managed Agents equivalent of canUseTool is a requires_action pause answered once with user.tool_confirmation.
- [L05 Custom tools](lessons/L05.md) â€” Expose typed application functions as Managed Agents custom tools: the agent declares them, the session pauses on agent.custom_tool_use, and the host validates the input, runs the handler and answers once with user.custom_tool_result.
- [L06 Sessions and retained context](lessons/L06.md) â€” Continue a conversation in the same server-owned Managed session, compare it with fresh context, and reconnect without duplicating persisted events.
- [L07 Tool policy and execution audit](lessons/L07.md) â€” Replace Agent SDK tool hooks with a host policy pipeline that validates before execution and records the actual effect afterward.
- [L08 Delegation and session threads](lessons/L08.md) â€” Delegate bounded work to predefined Managed Agents, inspect separate session-thread histories, and verify role capabilities and effects in the host.
- [L09 System instructions and explicit context](lessons/L09.md) â€” Compare inherited and explicitly composed system instructions in fresh sessions while keeping the question and base model fixed.
- [L10 Validated reports and interruption](lessons/L10.md) â€” Validate final JSON reports with a closed application schema and distinguish interrupt, local abort and idle-session close.
- [L11 Managed skills and progressive loading](lessons/L11.md) â€” Inspect pinned skill metadata separately from observed instruction and reference file reads in fresh sessions.
- [L12 Multiple messages in one session](lessons/L12.md) â€” Queue multiple messages in one retained session, separating local admission, provider acceptance and correlated turn outcomes.
- [L13 MCP connections and reachability](lessons/L13.md) â€” Connect real local MCP transports, separate configuration from observed reachability, and compare host bridges with native Managed HTTPS MCP.
- [L14 Models and supported effort](lessons/L14.md) â€” Compare supported model and effort settings in fresh sessions with resolved metadata, public responses and explicit fallback budgets.
- [L15 Usage and session budgets](lessons/L15.md) â€” Read cumulative session usage and separate overlapping scopes while enforcing platform budgets and bounded host turns.
