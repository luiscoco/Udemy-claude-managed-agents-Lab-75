# Event stream evidence viewer

Requires Node 24 or newer. No dependency installation, provider key or network connection is needed.

1. Extract this project into a separate study folder.
2. Read starter.test.mjs and implement reduceFrames in starter.ts.
3. Run `npm test` (or `node --test starter.test.mjs`).

The starter deliberately throws Not implemented, so its initial tests fail. Implement the function until all tests pass. The authored frames are a local teaching contract, not raw Managed API events. A text chunk alone cannot establish completion.

Return sessionId, answer text, outcome and the count of unique frames consumed up to the first outcome. Ignore repeated IDs. Reject unknown frame kinds or conflicting session identity. Ignore frames after the first terminal outcome. If the stream has no outcome frame, report incomplete.

After testing, explain how you separated response text from terminal evidence. Record your result in the lesson notebook; the platform does not execute or automatically grade your edited files.
