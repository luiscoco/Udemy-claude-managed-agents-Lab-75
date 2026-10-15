# Lab 23 checkpoint

The host bundle pins a command, read-only tool, skill snapshot, primary and restricted worker definitions, and optional URL MCP declaration. Validation is based on fixed paths, exact namespaces, capability allowlists and SHA-256 hashes. Reload changes only the local inventory. The offline run invokes one actual host handler when enabled and records its effect; no Managed session is created.

Verification: the production build, guide audit, 254 cumulative offline tests, two Lab 23 browser checks, and desktop/phone browser demonstration passed. No paid provider call, skill upload, agent provisioning or MCP contact was made automatically. Fixture-resolved capabilities are not evidence of remotely resolved Managed configuration. A future live setup needs separately reviewed resource IDs and version pins.
