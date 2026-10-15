# Lab 42 checkpoint

The installed Managed SDK exposes typed `web_search` and `web_fetch` configuration. The authored offline research fixture uses a narrow host fetch policy, checks redirect targets before another request, rejects private/loopback URL and address examples, treats hostile text as data, and verifies citations against inspected evidence IDs.

Verification: four focused tests and all 333 cumulative offline tests passed. Typecheck, production build, guide audit, four guide tests, nine browser tests and the 390/1440-pixel demonstration passed. The distribution scan passed across 1,796 files. Screenshots are in ignored `artifacts/lab42/`.

Limitations: no real network or Anthropic call was made. The fixture address mapping does not pin a real connection, so this is not a production SSRF-safe fetch implementation. Optional live research is disabled until a reviewed public-documentation policy, connection pinning and spend limits exist.
