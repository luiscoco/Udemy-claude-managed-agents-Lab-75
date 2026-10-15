# Lab 21 checkpoint

The host command registry is fixed, typed and limited to two prompt templates plus local inspect/reset. Model commands use an owned, bounded retained session. Local actions do not call its provider port; they only read or clear a three-entry process-local history.

Verification on 2026-10-15: TypeScript typecheck and production build passed. The focused Lab 21 suite passed 3 tests; the cumulative offline suite passed 246 tests. Guide audit covered Labs 01–21 and all 4 guide tests passed. The Lab 21 browser checks passed 2 tests; the shell checks passed 8 tests. Phone and desktop offline screenshot demonstrations completed at 390px and 1440px without horizontal overflow. The distribution scan was also run before publication.

No paid provider call was made automatically. Offline responses are authored fixtures. Preparing a session is local and remote session creation is deferred to the first model command. A local abort alone does not attest remote termination; closing uses the retained-session cleanup path.
