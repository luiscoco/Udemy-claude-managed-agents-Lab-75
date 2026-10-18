# Local streaming tutor endpoint

Requires Node 24 or newer. No dependency installation or provider key is needed. Tests bind only to local loopback and use deterministic authored output.

Implement createTutorServer in starter.ts, then run `npm test`. The starter intentionally throws, so the initial tests fail.

Accept POST /ask with application/json and exactly one prompt string (trimmed length 1-200). Reject oversized bodies above 1024 bytes with 413, wrong content type with 415, malformed/extra fields with 400, GET /ask with 405 and other paths with 404. Validate before setting event-stream headers.

For valid input, emit three SSE frames: started with { accepted: true }, answer with { text: 'You asked: ' + trimmedPrompt }, then done with { outcome: 'completed' }. Each frame is event: NAME, data: JSON, then a blank line. End the response after done. Guard response writes if the client has disconnected.

These tests demonstrate a local teaching endpoint, not a production deployment or a model response. Record your test output and the validation boundary in your lesson notebook. The platform does not run your edited server.
