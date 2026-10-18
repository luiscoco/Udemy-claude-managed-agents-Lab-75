# How the event viewer works

1. Initialize a report with no session, empty text, incomplete outcome and zero consumed events. Incomplete is the honest default when a stream ends without terminal evidence.
2. Keep a Set of frame IDs. A repeated ID must not append text or increase the count twice.
3. For each unique frame, increment the count and branch on kind. A session frame sets identity, a text frame appends answer text, and an outcome frame accepts completed or error.
4. Reject an unexpected kind, invalid outcome or conflicting session identity. Do not turn an exception into a successful report.
5. Stop after the first terminal outcome. Frames arriving afterward cannot change an error into success or add misleading text.

Run `node --test starter.test.mjs`. Expected: 4 passed, 0 failed. A placeholder that always throws can pass a rejection test accidentally; inspect the full suite.

Try adding two distinct text frames and check that they join in order. Explain why answer text alone cannot establish turn completion. The count covers unique consumed frames up to the first outcome, not all remote provider activity.
