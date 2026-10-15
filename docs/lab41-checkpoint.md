# Lab 41 checkpoint

The current Managed SDK port shape drives an authored lifecycle fixture. One-shot archives after idle, retained turns reuse the same resolved session ID, reconnect lists history without another creation, and archive refuses a new send. The historical local-process comparison is static.

Verification: five focused tests and all 329 cumulative offline tests passed. Typecheck, production build, guide audit, four guide tests, nine browser tests and the 390/1440-pixel demonstration passed. The distribution scan passed across 1,780 files. Screenshots are in ignored `artifacts/lab41/`.

Limitations: this fixture makes zero Anthropic calls. Its IDs and idle/cleanup evidence are authored, not measurements of a remote Managed session or billing. No process-count or JSONL compatibility claim is made.
