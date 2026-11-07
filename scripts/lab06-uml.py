"""Lab 06 teaching diagrams, traced to the route, UI, store and port implementation."""
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from pptx.enum.text import PP_ALIGN
from pptx.oxml.xmlchemy import OxmlElement


def build(slide, rect, flat, b):
    def sequence(title, subtitle, messages, takeaway, explanations, fragments=()):
        s = slide(title, subtitle)
        positions = [1.84, 4.25, 6.66, 9.07, 11.48]
        names = [('User', 'Udemy exercise'), ('React UI', 'Concept06Sessions'),
                 ('Express + host store', '/api/c6 · owned index'),
                 ('Live session port', 'Anthropic SDK'),
                 ('Managed Agents', 'Retained remote session')]
        for i, (x, (name, detail)) in enumerate(zip(positions, names)):
            rect(s, x-1.12, 1.48, 2.24, .59, 'BD542F' if i == 3 else '1D252B', None, True)
            for y, text, size in [(1.58, name, 12), (1.81, detail, 10.5)]:
                box = b.textbox(s, x-1.06, y, 2.12, .21, text, size, 'FFFFFF', True)
                box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
            line = flat(s.shapes.add_connector(1, Inches(x), Inches(2.07), Inches(x), Inches(6.43)))
            line.line.color.rgb = RGBColor.from_string('8F9DA8')
            line.line.width = Pt(.7)
            line.line.dash_style = MSO_LINE_DASH_STYLE.DASH

        def arrow(x1, y1, x2, y2, returned=False, head=True):
            line = flat(s.shapes.add_connector(1, Inches(x1), Inches(y1), Inches(x2), Inches(y2)))
            line.line.color.rgb = RGBColor.from_string('566574' if returned else '1D252B')
            line.line.width = Pt(1)
            if returned:
                line.line.dash_style = MSO_LINE_DASH_STYLE.DASH
            if head:
                end = OxmlElement('a:tailEnd')
                end.set('type', 'triangle')
                line._element.spPr.ln.append(end)

        start, step = 2.43, .30
        # Empty rows reserve space for UML guard labels, away from message text.
        for first, last, label in fragments:
            top, bottom = start+first*step-.20, start+last*step+.04
            frame = rect(s, .71, top, 11.91, bottom-top, 'F5F3EF', 'C65330')
            frame.fill.background()
            frame.line.dash_style = MSO_LINE_DASH_STYLE.DASH
            frame.line.width = Pt(1)
            box = b.textbox(s, .78, top+.035, 11.55, .20, label, 10.5, 'B94E30', True)
            box.fill.solid()
            box.fill.fore_color.rgb = RGBColor.from_string('F5F3EF')
        number = 0
        for i, (src, dst, label, returned) in enumerate(messages):
            if src is None:
                continue
            number += 1
            y = start+i*step
            x1, x2 = positions[src], positions[dst]
            if src == dst:
                arrow(x1, y-.09, x1+.29, y-.09, head=False)
                arrow(x1+.29, y-.09, x1+.29, y+.065, head=False)
                arrow(x1+.29, y+.065, x1, y+.065)
                tx, tw, ty = x1+.37, 2.01, y-.115
            else:
                arrow(x1, y, x2, y, returned)
                tx, tw, ty = min(x1, x2)+.075, abs(x2-x1)-.15, y-.22
            b.textbox(s, tx, ty, tw, .23, f'{number}. {label}', 11.5,
                      '566574' if returned else '1D252B')
        rect(s, .72, 6.57, 11.90, .39, 'F0E6DC', None, True)
        b.textbox(s, .9, 6.665, 11.55, .21, takeaway, 11.5, '8B452C', True)
        s.notes_slide.notes_text_frame.text = (
            title+'\nLive path shown. Offline mode substitutes FixtureLab06Port and makes no API calls.\n\n'+
            '\n'.join(f'{i+1}. {text}' for i, text in enumerate(explanations))+
            '\n\nSources: src/concepts/Concept06Sessions.tsx; server/concepts/06-sessions.ts; '
            'server/lib/lab06-port.ts; server/lib/lab06-store.ts; server/sse.ts.\n'
            'Solid arrows are requests; dashed arrows are responses or event streams. '
            'SSE progress is emitted as events arrive; the diagram summarizes repeated frames. '
            'An arrow spanning the live port abbreviates its forwarding of the call or response.')

    sequence('Create a session and retain its context',
             'UML 01 / 04 · new session · live path; offline uses the fixture port', [
        (0, 1, 'Prompt → New live', False),
        (1, 2, 'POST /query {new, prompt}', False),
        (2, 2, 'Validate; openSse()', False),
        (2, 3, 'port.create(input)', False),
        (3, 4, 'sessions.create(...)', False),
        (4, 2, 'Session ID via port', True),
        (2, 2, 'store.create(owner, id)', False),
        (2, 3, 'port.open(sessionId)', False),
        (3, 4, 'events.stream(id)', False),
        (2, 3, 'port.send(id, prompt)', False),
        (3, 4, 'Send user.message', False),
        (4, 2, 'Events via port → end_turn', True),
        (2, 1, 'SSE progress + result', True),
        (1, 0, 'Show IDs + history', True)],
        'NEW: create once → open before send → retain the session after the turn; no automatic archive.', [
        'Enter the introduction prompt and choose New live. New offline runs the authored fixture instead.',
        'streamPost sends mode, action=new, prompt, scenario, deadline and the live budget to /api/c6/query.',
        'The route checks the strict schema, owner, capacity and deadline policy, selects a port and opens browser SSE.',
        'The route calls port.create because a new conversation has no stored session.',
        'The live port calls client.beta.sessions.create with the configured agent, environment and budget.',
        'The API returns the sesn_ session ID through the live port. This differs from the local conversation UUID.',
        'store.create binds the session to an owner and generates a conversation UUID; the route generates a local turn UUID.',
        'The route opens the upstream stream before sending the prompt. A session progress frame exposes the identifiers.',
        'The live port opens sessions.events.stream with agent.message deltas and the request AbortSignal.',
        'The host calls port.send on the same session ID and increments turnCount.',
        'The live port calls sessions.events.send with a user.message; its returned event ID becomes sentEventId.',
        'The route consumes events and emits progress. Only session.status_idle with stop_reason=end_turn completes the turn. It then fetches persisted history and merges event IDs; the next diagram expands these calls.',
        'The result includes identifiers, retained history, duplicatesIgnored, archived=false and completed/incomplete. EOF before end_turn is incomplete.',
        'The UI parses frames, stores the conversation UUID and renders history. The session stays available for Continue or Reconnect.'])

    sequence('Continue the same session, step by step',
             'UML 02 / 04 · continued turn · same session ID, new local turn ID', [
        (0, 1, 'Follow-up → Continue', False),
        (1, 2, 'POST /query {continue, ID}', False),
        (2, 2, 'lookup(ID, owner)', False),
        (2, 3, 'port.open(sessionId)', False),
        (3, 4, 'events.stream(id)', False),
        (2, 3, 'port.send(id, prompt)', False),
        (3, 4, 'Send user.message', False),
        (4, 3, 'Events → end_turn', True),
        (3, 2, 'Consume typed events', True),
        (2, 3, 'port.history(id)', False),
        (3, 4, 'events.list: pages', False),
        (4, 2, 'History via port; merge IDs', True),
        (2, 1, 'SSE progress + result', True),
        (1, 0, 'Render retained context', True)],
        'CONTINUE: reuse the owned session; history is deduplicated by event ID, not by message text.', [
        'Select the follow-up prompt and Continue. The UI requires a conversation UUID before starting.',
        'POST /api/c6/query carries action=continue, conversationId and the new prompt; ID means the local conversation UUID.',
        'After validation, lookup uses store.read(ID, owner). Missing, foreign, archived or expired entries are rejected. Reuse the stored session ID: no sessions.create call. Each request gets a fresh localTurnId.',
        'The route opens the retained session stream with port.open and the request AbortSignal.',
        'The live port calls sessions.events.stream on that same session ID before sending the follow-up.',
        'port.send sends the follow-up using the same session ID; turnCount increases.',
        'sessions.events.send creates a user.message and returns its sent event ID.',
        'Agent and lifecycle events arrive. An agent.message alone is not completion; session.status_idle must have stop_reason.type=end_turn.',
        'The route consumes typed events and emits progress immediately. EOF without completion yields outcome=incomplete.',
        'After event consumption, the route requests persisted user and agent messages with port.history.',
        'The live port iterates sessions.events.list(order=asc, limit=100), collecting at most 200 message records.',
        'History returns through the port. store.merge checks event IDs against entry.seen, appends unseen records and counts duplicates. It does not deduplicate by text.',
        'The result carries the same session ID, a new local turn UUID, the new sentEventId and merged history. archived stays false.',
        'The UI parses progress and result frames and renders both turns. Compare the session ID with the first request to prove reuse.'])

    sequence('Reconnect without sending a new message',
             'UML 03 / 04 · reopen stream → hydrate history → deduplicate', [
        (0, 1, 'Choose Reconnect', False),
        (1, 2, 'POST /query {reconnect, ID}', False),
        (2, 2, 'Validate; owned lookup', False),
        (2, 3, 'port.open(sessionId)', False),
        (3, 4, 'events.stream(id)', False),
        (2, 3, 'port.history(id)', False),
        (3, 4, 'events.list: pages', False),
        (4, 3, 'Persisted messages', True),
        (3, 2, 'History records', True),
        (2, 2, 'store.merge(...)', False),
        (2, 1, 'Duplicate frames + result', True),
        (1, 1, 'Parse; update state', False),
        (1, 0, 'Show history + evidence', True),
        (2, 3, 'finally: stream.close()', False)],
        'RECONNECT: no port.send; sentEventId is null. The stream closes; the retained session stays open.', [
        'Choose Reconnect for a conversation already created.',
        'The UI sends action=reconnect and conversationId to /api/c6/query. Its prompt is empty.',
        'The route checks ownership, expiry and archive state, opens browser SSE and issues a fresh local turn UUID.',
        'The route calls port.open before fetching history. This ordering is explicit in the implementation.',
        'The live adapter opens sessions.events.stream on the retained session.',
        'The reconnect branch immediately requests port.history. It does not call port.send or increment turnCount.',
        'The live port iterates paginated sessions.events.list in ascending order, retaining at most 200 user/agent message records.',
        'The API returns persisted messages. This branch hydrates history; it does not run the normal upstream event-consumption loop.',
        'The live port returns message records containing persisted event IDs and text.',
        'store.merge appends only unseen IDs. Repeated persisted IDs increase duplicatesIgnored.',
        'The host sends one duplicate progress frame per duplicate and a result: outcome=reconnected, sentEventId=null, archived=false.',
        'The browser parses progress frames, sets the result and retains the conversation UUID.',
        'The user sees retained history and duplicate evidence. Reconnect adds no prompt or assistant turn.',
        'The route finally closes the upstream stream and ends SSE. Stream closure does not archive the session.'])

    sequence('Cancel a turn; archive only when idle',
             'UML 04 / 04 · separate controls: cancel running work, or close a retained session', [
        (None, None, '', False),
        (0, 1, 'Click Cancel query', False),
        (1, 2, 'Abort POST; disconnect', False),
        (2, 3, 'On abort: interrupt(id)', False),
        (3, 4, 'Send user.interrupt', False),
        (2, 3, 'finally: stream.close()', False),
        (None, None, '', False),
        (0, 1, 'Close and archive', False),
        (1, 2, 'POST /close {ID, mode}', False),
        (2, 3, 'Owned lookup; status(id)', False),
        (3, 4, 'sessions.retrieve(id)', False),
        (4, 2, 'Status via port', True),
        (2, 4, 'If idle: port → sessions.archive(id)', False),
        (2, 1, 'Mark archived; closed=true', True)],
        'CANCEL ≠ ARCHIVE: interruption is not proof of stopping. Close rejects non-idle or unknown status (409).', [
        'While a request is pending, Cancel query aborts the UI AbortController. A configured deadline can also abort the host request.',
        'The browser disconnect closes POST/SSE. openSse aborts the host controller.',
        'If aborted work throws and a conversation entry exists, the route catch block attempts port.interrupt. It swallows errors: the UI cannot claim remote work definitely stopped.',
        'The live port sends user.interrupt with a 3-second timeout, without the already-aborted request signal. Unlike the reference Lab 01 example, this Lab 06 cancellation path does not retrieve status.',
        'The finally block closes the upstream stream and ends SSE. Cancellation does not archive the retained session.',
        'Close and archive is a separate action, enabled when no UI request is pending and a conversation UUID exists.',
        'POST /api/c6/close sends conversationId and mode as JSON, rather than opening query SSE.',
        'The close route validates and looks up the owned conversation, selects the matching port and calls port.status.',
        'The live adapter calls sessions.retrieve with a 3-second timeout. Retrieval failure becomes status=unknown.',
        'The status returns through the port. Only confirmed idle allows archiving; any other or unknown status returns HTTP 409.',
        'For idle only, port.archive calls sessions.archive with a 3-second timeout. The arrow abbreviates the port relay.',
        'After successful archiving, the route marks entry.archived=true and returns closed=true. Continue and Reconnect now reject the archived entry.'], [
        (0, 5, 'opt  [running request cancelled or timed out; interrupted in the aborted-error path]'),
        (6, 13, 'opt  [user later chooses Close and archive; archive path requires confirmed idle]')])
