# MCP servers

Lab 13 explicitly registers two authored teaching servers:

- `lab13-notes.mjs`: a protocol-only stdio server with immutable fictional notes.
- `lab13-inventory.ts`: an authenticated, loopback-only, stateless Streamable HTTP
  factory with an isolated fictional stock store.

Both implement the bounded MCP 2025-11-25 initialize/tools subset. They start only
after an explicit Lab 13 exercise action and are stopped with that owned session.
The app does not discover or execute arbitrary files from this directory. Its
supervisor fingerprints authored source here to restart the backend after edits.

Native Managed URL MCP requires a separately reviewed/deployed HTTPS endpoint
and existing vault. These local servers are not exposed or tunneled automatically.
See `Tab13-mcp-servers.md` and the source viewer for the real transport clients,
typed host bridge and native configuration boundaries.
