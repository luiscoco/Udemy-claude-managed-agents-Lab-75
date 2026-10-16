# Lab 58: Tool catalogs and bounded discovery

## Prerequisites

Run the local learning platform. This lab uses a deterministic host catalog and makes no Anthropic request. No API key, provisioning or live session is needed.

## Controls

Search the 64 definitions across eight domains. Compare good and vague metadata. The host simulator scores each query term with +3 for a name match, +2 for a hint match and +1 for a description match; it returns at most five definitions. **Try unauthorized refund** and **Run authorized fixture** pass a fixed `billing_refund_invoice` call for `INV-2042` to a host dispatcher.

## Evidence to inspect

`POST /plan` returns names, a rough initial token estimate and zero loaded definitions. `POST /search` returns scored definitions and a rough returned-context estimate; neither result registers a native tool. `POST /measure` compares good and vague metadata for the same query. The fixed dispatcher validates the selected tool's closed input schema and trusted host context. It records an authorized offline refund at most once for an owner and invoice/amount key. Unauthorized, wrong-tool and malformed input cause no refund effect. Catalog prose is untrusted data and cannot authorize a handler.

## Troubleshooting

If the desired tool is missing, narrow the query to its domain and action, such as `billing refund invoice`. A zero or low score describes this host scorer, not Claude's internal ranking. A refund denial comes from host context or schema validation, not from the tool description. `GET /facts` reports unsupported native ToolSearch and `searchHint`, `alwaysLoad`, `false`, `true` and `auto:N` settings because no exact Managed capability is configured here.

## Limitations

The catalog and scorer are authored fixtures. The token counts are JSON-length approximations, not actual model context or billing. Optional live measurement would have to count observed search and dispatch calls; this lesson does not infer Claude's internal ranking. Dynamic idle tool updates need a separate validated adapter if ever added.

## Challenge

Change the refund tool's description to claim that no approval is needed. Then run the unauthorized fixture and explain why the host still refuses the effect.

## Run locally

```powershell
node --import tsx --test tests/lab58-tool-search.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab58-browser-demonstration.mjs
```
