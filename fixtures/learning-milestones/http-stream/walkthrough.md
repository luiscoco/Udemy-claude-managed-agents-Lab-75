# How the local SSE tutor works

1. Return a node:http server from createTutorServer. Tests bind it to a temporary port on 127.0.0.1 and close it afterward.
2. Validate /ask, POST and application/json before sending streaming headers. Invalid route, method and content type return 404, 405 and 415.
3. Read the request while retaining no more than 1024 bytes of body data. An oversized request returns 413. Parse JSON and reject anything except one prompt string of trimmed length 1 through 200 with 400.
4. Only valid input receives text/event-stream headers. Send started with accepted true, answer with the deterministic trimmed prompt, and done with completed.
5. Encode each data value with JSON.stringify and terminate each SSE frame with a blank line. End the response after done.

Run `node --test starter.test.mjs`. Expected: 3 passed, 0 failed. Do not manually launch another server for this command. A newline inside a prompt must be JSON-escaped so it cannot create an unintended SSE field.

Try a valid prompt with surrounding whitespace. The response should use its trimmed value. This exercise bounds retained input bytes but does not provide production request deadlines, authentication, durable jobs or a real agent.
