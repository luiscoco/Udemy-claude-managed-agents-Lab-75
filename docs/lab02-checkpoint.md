# Lab 02 checkpoint

Created 2026-10-12 after all verification passed. This workspace has no `.git`
repository, so this manifest is the local review checkpoint instead of a commit.

## Verification

- TypeScript: passed (`tsc --noEmit`)
- Offline suite: 81 passed
- Focused Lab 02 suite: 7 passed
- Browser flow: 16 passed (Lab 01, Lab 02 and shell)
- Lesson guide/source audit: IDs 1 and 2 passed
- Distribution scan: 157 authored files passed; `.env` contents were not read
- Production build: passed (180 modules)

No provisioning, live experiments, billed requests or external mutations were
performed. The browser test runner stopped its temporary API and Vite servers.

## SHA-256 manifest

```text
d75e01b91e7da47bc9d9ebe4f0646cc6c768f44949660209832216583b1b8c77 .env.example
745e787d8b198c33018896db42fcaacf95b01c73f41883cafe26fe9a8e31db30 README.md
a1f92d3ffc3876fdc3b6d538536c1fe17b71e1dcfda5ca876caf5a2a919d986a Tab2-options.md
d3cd66c825071ac20e7644a6276ceb4500430a803221ed9cc73800230b24e897 shared/lab02-options.ts
09af696080eae7a4e114394401868407343a4b33f46ec1276492ad9a93e86e61 server/concepts/02-options.ts
74f7739c978783a24d812b263c037f22397c3309bc1a19fdbd4318a97288a703 server/concepts/registry.ts
efdad6ac0d5c814c5cece7ad7cd01090764ee8007356e17584e53162f6a21fd0 server/lib/lab01-run.ts
4ef305c3e00279a7bbac9750ec15d4ed6b62b586a643070be2b008f074838883 server/lib/lab02-fixtures.ts
fd22ef157f821bb9ee0bde7e7263758b9bc190b42d6d636bb1dfafef516e324b server/lib/lab02-port.ts
3d9c39e2d74c57c463494fd7ba33f71ba5a4210c6581d0cafc548ae846ae8081 server/lib/lab02-run.ts
f79f8bfa6a92d84732578312a6d32d10cd491e7d971f22c6ad585c69199b2681 src/concepts/Concept02Options.tsx
752c4e0ef18bd1db75ded41b62f96a2b32f86a65d3f16502ad262f6579d6b5d6 src/lessons/content.ts
22fabda45de55cdf7c130a0c78460195dae454a3ed0a7e9821f6c596a9b96dcc src/lessons/registry.ts
75e9fccdc671be6cb11b0d58db1cf5fc0e19773447a23830e7c8e1b4b7a098d0 src/styles.css
02e0d1a31ec9be3d740b606a23ebdd80adee83945bc72a9d13435e9b44d7a18c tests/lab02-options.test.ts
93c41fe55b2e55c666d39de500bd201a00a514bd6a1c1feba56c93f55fd17080 tests/lesson-guides.test.ts
6560ee0bba3e4176f180386b075096d804e0161e307328b6f2de51d997b3a22e browser-tests/lab02.spec.ts
3bdbff7326dd88b83fb4da96390a343e0ad5122297e4a3ed6a8f086351d37748 browser-tests/shell.spec.ts
```
