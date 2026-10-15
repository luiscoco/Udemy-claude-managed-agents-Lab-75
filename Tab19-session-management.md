# Lab 19: Session inventory and explicit branches

Managed sessions can retain turns and expose metadata and event history. This lab separates a provider session from the host's bounded, owned conversation record. A derived conversation is a **new session** started with an explicit selected-history summary; it does not inherit hidden state, pending tool calls, or a cloned sandbox.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=19`. The offline fixture requires no credential or Anthropic call. Live requires an isolated server API key, a configured base agent and `MANAGED_LIVE_ENABLED=true`. Each live turn or derived session may incur charges. Loading the page and viewing the host inventory start no billed session. Provider retrieval is a separately selected read.

## Controls

1. Start an offline session with the Aurora Finch reminder. Note the local conversation ID and remote fixture session ID.
2. Change the prompt and send another turn. Confirm that the same session ID is retained, the turn count increments and host-captured events contain both user and agent messages.
3. Select a host event as the branch boundary, then derive a conversation. Compare the distinct IDs, parent and boundary fields, and the exact handoff summary. Inspect the original again to confirm its history remains intact.
4. Rename and tag an idle session. Archive it and inspect the retained host history. Start a separate offline session and select **Delete selected idle session** to remove that owned fixture. Delete requires the explicit selected action; archive is history-preserving.
5. Use a third turn to create more than one history page. Follow **Load next history page** and check the omission indicator. Try an unknown conversation ID or foreign owner in the API tests; neither can access or mutate it.

The exercise uses `POST /api/c19/turn`, `GET /sessions`, `GET /sessions/:id`, `POST /sessions/:id/rename`, `/tag`, `/branch`, `/archive`, `/delete`, and `POST /reset`. Turn and branch responses are SSE streams. A live provider `sessions.list`, `sessions.retrieve`, or paginated `sessions.events.list` occurs only after explicit inspection, after host ownership checks. Provider listing is a bounded page, so absence from that page is not proof that a host-owned session ceased to exist.

## Evidence to inspect

Compare the retained ID across two turns, then the distinct derived ID and recorded parent/boundary. Verify the original event list is unchanged. Read the summary handoff and both history pages. Archive keeps the host record and captured history; deletion removes the selected owned idle record.

## Troubleshooting

If live setup is unavailable, configure the isolated server credential, base agent and opt-in. If a turn is canceled, inspect the retained session's cleanup before retrying. If a branch boundary is unknown, select a host event from the currently owned conversation. If a history page is omitted, follow its next cursor.

## Limitations

Only confirmed-idle, owned active sessions can be continued, branched, renamed, tagged, archived or deleted. The host retains at most six records and three active records per owner. Prompt, event text, history page, cursor, title and tag lengths are bounded; request objects are closed. The offline reset affects only owned fixture records. Local cancellation does not establish a remote stop; inspect cleanup before retrying. Archive preserves session history, while deletion removes the selected idle remote session and cannot be undone.

The host handoff summarizes selected **observed** text. It can omit older details and loses unobserved context. A branch from a user-message boundary excludes the following agent reply. The provider event page is also limited and may omit more pages. Fixture agent replies are authored examples, not model recall evidence.

## Check the implementation

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab19-session-management.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab19-browser-demonstration.mjs
```

Inspect `shared/lab19-session-management.ts`, `server/lib/lab19-sessions.ts`, `server/concepts/19-session-management.ts` and the React exercise.

## Challenge

Explain why the derived conversation's new session ID and explicit summary are evidence of a host-created branch, rather than native `forkSession` or `resumeSessionAt` semantics.

Official reference: [Managed session operations](https://platform.claude.com/docs/en/managed-agents/session-operations), [Sessions API](https://platform.claude.com/docs/en/api/typescript/beta/sessions), [session event pagination](https://platform.claude.com/docs/en/api/typescript/beta/sessions/events/list) (checked 2026-10-15).
