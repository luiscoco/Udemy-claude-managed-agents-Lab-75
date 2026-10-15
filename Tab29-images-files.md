# Lab 29 — Images, documents and mounted files

Three small fictional fixtures demonstrate inline Managed `user.message` content blocks and explicit Files API mount metadata. Inventory and source inspection never upload files.

## Prerequisites

Run `npm install` and `npm run dev`. Offline fixture comparisons need no API key. The authored PDF was rendered and inspected during development.

## Controls

Select a PNG, PDF or text fixture. Compare **Inline block**, **File upload and mount preview**, and **Downloaded output preview**. The latter two are authored previews of an explicit upload route, not actual cloud uploads. On the inline route, choose malformed base64 or oversized text to inspect rejection; file-resource routes accept only selected fixture bytes.

## Evidence to inspect

The fixed inventory exposes MIME, byte count and SHA-256. The inline block preview redacts its bytes but preserves type, source and media type. The file-resource preview shows a fixture file ID and `/mnt/session/uploads/lab29/...` path. Agent text and the authored downloaded output file are separate evidence. Usage stays unavailable in these offline scenarios.

## Troubleshooting

Unknown filenames and traversal paths are rejected. Malformed base64 is rejected before decoding, and decoded size and file signature are checked. The `/inline` route alone has a larger JSON limit. If the source preview is unavailable, start the backend and inspect the fixed fixture inventory.

## Limitations

No live Files API upload or billed Managed session is started by this lesson. The mounted path is a redacted fixture preview, not observed remote state. An actual upload requires an explicit selected authored file, a Files API response ID, a session resource mount, and separate cleanup. A local host path is not a remote sandbox path.

## Challenge

Send the same fixture through two supported routes and compare observed usage. In the offline path, explain why usage is unavailable instead of inventing a number.

```powershell
python scripts/generate-lab29-fixtures.py
node --import tsx --test tests/lab29-images-files.test.ts
node scripts/lab29-browser-demonstration.mjs
```

Routes: `GET /api/c29/files`, `GET /api/c29/file/:name`, `POST /api/c29/inline`, `POST /api/c29/upload`, `POST /api/c29/disk`, and `GET /api/c29/code`. See the [checkpoint](docs/lab29-checkpoint.md).
