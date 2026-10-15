# Lab 42: Bounded web research and citations

## Prerequisites

Run the local development server. The offline pages are authored fixtures and need no Anthropic key or internet access.

## Controls

Choose basics, fetch, injection, redirect, blocked host or research, then run the fixture. Compare inspected source IDs, snippet/page kind, redirect decisions and citation verification.

## Exercise

The installed Managed SDK exposes `web_search` and `web_fetch` configs with `allowed_domains`, `max_content_tokens` and `url_sources`. The teaching adapter shows those exact fields. For deterministic host policy, its offline custom fetch transport disables built-in unrestricted `web_fetch` and bash. Each URL and redirect is checked against the HTTPS host rule before another fixture request. The host also checks a resolved-address set; the offline mapping is authored. Search snippets remain marked snippets. Returned page text is data, so a hostile instruction cannot change host policy. Final citations must name inspected evidence IDs.

## Evidence to inspect

Compare request count, redirect targets, host refusal, source kind, hostile-text classification and citation IDs. Inspect `server/lib/lab42-research.ts` for the URL/address guards and citation check. A refused redirect target is not fetched.

## Troubleshooting

The redirect and blocked-host scenarios intentionally return no source. In basics, the source is only a search snippet; use fetch or research for a complete authored page. A hostile page remains visible as escaped text.

## Limitations

This offline fixture performs zero network and provider calls. It does not claim production SSRF safety or DNS pinning; a live custom fetch implementation must bind the checked address to the actual connection and enforce every redirect. Built-in Managed domain restrictions alone do not prove redirect safety. Optional live research is unavailable until a reviewed public-documentation policy and spend limit are configured.

## Challenge

Test a hostile page and inspect the enforcing host decision.

## Run locally

```powershell
node --import tsx --test tests/lab42-web-tools.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab42-browser-demonstration.mjs
```
