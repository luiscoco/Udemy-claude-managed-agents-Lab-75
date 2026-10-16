# Lab 59: Routing with verified outcomes

## Prerequisites

Run the local learning platform. This lesson is a deterministic offline routing fixture with 13 authored tasks and separate application answer keys. It needs no API key and makes no provider request. The model names and effort settings are illustrative local configurations, not a guarantee of current account availability.

## Controls

Choose fixed light, standard or deep, rule, classifier, cascade or draft/review. Set an assumed spend-unit budget and run the fixture. `GET /plan` lists the task prompts without their answers; `GET /models` lists the illustrative model/effort pairs. `POST /delegate` rehearses one task, while `POST /resolution` validates closed JSON `{answer,confidence}` and checks the independent answer key.

## Evidence to inspect

Each attempt has a separate hypothetical session ID, tier, model, effort, role, authored token/spend/time figures, answer, confidence and host verification. Classifier and reviewer attempts count toward spend and time. The final result reports correct tasks, sessions, cost per correct, median task time and whether the budget stopped admission before another call. A wrong answer can have 0.94 confidence; only the host key establishes correctness. A malformed or extra-field report fails closed validation.

## Troubleshooting

If fewer than 13 tasks appear, the budget stopped before admitting another assumed session. Compare attempted and total tasks and include incomplete cascades when assessing cost. A session ID here is an offline trace label, not proof of a remote session. There is no query `setModel` switch; a real model change would create another Managed session with its own identity and usage.

## Limitations

Token figures, latency and spend units are authored assumptions, not measured usage or historical prices. Availability may change. The fixture has no uncertain sends; a live adapter would need to account for those and stop admission under a total spend cap before each new call. No live sessions, provisioning or billed requests occur in this lesson.

## Challenge

Run fixed light on a deep task and find its high-confidence wrong answer. Compare the host answer-key verdict with the confidence and explain which field should drive routing evaluation.

## Run locally

```powershell
node --import tsx --test tests/lab59-model-routing.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab59-browser-demonstration.mjs
```
