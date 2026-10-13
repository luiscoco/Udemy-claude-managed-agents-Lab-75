# Lab 04 checkpoint

Created 2026-10-13 after all verification passed. This workspace has no `.git`
repository, so this manifest is the local review checkpoint instead of a commit.

## Verification

- TypeScript: passed (`tsc --noEmit`)
- Offline suite: 102 passed (9 new in tests/lab04-permissions.test.ts; the 12 Lab 03 tests pass unchanged after the refactor)
- Browser flow: 22 passed (Labs 01–04 and shell)
- Lesson guide/source audit: IDs 1, 2, 3 and 4 passed
- Distribution scan: 205 files passed; `.env` contents were not read
- Production build: passed
- Presentation: 22 slides built from the Lab 01 template; text-fit check found 0 overflows

No provisioning, live experiments, billed requests, Files API uploads or external
mutations were performed. Test runners stopped their temporary servers.

This manifest supersedes the Lab 03 hashes for the shared files listed below, which the refactor changed.

## Changes outside new Lab 04 files

- Lab 03 internals were extracted for reuse, with the same exports and behaviour:
  - `server/lib/tool-session-run.ts`: the stream runner, with an `answer` hook per pause
  - `server/lib/tool-session-port.ts`: the live and fixture ports
  - `createPlanFixture()` in `server/lib/lab03-fixtures.ts`
  - `hostAllowCheck()` in `server/lib/lab03-sandbox.ts`
  - `toolsetFrom()` in `shared/lab03-tools.ts`
- `shared/contracts.ts`: `CONFLICT` added to the API error codes (409).
- `server/concepts/registry.ts`, `src/lessons/registry.ts`, `src/lessons/content.ts`: Lab 04 registered.
- `tests/lesson-guides.test.ts`, `browser-tests/shell.spec.ts`: expectations now include Lab 04.
- `README.md`: lists Lab 04 and describes how it was built.

## SHA-256 manifest

```text
9dfafc0684322dcfe7181ed29aa417a1357f09ca509cb480ec627efcc2f7f489 README.md
d63954a59347d467fcd1851440d517f32533a6fd5113839b8590c49a88074ce8 Tab4-permissions.md
ec90eadd4bca0be18bca98e54c03919d5bcc8e035508cd58954928ff6f6a76fb shared/contracts.ts
337eef647783cb35a85b8e27b53704d08a1bcceff95d1adaf74b37e59ecd10aa shared/lab03-tools.ts
8aa2dbbf7d772f0e9d379056a96baffde65f6fd9c4726f351633f31c67d49052 shared/lab04-permissions.ts
f4ceac5cd08a8c1240c5a60fdcaf6be022d3e361f7a75d22a600bf43de2dd7e7 server/concepts/04-permissions.ts
0912ebaef600efc6397f1cd89d68187c4fab385f83d5473031ce14602563f911 server/concepts/registry.ts
ac392950d22c7a324cb4386a73c221b5b0c026bc76d5595a0594e4ef0698dbd6 server/lib/tool-session-port.ts
a24c3f7c0e8c79d6b30835c3b3eb0d7e02aad428bb5821546b57510a2d731524 server/lib/tool-session-run.ts
6445fe7441ca8dbb51d71b4d0a41259f1c20e3caa8ec083661546d7be06e05cd server/lib/lab03-port.ts
b988f48b468b79bb27966189ffb3641b0a77cd118be9941862c0d71c47058f0d server/lib/lab03-run.ts
b955cec8da8544eb92df02f02043a18af2de65561b393c89aab1d7f9f472efc3 server/lib/lab03-fixtures.ts
a854b421f63c01bb6c35ec4d2197551375ca0a13613370e0115bf75979b6fabc server/lib/lab03-sandbox.ts
4aeeb8584e557d69e6db9b522859ad57b5d0bc5e4984f9573606483f14619a92 server/lib/lab04-approvals.ts
bb945599d5979a2b961a353de6a4fdb2a0b449fc9059ecf2da71946dd963bb8e server/lib/lab04-fixtures.ts
8010e644e4715a6fdc2953dab90d31abb19484fbc69c03716cfe27fa0a1da1ba server/lib/lab04-port.ts
29d7d44ac75e9e7c3b238db6f58e85d3c9f7e5b85173e53dde04de8020c71bbe server/lib/lab04-run.ts
9bcdfdf4e3e68cc7585a243114278935e5c1cafb8d3ef88ba0d603ef5e53c072 src/concepts/Concept04Permissions.tsx
2f1bf9f5883ca749cb381cd607d78590f630f0805f10d3ba6f6f40fe7cf75e4c src/lessons/content.ts
7c9de8b812a9262130538f23594e7d44da4128d64625564715eeea784bf5d291 src/lessons/registry.ts
54fffdc80b5ef62541e4874118c85da4933262d0e9af022de33ad30b4411972a tests/lab04-permissions.test.ts
24c6d161b161d99ce78b7387912524961804cf4908a73d7a9b2305a5d2b39130 tests/lesson-guides.test.ts
da6ae0a9f7981c1a95aeb6d6872609d96ac86b3ca19ec5f82a85c93dddf12ced browser-tests/lab04.spec.ts
be429fe5d2643b4b5564be30f58756fe84ef6cbec641f30cfd962c93e56d31ee browser-tests/shell.spec.ts
1c87c6ff404201dda810e606973b1eb0e1f5fbdf7938dd5a0f655868bfc73fa0 presentations/lab04/output/Lab04-Claude-Managed-Agents-Permissions.pptx
```
