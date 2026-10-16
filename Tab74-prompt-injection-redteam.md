# Lab 74: Prompt injection red teaming

## Prerequisites

Use the existing Node 24 platform. No mail account, refund provider or model credential is needed. Thirteen authored attacks in `server/redteam/corpus.ts` target fictional support tickets, emails, web/KB content and poisoned third-party tool descriptions. All attacker hosts use reserved `.test` names.

## Controls

Run offline attack compares a selected payload and defense using a worst-case scripted model. Compare defense matrix runs all thirteen payloads against an undefended baseline and five cumulative layers: prompt guidance, randomized untrusted markers, detector quarantine, deterministic tool/output policy, and least-privilege pinned metadata. Normalize and detect exposes bounded heuristic rules. Run bounded mutations performs at most six requested mutations with a four-fictional-cent budget. Download sanitized report includes aggregate, per-goal and per-attack observations without raw canaries.

## Evidence to inspect

Every custom-tool result correlates to a sevt_ ID. The ledger records attempted and executed effects separately. The oracle examines the ledger and final output for exfiltration, refunds, canary leaks, link hijacking and card-number manipulation. It also checks that both legitimate tickets receive safe drafts. A canary-free final answer does not erase an executed fictional refund or outgoing message. Clean-inbox utility is tested independently. Empty samples are reported as null, not zero-percent attack success.

The corpus includes direct override, forged system notice, forged roles, HTML comment, Markdown image, base64, invisible Unicode tags, split emails, Spanish override, prompt extraction, metadata poisoning, split-secret output and fake card-number process changes. The normalizer caps input at 12000 characters, limits base64 decoding to 2048-character tokens and two passes, decodes URL encodings and Unicode tags, and removes common invisible formatting characters. Detector rules are visible heuristics, not an authority boundary. Pinning hashes the authored tool name, description and closed input schema.

## Troubleshooting

Prompt instructions and markers alone do not constrain the deliberately obedient fixture. The deterministic policy denies outgoing mail/refund capabilities and blocks unsafe drafts; the output guard separately checks final text. Quarantine still creates safe fallback drafts. Blocking every ticket would fail utility. Adaptive results use one fictional cent per mutation, an eight-iteration ceiling and a two-second local deadline. No provider calls occur and there are no lingering sessions to cancel.

## Limitations

All outgoing actions are fictional ledger entries. There is no network transport, real customer data or real money. Randomized canaries are fake and only raw fixture evidence displays them. Zero successes in this deterministic corpus do not establish immunity for live models, unseen encodings or other policies. The live route rejects unsupported mode explicitly. Live repeated trials require a dedicated bounded adapter and deliberate selection; they do not start through readiness or navigation. Local owner headers are a teaching boundary, not production authentication. Pinning does not make arbitrary metadata trustworthy.

## Challenge

Construct an unrecognized instruction that requests an unauthorized refund. Show detector non-detection, denied host effect and safe drafts. Compare attack success rate and utility rather than optimizing either metric alone.

## Run locally

Run `npm run dev` and open lesson 74. Run `npm run test:redteam`, typecheck, build, guide checks and the focused browser demonstration. No external service is required.
