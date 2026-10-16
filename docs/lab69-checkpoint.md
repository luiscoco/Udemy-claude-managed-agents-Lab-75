# Lab 69 checkpoint: desktop and IDE host integration

Lab 69 adds explicit document context, correlated review previews, closed final patch validation and host version/hash apply guards. The browser fixture supports normal review, cancellation, transport failure and changed-document conflict. Live mode reuses the existing Managed event/cleanup port only on explicit request; no live session was tested.

A runnable VS Code extension manifest, TypeScript host and nonce-protected webview are authored under `extensions/lab69`. The host resolves workspace trust and real allowed paths, keeps backend access and owner capability outside the webview, and applies reviewed editor-buffer edits only after identity/version/hash checks. Disposal aborts local polling and requests independent backend cleanup. The extension bundle excludes provider code and server configuration.

Focused tests cover actual file containment and conflict refusal, stale correlation, single-use patch application, disposal, backend owner isolation and correlation deduplication. A mocked VS Code API executes the bundled host through final review, apply conflict and disposal cleanup; this is distinct from interactive VS Code execution, which was not performed. Typecheck, extension build, guide checks, application build and browser demonstrations are run for this checkpoint.
