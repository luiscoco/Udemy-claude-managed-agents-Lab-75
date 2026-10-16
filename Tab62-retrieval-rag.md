# Lab 62: Retrieval RAG through custom tools

## Prerequisites

Run the local learning platform. This lesson uses fictional documents and deterministic lexical retrieval. It makes no Anthropic request, needs no API key and does not use embeddings.

## Controls

Enter a question and choose grounded, fabricated citation, wrong policy, no match or hostile note. Run the offline retrieval fixture. `POST /search` exposes a bounded search; `GET /eval` replays the five regressions; `POST /query` returns the tool event, filtered results, authored report and host verification.

## Evidence to inspect

Documents are split by heading into stable IDs such as `doc-acme-returns#eligibility`. The host filters tenant `acme` and current version before keyword/heading scoring. The current return policy says unused items may be returned within **30 days**. An archived Acme document says 60 days and a foreign-tenant document says 90 days; neither enters the scored set. A shipping document, security document and imported hostile note round out the corpus.

The Zod-derived `search_knowledge` custom-tool schema is closed. The offline handler returns `user.custom_tool_result` correlated by the original `sevt_` ID. Reports require an answer and evidence IDs/quotes. The host checks every ID against the exact results returned during that run and each quote against that chunk's text. A policy answer must match the 30-day host key and cite the current eligibility chunk. A fabricated ID, an archived answer, empty no-match evidence and an imported instruction claiming 365 days fail. The hostile note is data, not authority.

## Troubleshooting

A no-match query cannot support a cited answer. A quote with changed punctuation or words fails exact text validation. A search hit alone does not prove a report is true; inspect the final `verified` flag and reason. Caller-supplied tenant/version selectors and Agent SDK fields are outside the closed route schemas.

## Limitations

This is heading and keyword scoring, not semantic/vector retrieval. The answer drafts are authored fixtures and not observed model behavior. A live Managed extension would need an injected session, narrow toolset, bounded calls and host validation of its final JSON or tool report. No local files are assumed present in the cloud sandbox.

## Challenge

Try to cite the archived 60-day policy or the foreign 90-day policy. Explain why filtering before scoring means neither ID can validate against the run’s returned evidence.

## Run locally

```powershell
node --import tsx --test tests/lab62-retrieval-rag.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab62-browser-demonstration.mjs
```
