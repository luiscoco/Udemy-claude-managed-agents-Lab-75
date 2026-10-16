# Lab 68 checkpoint: scheduled and event-driven jobs

Lab 68 adds an owner-scoped bounded queue fed by explicit interval ticks and raw HMAC-SHA256 incident webhooks. Signature verification covers Unix timestamp plus exact body bytes, uses constant-time comparison, and checks real host time independently of the scheduling clock. Both fresh admission and known duplicates return HTTP 202; neither starts a worker.

One explicit worker click synchronously claims one due job. Failures retry after one and two seconds and dead-letter on the third attempt. Cancellation, a worker deadline, two-worker global capacity, one active claim per owner and 100-job capacity bound the fixture. Successful triage uses a closed custom tool and correlated `sevt_` result; SQLite stores its distinct stable business key.

Focused tests cover raw-byte integrity, freshness independence, coalesced ticks, owner scope, synchronous claim, retries, dead letter, cancellation, capacity and real HTTP duplicate admission. Typecheck, guide checks, build and browser demonstrations are run for this checkpoint. Queue/schedule state is process-local; no background scheduler, cloud session or billed run starts.
