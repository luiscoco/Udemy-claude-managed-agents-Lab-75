# Lab 72: Document generation with Skills

## Prerequisites

Use Node 24 and install the pinned project dependencies. This exercise is offline. The authored skill lives in `docgen-skills/atmira-docx`, with SKILL.md, progressive references, brand assets and a dependency-free deterministic builder. A local skill folder is not automatically mounted in Managed sessions.

## Controls

Choose incident or ordinary and Build document. The scripted agent uses only read_spec_reference, write_spec and build_document. It cannot run arbitrary commands. Compare invalid-spec, placeholder, injection and skill-tamper fixtures. The injection scenario preserves conflicting impact counts and excludes instructions and the fake token from the report. Check command policy inspects a string without executing it. Download verified DOCX fetches an owner-scoped opaque file ID.

## Evidence to inspect

Inspect correlated custom tool result IDs, both reference reads for incidents, the authored skill SHA256 manifest, independent package checks and the separate incident contract. Reports preserve both 120 and 145 as unconfirmed impact estimates, an unknown root cause and explicit unassigned owners. ZIP timestamps, ordering and document properties are fixed. Numbered lists restart independently. XML-like input is literal text and is escaped; there is no inline markup grammar.

Each session copies the five allowlisted skill files into `docgen-lab/runs/<uuid>`. The host verifies every skill hash before execution and afterward, invokes only the fixed builder path and arguments with no shell, and independently reads the output ZIP. Downloads repeat integrity checks. Cancellation terminates only the local builder; no remote session exists in this exercise. Owner headers isolate local fixtures and are not production authentication.

## Troubleshooting

Invalid specifications produce SPEC ERROR and builder exit 2. Placeholder and fake-secret patterns fail host inspection. Changed or unexpected skill files prevent execution. A rejected document has no download ID. Session capacity is twenty per server process; restart the backend to reset the teaching store. Builds have a five-second child-process deadline and a global limit of two.

## Limitations

The scripted exercise does not claim model-generated tool calls or remote skill loading. The live query route explicitly rejects unsupported mode. `npm run docgen:package` creates a local ZIP and hash manifest only; deliberate upload and immutable version configuration are separate setup through the Managed Skills API, as explained in Lab 11. Do not reuse its format-observation pins for this different skill. Configure a dedicated read-only Managed agent with only these custom tools before adding a live adapter. Do not give remote agents host shell access or assume remote skill paths equal local paths.

Package checks validate the narrow authored OOXML profile, not all possible Word documents, factual correctness, semantic compliance or pagination. Open the downloaded document in Word and inspect every page, table, footer and list restart. Automated package checks cannot substitute for that visual review. Skill hashes attest bytes, not trustworthiness of their instructions. The intentionally tiny grammar supports literal text and native lists only.

## Challenge

Add two separate numbered lists and XML-looking text. Show that each list starts at one and markup remains visible text. Remove an incident section and explain why ordinary package validation and the incident contract answer different questions.

## Run locally

Run `npm run dev`, then open lesson 72. Run `npm run test:docgen`, `npm run docgen:package`, typecheck, build, guide audit and focused browser checks. No paid provider calls are needed.
