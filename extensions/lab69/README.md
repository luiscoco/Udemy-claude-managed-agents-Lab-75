# Lab 69 VS Code host

From the platform root, install dependencies and run:

```powershell
npm run lab69:extension:build
npm run dev:server
```

In another terminal, launch an Extension Development Host with a saved fictional fixture:

```powershell
code --extensionDevelopmentPath="C:\claude-managed-agents\extensions\lab69" "C:\claude-managed-agents\extensions\lab69\fixture"
```

Trust that fixture workspace, open `observation.md`, and run **Managed Labs 69: Review Active Document** from the Command Palette. Start guided mode, review the proposed text, and choose **Apply reviewed patch**. To test a conflict, change the original editor buffer after the proposal and before applying. To test transport failure, stop the backend while a request is active; remote cleanup must be reported unconfirmed if it cannot be checked.

The host captures only the selected saved `.md`, `.txt` or `.ts` document inside its trusted workspace folder, excludes hidden/private folders, checks real paths, and sends explicit text/version/hash context. The webview cannot choose a path, workspace trust, backend URL or owner capability. The backend origin is read from User settings only and is restricted to loopback. Provider keys remain in the backend's server configuration and are not bundled into this extension.

The package compiles and its bundled host is exercised with a mocked VS Code API in the focused tests. An interactive VS Code launch is a separate manual check. Browser simulation does not prove extension execution. Live mode requires explicit selection, configured Managed resources and billing opt-in; no live test is part of the default workflow.
