# Lab 69 checkpoint: desktop and IDE host integration

Lab 69 adds explicit document context, correlated review previews, closed final patch validation and host version/hash apply guards. The browser fixture supports normal review, cancellation, transport failure and changed-document conflict. Live mode reuses the existing Managed event/cleanup port only on explicit request; no live session was tested.

A runnable VS Code extension manifest, TypeScript host and nonce-protected webview are authored under `extensions/lab69`. The host resolves workspace trust and real allowed paths, keeps backend access and owner capability outside the webview, and applies reviewed editor-buffer edits only after identity/version/hash checks. Disposal aborts local polling and requests independent backend cleanup. The extension bundle excludes provider code and server configuration.

Focused tests cover actual file containment and conflict refusal, stale correlation, single-use patch application, disposal, backend owner isolation and correlation deduplication. A mocked VS Code API executes the bundled host through final review, apply conflict and disposal cleanup; this is distinct from interactive VS Code execution, which was not performed. Typecheck, extension build, guide checks, application build and browser demonstrations are run for this checkpoint.

On 17 October, actual provider testing validated the final JSON patch, preserved the document until host apply, and applied the patch once. Remote session IDs are now retained in backend snapshots for audit. All test sessions were confirmed archived. Interactive VS Code execution remains manual; see the course validation report.

A subsequent real editor run closed the manual gap: installed VS Code 1.142.0 opened the extension command/webview, applied a guided patch and rejected a concurrent-edit conflict. Playwright drove the actual editor with an isolated fixture profile and copied fictional document. No mock VS Code API or provider call was used. Screenshots and JSON evidence remain in ignored artifacts. Repeat with npm run test:editor:real.
