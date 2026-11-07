"""Editable Lab 07 teaching sequences verified against its host policy pipeline."""
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from pptx.enum.text import PP_ALIGN
from pptx.oxml.xmlchemy import OxmlElement


def build(slide, rect, flat, b):
    app_actors = [('User', 'Udemy exercise'), ('React UI', 'Concept07Hooks'),
                  ('Express + runner', '/api/c7 · runLab07'),
                  ('Live session port', 'Anthropic SDK'),
                  ('Managed Agents', 'Custom-tool session')]

    def sequence(title, subtitle, actors, messages, takeaway, explanations,
                 highlight=3, fragments=(), separators=()):
        assert len(messages) <= 14, 'Split dense diagrams instead of shrinking text.'
        assert len(explanations) == sum(a is not None for a, _, _, _ in messages)
        s = slide(title, subtitle)
        xs = [1.84, 4.25, 6.66, 9.07, 11.48]
        for i, (x, (name, detail)) in enumerate(zip(xs, actors)):
            rect(s, x-1.12, 1.48, 2.24, .59, 'BD542F' if i == highlight else '1D252B', None, True)
            for y, text, size in [(1.58, name, 12), (1.81, detail, 10.5)]:
                box = b.textbox(s, x-1.06, y, 2.12, .21, text, size, 'FFFFFF', True)
                box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
            line = flat(s.shapes.add_connector(1, Inches(x), Inches(2.07), Inches(x), Inches(6.43)))
            line.line.color.rgb = RGBColor.from_string('8F9DA8')
            line.line.width = Pt(.7)
            line.line.dash_style = MSO_LINE_DASH_STYLE.DASH

        def arrow(x1, y1, x2, y2, returned=False, head=True, orange=False):
            line = flat(s.shapes.add_connector(1, Inches(x1), Inches(y1), Inches(x2), Inches(y2)))
            line.line.color.rgb = RGBColor.from_string('C65330' if orange else '566574' if returned else '1D252B')
            line.line.width = Pt(1)
            if returned or orange:
                line.line.dash_style = MSO_LINE_DASH_STYLE.DASH
            if head:
                end = OxmlElement('a:tailEnd'); end.set('type', 'triangle')
                line._element.spPr.ln.append(end)

        start, step = 2.43, .30
        for first, last, label in fragments:
            # Self-call loops and their labels extend below the nominal row.
            a, z, _, _ = messages[last]
            padding = .16 if a is not None and a == z else .04
            top, bottom = start+first*step-.20, start+last*step+padding
            frame = rect(s, .71, top, 11.91, bottom-top, 'F5F4EF', 'C65330')
            frame.fill.background(); frame.line.width = Pt(1)
            frame.line.dash_style = MSO_LINE_DASH_STYLE.DASH
            b.textbox(s, .78, top+.035, 11.55, .20, label, 10.5, 'B94E30', True)
        for row, label in separators:
            y = start+row*step-.20
            arrow(.71, y, 12.62, y, head=False, orange=True)
            b.textbox(s, .78, y+.035, 11.55, .20, label, 10.5, 'B94E30', True)
        number = 0
        for i, (a, z, label, returned) in enumerate(messages):
            if a is None:
                continue
            number += 1; y = start+i*step; x1, x2 = xs[a], xs[z]
            if a == z:
                arrow(x1, y-.09, x1+.29, y-.09, head=False)
                arrow(x1+.29, y-.09, x1+.29, y+.065, head=False)
                arrow(x1+.29, y+.065, x1, y+.065)
                tx, tw, ty = x1+.37, 2.01, y-.115
            else:
                arrow(x1, y, x2, y, returned)
                tx, tw, ty = min(x1, x2)+.075, abs(x2-x1)-.15, y-.22
            b.textbox(s, tx, ty, tw, .23, f'{number}. {label}', 11.5,
                      '566574' if returned else '1D252B')
        rect(s, .72, 6.57, 11.90, .39, 'E4EEE7', None, True)
        b.textbox(s, .9, 6.665, 11.55, .21, takeaway, 11.5, '28594A', True)
        s.notes_slide.notes_text_frame.text = (
            title+'\n\n'+ '\n'.join(f'{i+1}. {text}' for i, text in enumerate(explanations))+
            '\n\nSources: src/concepts/Concept07Hooks.tsx; server/concepts/07-hooks.ts; '
            'server/lib/lab07-run.ts; server/lib/lab07-policy.ts; server/lib/lab07-port.ts; '
            'server/lib/tool-session-run.ts; server/lib/tool-session-port.ts; shared/lab07-hooks.ts; '
            'tests/lab07-hooks.test.ts.\n'
            'Solid arrows are calls; dashed arrows are returns/events. Self calls denote local host work. '
            'Long arrows can abbreviate the port relay. Streaming progress occurs throughout the run, '
            'rather than being buffered until the final result. Offline mode uses an authored fixture '
            'port, makes no API calls and cannot prove Claude chose a particular tool.')

    sequence('One policy experiment, from UI to result',
             'UML 01 / 04 · live path shown; offline substitutes the authored fixture port', app_actors, [
        (0, 1, 'Choose policy; run', False),
        (1, 2, 'POST /query {policy, ...}', False),
        (2, 2, 'Validate; seed sandbox', False),
        (2, 3, 'runLab07 → port.create', False),
        (3, 4, 'Check agent; create', False),
        (4, 2, 'Session ID via port', True),
        (2, 3, 'port.open(id)', False),
        (3, 4, 'events.stream(id)', False),
        (2, 4, 'port.send → user.message', False),
        (4, 2, 'custom_tool_use + requires_action', True),
        (2, 3, 'Policy → port.respond', False),
        (3, 4, 'custom_tool_result', False),
        (4, 2, 'Agent events → end_turn', True),
        (2, 1, 'SSE audit + final result', True)],
        'HOST POLICY: validate → decide → execute → audit → reply. These phases are not Agent SDK hook events.', [
        'Choose Audit only, Deny write or Rewrite input. The GUI also selects an offline scenario and a prompt.',
        'streamPost sends mode, policy, scenario, prompt, deadlineSeconds and handlerTimeoutMs to /api/c7/query; live requests include a budget.',
        'The route rejects invalid requests, including hooks/PreToolUse/PostToolUse/updatedInput fields. It checks capacity and deadline policy, selects a port, creates a runId and seeds draft.md and protected.md in a host sandbox. Then openSse starts browser progress.',
        'runLab07 delegates to runToolSession, supplying the answer callback that invokes executePolicy. The shared loop calls port.create.',
        'In live mode the port retrieves the dedicated Lab 07 agent, rejects archived agents or unsupported extensions/tool schemas, then calls sessions.create with that exact agent version, environment and budget.',
        'The created session ID and effective tool metadata return through the port. A session frame reports the live or authored-fixture source.',
        'The runner calls port.open before sending the user prompt, preventing the initial events from being missed.',
        'The live adapter opens sessions.events.stream. Offline uses the authored event generator instead.',
        'port.send calls sessions.events.send with user.message. The long arrow abbreviates forwarding through the SDK port.',
        'The loop records agent.custom_tool_use by its sevt_ ID. session.status_idle with requires_action lists the IDs awaiting host answers. This is not end_turn.',
        'The host filters already-answered IDs, calls the Lab 07 answer callback, validates/decides/executes/audits locally, then calls port.respond with correlated custom results. The next slides expand this pipeline.',
        'The SDK sends user.custom_tool_result with custom_tool_use_id, text content and is_error. Denial or handler failure is an error result, not a built-in tool confirmation.',
        'The session resumes and emits agent/lifecycle events. The shared consumer recognizes end_turn as completion; EOF alone is incomplete. Repeated tool calls may create more pauses.',
        'Progress and audits stream as they happen. Before the final result, cleanup checks status and archives only confirmed-idle sessions. The result contains audits, actual host files, resultsSent, outcome, interruption and cleanup; the UI parses it and renders evidence.'])

    sequence('Inside the host: deny, rewrite or execute',
             'UML 02 / 04 · zoom into the answer callback; file effects happen in the host sandbox', [
        ('Session loop', 'runToolSession'), ('Lab 07 answer', 'runLab07 callback'),
        ('Host policy', 'executePolicy'), ('Host sandbox', '/workspace fixtures'),
        ('Session port', 'respond(custom results)')], [
        (0, 1, 'answer(pending)', False),
        (1, 2, 'executePolicy(call)', False),
        (2, 2, 'Tool + input + path', False),
        (None, None, '', False),
        (2, 3, 'Read protected.md twice', False),
        (2, 1, 'deny; handlerRan=false', True),
        (None, None, '', False),
        (2, 2, 'Rewrite? revalidate', False),
        (2, 3, 'Read before → work()', False),
        (3, 2, 'Result + after state', True),
        (2, 1, 'Execution audit', True),
        (1, 0, 'Emit audit; return answers', True),
        (0, 4, 'port.respond: original custom-tool event ID + result', False),
        (4, 0, 'Result accepted; continue consuming session events', True)],
        'DENIED: handler never ran. FAILED: handler ran and errored. A timeout or audit does not roll back file effects.', [
        'After a requires_action pause, the loop offers each still-unanswered call to the Lab 07 answer callback.',
        'For an observed custom-tool event, the callback invokes executePolicy with the tool name, raw input, selected policy, host sandbox and handler timeout. Missing custom events are denied.',
        'Check the tool name, validate the original strict Zod input, normalize and guard the path. Unknown tools, invalid input and rejected paths return denied audits before either illustrated branch runs.',
        'Protected denial applies only to deny-write plus a non-read_file call targeting /workspace/protected.md. Read before and after evidence directly without executing a handler.',
        'Return decision=deny, outcome=denied, handlerRan=false and isError=true. Validation may be passed: a valid call can still be forbidden by policy.',
        'For a permitted call, rewrite-input changes only write/edit requests for /workspace/proposed.md to /workspace/draft.md. Revalidate the entire effective input and guard the final path again. Other valid calls keep their original input.',
        'Read the previous file state and execute read_file, write_file or edit_file. edit_file replaces one exact occurrence and fails if oldText is absent. Handler work is raced against its timeout.',
        'Read the actual state after execution or failure. Promise.race does not cancel the underlying file operation or undo a completed effect.',
        'Return an audit with original/effective input, decision, validation, handlerRan, outcome, before/after and result. Successful work is executed; a thrown error or deadline is failed with isError=true.',
        'The callback appends and emits the audit, then returns a HostAnswer keyed by the original call ID. The two alt branches rejoin here.',
        'The loop validates answer IDs, marks them answered and calls port.respond. The live port maps each answer to user.custom_tool_result.custom_tool_use_id.',
        'After the response resolves, the counted wrapper increments resultsSent. The loop resumes reading session events. This is an at-most-once result attempt per ID within this run.'],
        highlight=2,
        fragments=[(3, 10, 'alt  [deny-write AND write/edit targets /workspace/protected.md]')],
        separators=[(6, 'else  [valid permitted call; rewrite proposed.md → draft.md when the rewrite policy applies]')])

    sequence('One call ID gets at most one host answer',
             'UML 03 / 04 · duplicate protection within one run; sevt_ ID is the correlation key', [
        ('Managed Agents', 'Tool events + pauses'), ('Session loop', 'seen / answered sets'),
        ('Lab 07 answer', 'runLab07 callback'), ('Host policy', 'executePolicy'),
        ('Live session port', 'Anthropic SDK')], [
        (0, 1, 'custom_tool_use(id)', True),
        (0, 1, 'requires_action [id]', True),
        (1, 1, 'Filter answered IDs', False),
        (1, 2, 'answer(pending)', False),
        (2, 3, 'executePolicy(call)', False),
        (3, 2, 'Audit + tool outcome', True),
        (2, 1, 'Audit + correlated answer', True),
        (1, 1, 'answered.add(id)', False),
        (1, 4, 'port.respond(id, custom results)', False),
        (4, 0, 'user.custom_tool_result {custom_tool_use_id: id, content, is_error}', False),
        (None, None, '', False),
        (0, 1, 'Replay requires_action', True),
        (1, 1, 'Already answered: skip', False),
        (1, 1, 'No second execution', False)],
        'CORRELATION: use the custom-tool sevt_ ID. Duplicate pauses trigger no second handler or result in that run.', [
        'The session emits agent.custom_tool_use with a persisted event ID. customUses remembers the first event for that ID.',
        'A requires_action status lists event_ids that need host results. The loop deduplicates IDs inside this list.',
        'Remove IDs already in answered. Duplicate lifecycle event IDs are also filtered with seen; a new pause ID cannot bypass answered.',
        'Offer only still-unanswered calls to the Lab 07 callback. It is not called again for an answered sevt_ ID.',
        'The callback executes the host validation and policy pipeline for the pending custom call.',
        'executePolicy returns the real tool outcome plus file evidence. It does not invent a successful effect for a denied or failed call.',
        'The callback emits the audit and returns customToolUseId=call.id, tool, isError and text.',
        'Before sending, the loop accepts only answers whose ID belongs to this pause and is not already answered, then marks the ID. An extra answer for the same ID is dropped.',
        'The loop sends custom results once through port.respond. A failed provider response does not trigger an automatic retry or a second handler invocation.',
        'The live port creates user.custom_tool_result with custom_tool_use_id equal to the original custom-use ID, plus text content and is_error. This diagram abbreviates the port-to-provider return route across the host lanes.',
        'The provider may repeat the custom event or requires_action pause. The offline repeated-call scenario deliberately exercises this case.',
        'An identical pause ID is skipped by seen; a distinct pause referencing the answered call is filtered by answered. No second callback or result is sent.',
        'No second handler runs for this ID during this run. This in-memory guarantee is not a persistent cross-run exactly-once guarantee. The focused test verifies one audit and one resultsSent.'],
        highlight=4, fragments=[(10, 13, 'opt  [the same custom-tool ID appears again, even in a later requires_action event]')])

    sequence('Cleanup and file evidence, step by step',
             'UML 04 / 04 · bounded interruption + status checks; archive confirmed-idle sessions', app_actors, [
        (None, None, '', False),
        (0, 1, 'Click Cancel query', False),
        (1, 2, 'Abort POST; disconnect', False),
        (2, 3, 'port.interrupt(id)', False),
        (3, 4, 'Send user.interrupt', False),
        (2, 3, 'Close upstream stream', False),
        (None, None, '', False),
        (2, 3, 'port.status(id)', False),
        (3, 4, 'sessions.retrieve(id)', False),
        (4, 2, 'Status via port', True),
        (2, 4, 'If idle: port → sessions.archive(id)', False),
        (2, 1, 'Result if still connected', True),
        (1, 2, 'GET /file?runId&name', False),
        (2, 1, 'Actual host file content', True)],
        'ARCHIVE: confirmed idle only; otherwise cleanup stays pending. File loading requires a returned runId.', [
        'Optional cancellation: the user aborts a pending query. The runner deadline can also stop local waiting. This branch is skipped for a normal completed turn.',
        'The browser abort disconnects POST/SSE; the host signal cancels the local runner. Local cancellation alone does not prove remote work stopped.',
        'If a prompt was sent and the outcome is neither completed nor paused, the shared runner attempts port.interrupt using a fresh bounded request independent of the aborted run signal.',
        'The live adapter sends user.interrupt with a 3-second timeout. Acceptance alone is not sufficient for confirmed interruption.',
        'For normal and cancelled runs, abort the separate upstream controller to close the event stream before polling provider status.',
        'port.status polls within the cleanup window. Each live request has its own 3-second timeout; no aborted request signal is reused.',
        'The live adapter calls sessions.retrieve. Poll until idle or terminated, the cleanup window expires, or status retrieval fails.',
        'Idle confirms that archiving is permitted. Terminated counts as stopped for interruption confirmation but is not the idle state required for archiving. Unknown or unsettled status leaves cleanup pending.',
        'If idle, collectOutputs is called (Lab 07 reports none because all custom-tool file work was on the host), then archive through the port. Archive errors leave cleanup pending. Unlike retained Lab 06 sessions, this lab normally archives after a turn.',
        'After cleanup, the runner snapshots actual host files. If the browser remains connected, the route emits the final result with audits, runId, outcome, resultsSent, interruption and cleanup. Offline interruption/archive are labelled simulated.',
        'On the completed-run UI path, Load draft.md/protected.md/proposed.md requests /api/c7/file with the returned runId and name. A disconnected cancelled browser may have received no result and cannot use these buttons for that run.',
        'The route reads the retained host sandbox, not the remote Managed sandbox. An unchanged protected file corroborates denial; a rewrite changes draft.md while proposed.md remains absent (404). Host evidence remains until eviction or server shutdown.'],
        fragments=[(0, 4, 'opt  [prompt sent AND outcome is neither completed nor paused: cancellation, deadline or failure]'),
                   (6, 9, 'loop  [bounded status polling until idle / terminated, timeout or status error]')])
