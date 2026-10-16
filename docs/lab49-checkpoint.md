# Lab 49 checkpoint

The headless fixture emits one JSON verdict with a CI exit code. The runner starts a bounded worker without a TTY; the worker can run offline without credentials. A SIGTERM-shaped host stop reaches the waiting fixture through process IPC on Windows, and the fixture reports cancellation separately from unconfirmed remote stop. The live worker is gated by two explicit environment opt-ins and uses the existing Managed port's budgeted session creation, text-only tool check, host deadline, closed report validation and cleanup path. The Dockerfile and GitHub workflow are authored samples only.

Verification: five focused tests and all 363 cumulative offline tests passed. Typecheck, production build, guide audit for Labs 1–49, four guide tests, nine browser tests, and the 390/1440-pixel demonstration passed. The distribution scan passed across 1,922 files. Screenshots are in ignored `artifacts/lab49/`.

Limitations: no live CI, provisioning, public hosting or billed provider request was run. Offline verdicts are authored. A local abort does not prove remote stop; a live CI pass requires a completed turn, one validated report and archived session. The sample workflow is outside `.github/workflows`, so it does not run automatically.
