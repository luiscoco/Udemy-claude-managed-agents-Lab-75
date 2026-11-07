"""Lab 33 step-by-step walkthrough authored from real captures of the running platform (offline: a local MCP stdio elicitation fixture; live: a small script where a real Managed agent asks for human input through a custom tool)."""
from lab_video_common import Deck
d=Deck(33,'Lab 33 Step by Step: Human Forms During Tool Work, Offline and Live','MCP elicitation');e=d.e
assert e['accepted_status']=='accepted; MCP calls 1; answers 1.' and 'Host validated accept and replied to MCP request 33.' in e['evidence_list']
assert e['invalid']=='Invalid closed form response.' and e['invalid_inspect']=='pending; MCP calls 1; answers 0.'
assert e['decline_status']=='declined; MCP calls 1; answers 1.' and 'Human declined the form.' in e['decline'] and '"is_error": true' in e['decline']
assert e['timeout']=='timed-out; MCP calls 1; answers 0.' and e['abort']=='aborted; MCP calls 1; answers 0.'
assert 'This is a demonstration, not OAuth.' in e['consent'] and e['nolive'].startswith('Direct cloud MCP elicitation callback support is not assumed.')
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'MCP servers: none' in live[1] and 'session MCP servers: 0' in live[2]
assert 'elicitation/create 33: Choose a fictional observation date and quantity' in L and 'host schema: 400 Invalid date or quantity. (no MCP reply)' in L
assert 'human submits 2026-10-15, quantity 3 → accepted' in L and 'user.custom_tool_result sent · is_error false' in L and 'user.custom_tool_result sent · is_error true' in L
assert 'human declines → declined · MCP result: Human declined the form. · isError true' in L and 'Session archived: yes' in L and len(live)==19
d.cover('CLAUDE MANAGED AGENTS · LAB 33 · HUMAN FORMS DURING TOOL WORK','<h2>In this lab</h2><p>Start a local MCP form.<br>Validate the human reply.<br>Decline, time out, abort.<br>Bridge to a custom tool result.</p>',
 'Welcome to Lab thirty-three, Human forms during tool work. In this lecture, a real local MCP server asks for a small form while its tool call waits. The host validates the human reply before answering, keeps the MCP, custom tool and consent identifiers separate, and shapes the final result as one Managed custom tool result. The app stays offline, and then a small script runs the same form behind a real Managed Agents session, in the terminal.')
d.overview('ASK · VALIDATE · BRIDGE','The host owns the form; the agent gets one result',[
 ('ov-concepts','1 · CONCEPTS','MCP elicitation','A tool call that waits<br>for a human form','First, the concepts: an MCP tool call that pauses to ask a human for structured input.'),
 ('ov-validate','2 · VALIDATE','Host schema first','Invalid values never<br>reach the MCP server','Second, validation: the host checks the form against a closed schema before it replies.'),
 ('ov-outcomes','3 · OUTCOMES','Accept, decline, stop','Decline, time out or abort:<br>no accepted form','Third, the other outcomes: decline, timeout, and abort, none of which claims an answer.'),
 ('ov-code','4 · LIVE AND CODE','Real session, then code','A live terminal run;<br>then the TypeScript','Finally, a live terminal run with a real Managed agent, and the TypeScript code behind the bridge.')],
 'Managed sessions do not relay MCP elicitation here: the host mediates the form.')
d.shot('lesson','Open Lab 33',{'lesson-title':'Open Lab thirty-three, Human forms during tool work.','lesson-objective':'The objective: collect schema-validated human input during a real local MCP tool call, keeping MCP, custom tool, and consent correlation IDs separate.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: the human provides form input, the host validates it against the schema, and the local MCP tool call continues.'),
 (2,'Core rule','Region two, the core rule: keep the correlation domains separate. The MCP flow, the custom tool flow, and the consent flow each have their own ID.'),
 (3,'Keep the boundary clear','Region three: the consent path is same-origin and fictional. It is not a real OAuth flow.'),
 (6,'Put it to the test','Region six: submit invalid values, and identify the layer that rejects them: the host schema, before the MCP server receives a reply.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start the local MCP form, and inspect the initialize, tools list, tools call, and elicitation evidence.'),
 (2,'Run the comparison','Step two: submit a valid date and quantity, and inspect the MCP tool response and the custom tool result shape.'),
 (3,'Inspect the boundary','Step three: submit invalid values. The host schema rejects them before any MCP reply.'),
 (4,'Follow the workflow','Step four: try decline, timeout, and abort, and confirm that there is no accepted form.')])
d.shot('experiment','The human form experiment',{'exp-rule':'Open Run the exercise. A real local MCP stdio server requests a bounded form while its tool call waits, and the host validates the reply.',
 'exp-scenario':'Six offline scenarios: valid form, invalid values, decline, timeout, abort, and URL consent.','exp-start':'Choose valid form, and select Start MCP form.'})
d.shot('pending','Offline · The MCP server asks',{'pending-question':'The local MCP server sent elicitation create: choose a fictional observation date and quantity, from one to ten.',
 'pending-ids':'Four separate identifiers: the run, MCP request thirty-three, the custom call, and the consent ID.','pending-fields':'The form has two fields: a date, and a quantity.',
 'pending-status':'The status is pending: one MCP call, and zero answers so far.'})
d.shot('accepted','Offline · A valid answer',{'accepted-form':'Select Submit form. The host validated the date, October fifteenth, twenty twenty-six, and quantity three.',
 'accepted-result':'The MCP server completed its tool call: recorded fictional field note.',
 'accepted-bridge':'And the host shaped that result as one user dot custom tool result, with is error false.'})
d.shot('evidence','Offline · Protocol evidence',{'evidence-list':'The protocol evidence, in order: initialize, tools list, elicitation create request thirty-three, the host validation and reply, and the correlated tools call response.',
 'evidence-note':'The note is explicit: Managed cloud support was not assumed, and provider calls are zero.','evidence-status':'Accepted: one MCP call, one answer.'})
d.shot('invalid','Offline · Invalid values',{'invalid-button':'Now start the invalid values scenario, and select Try invalid quantity. It sends ninety-nine.',
 'invalid-status':'The host rejects it: invalid closed form response. No reply is sent to the MCP server.'})
d.shot('invalid-pending','Offline · The form is not consumed',{'invalid-pending-form':'No validated form was recorded.',
 'invalid-pending-status':'Inspect state: still pending, with zero answers. An invalid value does not consume the form.'})
d.shot('declined','Offline · Decline',{'declined-form':'In the decline scenario, select Decline. There is no validated form.',
 'declined-result':'The MCP tool result says: human declined the form.','declined-bridge':'The custom tool result carries is error true.'})
d.shot('timeout','Offline · Timeout',{'timeout-form':'In the timeout scenario, the host deadline expires before anyone answers. No form.',
 'timeout-status':'Inspect state shows timed out, with zero answers.'})
d.shot('aborted','Offline · Abort waiting',{'aborted-form':'In the abort scenario, select Abort waiting. No form again.','aborted-status':'The status is aborted, with zero answers.'})
d.shot('consent','Offline · Fictional consent page',{'consent-ids':'The URL consent scenario keeps its own consent ID.',
 'consent-page':'The consent page is a fixed same-origin route. Your choice goes only to the local MCP fixture. It is a demonstration, not OAuth.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: direct cloud MCP elicitation callback support is not assumed. So now we make real calls from a small script, in the terminal of the project, and let a real Managed agent ask for the same form.'})
c1={'lv-mcp':'The script retrieves the agent: it has no MCP servers. And the session it creates, with a custom tool called collect field note, has zero MCP servers too. That is the real API state.',
 'lv-tooluse':'Turn one asks the agent to record a heron observation. The agent emits agent dot custom tool use, collect field note. This custom tool call is real API behaviour.',
 'lv-elicit':'The host policy starts here: the host runs the lab\'s own local MCP form, and receives elicitation create thirty-three.',
 'lv-reject':'A scripted human first types quantity ninety-nine. The lab\'s host schema rejects it with four hundred, and no MCP reply is sent.',
 'lv-result':'Then the valid answer is accepted, and the host sends user dot custom tool result, with is error false. The agent confirms the note, and the turn ends.'}
s1={1:'lv-mcp',4:'lv-tooluse',5:'lv-elicit',6:'lv-reject',8:'lv-result'}
d.terminal('Live · A real agent asks; the host validates',[(l,s1.get(i)) for i,l in enumerate(live[:11])],c1,note='LIVE RUN · IDS PARTLY HIDDEN')
c2={'lv-tool2':'Turn two asks for a second observation. The agent calls collect field note again.',
 'lv-decline':'This time the human declines. The local MCP result says: human declined the form.',
 'lv-error':'The host sends that as a custom tool result with is error true.',
 'lv-agent2':'The agent reports that the second observation was not recorded, and does not ask again.',
 'lv-archived':'Finally, the script archives the session. Archived: yes. Two short turns, about two hundred output tokens.'}
s2={12:'lv-tool2',14:'lv-decline',15:'lv-error',16:'lv-agent2',18:'lv-archived'}
d.terminal('Live · Decline becomes an error result',[(live[0],None)]+[(l,s2.get(i)) for i,l in enumerate(live) if i>=11],c2,note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-ask','ASK','A custom tool call','The real agent asked through<br>agent.custom_tool_use','Offline, the MCP server asked directly. Live, the real agent asked through a custom tool, and the session waited for the host.'),
 ('vs-validate','VALIDATE','Same host schema','Quantity 99 refused;<br>no MCP reply','In both runs, the same host schema refused quantity ninety-nine before any MCP reply. That is host policy, not an API feature.'),
 ('vs-result','RESULT','One correlated result','user.custom_tool_result,<br>is_error true on decline','And in both, the outcome became one custom tool result, with is error true for a decline.')],'The session had zero MCP servers: elicitation stayed between the host and its local MCP server.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the route to the elicitation host and its closed schemas.'),
 (3,'POST /run','Section three starts a run, and refuses live mode.'),
 (5,'POST /respond','Section five validates the human response before replying to MCP.'),
 (7,'POST /consent/:id','Section seven handles the fixed fictional consent page.')])
d.mapping('Where does a human form fit?',[
 ('map-sdk','CLAUDE AGENT SDK','An elicitation callback','An onElicitation callback<br>in your own process','In the Agent SDK, an MCP server\'s elicitation request reaches an on elicitation callback in your own process.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Custom tool, host answer','agent.custom_tool_use, then<br>user.custom_tool_result','This platform uses Managed Agents beta sessions, not the Agent SDK. The session does not relay MCP elicitation, so the agent asks through a custom tool, and the host answers with a custom tool result.'),
 ('map-port','THIS PLATFORM','The Lab 33 host bridge','server/lib/lab33-elicitation.ts','Here, the Lab thirty-three host runs the local MCP form, and builds that result shape.')],'Validation, correlation IDs and the bridge result are in server/lib/lab33-elicitation.ts.')
d.port('port-elicit','Source · Elicit, bridge, no live',{'port-elicit':'When the MCP server sends elicitation create with request ID thirty-three, the host stores the question and marks the form pending.',
 'port-bridge':'When the tool call completes, the host builds the user dot custom tool result, with is error copied from MCP.',
 'port-live':'And a live run is refused: direct Managed MCP elicitation callback support is not assumed.'})
d.port('port-host','Source · Validate, then reply',{'port-validate':'An accepted answer must pass the closed field schema, or it is refused with four hundred.',
 'port-reply':'Only then does the host reply to MCP request thirty-three, with accept and the form, or with decline.'})
d.knowledge('Finish with the knowledge check: how should MCP and consent identifiers be handled?','MCP, custom tool, and consent flows have distinct correlation identities.')
d.summary([('sum-validate','VALIDATE','Host schema first','Invalid input stays pending.','You can now validate a human form on the host before any MCP reply.'),
 ('sum-outcomes','OUTCOMES','No false answers','Decline, timeout, abort.','Treat decline, timeout, and abort as no accepted form.'),
 ('sum-bridge','BRIDGE','One custom tool result','Separate correlation IDs.','And return one custom tool result to a Managed agent, keeping MCP, custom tool, and consent IDs separate.')],'Lab 34 · Output instruction variants')
d.finish()
