# Lab 03 checkpoint

Created 2026-10-13 after all verification passed. This workspace has no `.git`
repository, so this manifest is the local review checkpoint instead of a commit.

## Verification

- TypeScript: passed (`tsc --noEmit`)
- Offline suite: 93 passed (12 new in tests/lab03-tools.test.ts)
- Browser flow: 19 passed (Lab 01, Lab 02, Lab 03 and shell)
- Lesson guide/source audit: IDs 1, 2 and 3 passed
- Distribution scan: 180 files passed; `.env` contents were not read
- Production build: passed
- Presentation: 22 slides built from the Lab 01 template; text-fit check found 0 overflows

No provisioning, live experiments, billed requests, Files API uploads or external
mutations were performed. Screenshots come from authored offline fixtures with
Anthropic hosts blocked. Test runners stopped their temporary servers.

## Changes outside new Lab 03 files

- `server/lib/lab01-run.ts`: `raceAbort` is now exported for reuse (no behaviour change).
- `server/concepts/registry.ts`, `src/lessons/registry.ts`, `src/lessons/content.ts`: Lab 03 registered.
- `tests/lesson-guides.test.ts`, `browser-tests/shell.spec.ts`: expectations now include Lab 03.
- `README.md`: lists Lab 03, links its guide, and "How it was built, step by step" now covers the foundation, Labs 01–03 and the presentations.

## SHA-256 manifest

```text
4fbb661a3479784f039ee0a429e81051daa65b1dd96a673695d48c4eb74aea09 README.md
0b7630d8afa87db3a1c3e538f99facb450386dc43231246bf134f85267ed8d2a Tab3-tools.md
566bbbaeead7459744cd7d5a3dcd6173549f8bf3f957449fff490faddba38b2b shared/lab03-tools.ts
c7dfb19b6b730ce72115f6dee25116ef2803495397c8d34132774761ca242b15 server/concepts/03-tools.ts
2cd0ee5120d8f2f9d311672fa71a816ecd9edac82f798f478a806f6f0c7fbb29 server/concepts/registry.ts
eb42836f488a1e47756135c0dcec93811bb742e9633c7be960ca808ba22c41c6 server/lib/lab01-run.ts
1fb088cd70f77740f479e46c8467ab917bc93708fa19a16e94fe43b58af2d10a server/lib/lab03-fixtures.ts
3b2a45d25bc114648c8cbfe19b7f07f002d89e7abf96eefdc35da826f090339a server/lib/lab03-port.ts
1fa5f10850b761bab718fa75b8e61f3eb33a444dcbb04a2ac149c177241b4b31 server/lib/lab03-run.ts
5c13122075dbf906c2076ade9b17e75924801d3afd563ba6bc9cdd165e2667e3 server/lib/lab03-sandbox.ts
b1743c480cadf64deb306a5491189aa7b7e1900797f77f8ce3695573e682b671 src/concepts/Concept03Tools.tsx
20d9a7b61a6d6942bc6c74ee5d0c8f29f126b3ceacc650d9471ea00baed2cd85 src/lessons/content.ts
fb6991a24b79fe6c5101b57b6d9785d4701fe38f94cd713b095426c1f293e6b2 src/lessons/registry.ts
fbf2b579c26d88b0060f85ceffa05d61b1c5ffa31b943def6c9958a328039cd1 tests/lab03-tools.test.ts
22970fcbb2cb4f00a1dbb5b240ce74ee6cc1692235e84cb3fd7beee84e1c6e82 tests/lesson-guides.test.ts
5336b92d342485bee703e754841e9cbd84c1d3227d5cbf702f95c8a3e01f03da browser-tests/lab03.spec.ts
9dc7c2c800fc83292f019c18051bae4b70983646994c2115c7dd0e863f69456b browser-tests/shell.spec.ts
5aac1e2166e345def23085c99baea4daf2cf17184d835df2da0c5f40c7a89137 presentations/lab03/output/Lab03-Claude-Managed-Agents-Built-in-Tools.pptx
```
