# Lab 46: Observed cache usage and cost

## Prerequisites

Run the local development server. Offline readings are authored fixtures; no Anthropic key is needed.

## Controls

Compare reused content, changed prefix, changed model, changed tools, short input or missing usage. Inspect the stable handbook, changing suffixes, session/model/tool identities and cache-read/creation counters.

## Exercise

The installed Managed SDK exposes cache-read and cache-creation counters in model-request usage records, plus cache readings in session usage. This lesson normalizes the observed fields through the Lab 15 usage boundary while keeping the model-request creation counter separate from any TTL breakdown. A retained session can compare two model-request readings of equal scope; fresh sessions with changed model or tools are shown side by side without subtraction. Missing usage remains unknown. Managed Agents owns internal model request composition, so `cache_control`, `SYSTEM_PROMPT_DYNAMIC_BOUNDARY`, TTL switches and `PreModelSwitch` veto are not session options. A direct Messages demonstration would be a separate opt-in API.

## Evidence to inspect

Compare source, scope, session ID, model, tool version, content hash and input/output/cache counters. List cost stays unknown at model-request scope. Read `server/lib/lab46-cache-observations.ts` and the shared Lab 15 normalizer. An authored cache-read value illustrates a counter, not a measured hit rate or billing reduction.

## Troubleshooting

In the missing-usage case, counters are unknown. Short input may show zeros. Fresh model or tool variants deliberately use separate session IDs and have no numerical delta.

## Limitations

All counters are authored examples. The lab makes zero provider calls and offers no guaranteed hit, minimum cacheable size, cache lifetime, token price or savings estimate. A host Managed HTTP wire tap cannot inspect the harness's internal Messages requests.

## Challenge

Change a content prefix and compare measured cache counters when available.

## Run locally

```powershell
node --import tsx --test tests/lab46-cache-observations.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab46-browser-demonstration.mjs
```
