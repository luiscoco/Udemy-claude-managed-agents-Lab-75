# Lab 46 checkpoint

The exercise uses authored cache-usage readings to distinguish a stable prompt prefix from a dynamic suffix. It presents supported cache creation/read counters and signed differences only when readings share the same session and usage scope. Fresh sessions with changed model or tools, short inputs and absent usage are marked non-comparable. The host Managed HTTP tap does not reveal internal Messages API requests.

Verification: four focused tests and all 350 cumulative offline tests passed. Typecheck, production build, guide audit for Labs 1–46, four guide tests, nine browser tests, and the 390/1440-pixel demonstration passed. The distribution scan passed across 1,866 files. Screenshots are in ignored `artifacts/lab46/`.

Limitations: no billed provider request was run. Authored counters do not prove a cache hit, minimum cacheable size, TTL, price or cost savings. Messages `cache_control`, `SYSTEM_PROMPT_DYNAMIC_BOUNDARY`, TTL switches and `PreModelSwitch` veto are not exposed as Managed-session controls in this exercise.
