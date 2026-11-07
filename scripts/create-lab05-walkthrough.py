"""Lab 05 step-by-step walkthrough authored from real captures of the running platform (offline fixtures and two live runs)."""
from lab_video_common import Deck
d=Deck(5,'Lab 05 Step by Step: Custom Tools, Offline and Live','Custom tools');e=d.e
assert 'task_3 [done]' in e['live1']['state'] and 'task_1 [done]' in e['live2']['state']
d.cover('CLAUDE MANAGED AGENTS · LAB 05 · CUSTOM TOOLS','<h2>In this lab</h2><p>Declare custom tools.<br>Validate every input.<br>Run handlers on the host.<br>Answer each call once.</p>',
 'Welcome to Lab five, Custom tools. In this lecture, you will see how an agent calls your application\'s own functions. The agent declares the tools, the session pauses on each call, and your host validates the input, runs the handler, and answers once. We will run it offline and then with real Claude and a dedicated agent.')
d.overview('DECLARE · PAUSE · VALIDATE · ANSWER','Custom tools are answered by your host',[
 ('ov-concepts','1 · CONCEPTS','The custom tool loop','agent.custom_tool_use pauses<br>user.custom_tool_result answers','First, the concepts: a custom tool call pauses the session, and the host answers with one custom tool result.'),
 ('ov-offline','2 · OFFLINE','Tour and slow handler','Valid, malformed and unknown calls<br>A handler passing its deadline','Second, the offline Tour, with valid, malformed, and unknown calls, and a handler that passes its deadline.'),
 ('ov-live','3 · LIVE','A dedicated agent','Provision and verify it<br>Two real task runs','Third, you will provision a dedicated agent and run two real task sessions.'),
 ('ov-code','4 · CODE','Read the TypeScript','The query route<br>Results back to the session','Finally, the TypeScript code that sends each result back to the session.')],
 'The host is the only place a handler runs. A malformed input never reaches the handler.')
d.shot('lesson','Open Lab 05',{'lesson-title':'Open Lab zero five, Custom tools.',
 'lesson-objective':'The objective: expose typed application functions as Managed Agents custom tools, validate the input, run the handler, and answer once.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: the agent declares custom tools, the session pauses on each call, and the host answers once.'),
 (2,'Core rule','Region two, the core rule. Who executes an application custom tool handler? The host, after validating the paused call.'),
 (3,'Keep the boundary clear','Region three: the host validates the input and returns a correlated custom tool result.'),
 (6,'Put it to the test','Region six: send add task with a missing or wrong-typed title, and confirm that the result is an error, the handler count is unchanged, and the task list is identical.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: read the three tool definitions, and confirm each input schema is generated from its Zod shape.'),
 (2,'Run the comparison','Step two: run the Tour offline, and watch the malformed add task and the unknown ID come back as error results.'),
 (4,'Follow the workflow','Step four: run Slow handler, and see a handler pass its deadline, with no task saved.')])
d.shot('mapping','Custom tools answered by the host',{
 'mapping-rule':'Open Run the exercise. The Agent SDK runs in-process MCP tools. Managed Agents has no in-process server: the agent declares custom tools, and the host answers each agent custom tool use with a user custom tool result.',
 'mapping-table':'The table maps each Agent SDK term to its Managed Agents equivalent.'})
d.shot('definitions','The three tool definitions',{'definitions-summary':'Expand the tool definitions. The agent declares three tools: list tasks, add task, and complete task.',
 'definitions-json':'Each input schema is generated from a Zod shape, so the agent\'s view of the tool and the host\'s validation never drift apart.'})
d.shot('tour-calls','Offline · The Tour',{'tour-table':'Run the Tour offline. Each row is one custom tool call: the raw input, the validation result, whether the handler ran, the result sent, and the state change. The valid calls add and complete a task, while the malformed input and the unknown ID come back as is error results without running the handler.'})
d.shot('tour-state','Offline · Task state',{'tour-before':'Task state shows the store before the run: two seeded tasks.',
 'tour-after':'After the run, task three exists and is done.','tour-handlers':'And the handler counts are lower than the number of tool calls: rejected calls never reach a handler.'})
d.shot('tour-text','Offline · Agent text and outcome',{'tour-message':'The authored agent summarizes the open tasks.','tour-outcome':'The turn completed with end turn, with three custom session tools.'})
d.shot('slow-calls','Offline · A slow handler',{'slow-table':'Now run Slow handler. Add task passes the host\'s one second handler deadline, so the session receives an error result, and no change is saved.'})
d.shot('slow-state','Offline · No change saved',{'slow-before':'Before the run, the same two tasks.','slow-after':'After the run, still the same two tasks.','slow-handlers':'A timed-out handler is a failure the agent can see, not a silent success.'})
d.live_disabled('Now let us use real Claude. Live mode is disabled, so Run live does not call Claude.','This lab also needs its own dedicated agent, because the shared Lab one agent has no tools.')
d.terminal('Live · Provision the Lab 05 agent',[(l,'prov-cmd' if 'managed:provision -- lab05' in l else 'prov-id' if l.startswith('CLAUDE_MANAGED_LAB05_AGENT_ID') else 'verify-cmd' if 'managed:verify -- lab05' in l else 'verify-ok' if 'verified' in l else None) for l in d.transcript('provision.txt')+d.transcript('verify.txt')],{
 'prov-cmd':'In PowerShell, run npm dot cmd run managed colon provision, dash dash, lab zero five. This creates one agent that declares the three custom task tools. It starts no session.',
 'prov-id':'It prints CLAUDE underscore MANAGED underscore LAB zero five underscore AGENT underscore ID. Paste it into dot env.',
 'verify-cmd':'Then run managed colon verify, dash dash, lab zero five.',
 'verify-ok':'The read-only check confirms the agent has exactly list tasks, add task, and complete task as custom tools.'})
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true, then restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live1-calls','Live · Real custom tool calls',{'live1-table':'Click Run live with the default prompt. Real Claude made five custom tool calls: list the tasks, add the guide task, complete it, try to complete task ninety-nine, and list again. Every call was validated and answered by the host.'},note='LIVE RUN')
d.shot('live1-state','Live · The real task state',{'live1-before':'Before the run, the two seeded tasks.','live1-after':'After the run, task three, Write the custom tools guide, high priority, is done.','live1-handlers':'And the handler counts match the calls the host actually ran.'},note='LIVE RUN')
d.shot('live1-text','Live · Claude reports honestly',{'live1-message':'Claude reports that it added and completed the task, and that it could not complete task ninety-nine because no task has that ID, so nothing changed.','live1-outcome':'The turn completed with end turn.'},note='LIVE RUN')
d.shot('live2-calls','Live · A second task run',{'live2-table':'For run two, change only the prompt: list the tasks, then complete every open task. Claude listed the tasks and completed task one.'},note='LIVE RUN')
d.shot('live2-state','Live · Every task done',{'live2-before':'Before: task one was open.','live2-after':'After: task one is done, so every task is complete.','live2-handlers':'Two calls, two handler runs, two results sent.'},note='LIVE RUN')
d.shot('live2-text','Live · Claude summarizes the change',{'live2-message':'Claude summarizes exactly what changed.','live2-outcome':'And the turn completed. The host evidence and Claude\'s summary agree.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the custom tool runs prove?',[
 ('cmp-validate','VALIDATE','Bad input never runs','Malformed and unknown calls<br>return is_error','Invalid input and unknown IDs return error results without running any handler.'),
 ('cmp-host','HOST','The host owns the effects','Task state changes only<br>when a handler ran','The task store changed only when a handler actually ran on the host.'),
 ('cmp-live','LIVE','Claude used the tools','Five and two real calls<br>answered once each','And real Claude used the tools as declared, with every call answered exactly once.')],'Read the task state, not just the agent\'s summary.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect this module to the tool schemas and the shared tool session.'),
 (3,'POST /query','Section three is the query handler. It validates the request, creates a fresh task store for the run, and calls the live or fixture port.'),
 (4,'Decision and early response','Section four returns four twenty-nine when the server is closing or busy.'),
 (5,'Decision and early response','Section five returns four hundred when the request is invalid.'),
 (6,'Return the module contract','Section six returns the router and its cleanup contract.')])
d.mapping('Where is createSdkMcpServer?',[
 ('map-sdk','CLAUDE AGENT SDK','In-process MCP tools','createSdkMcpServer runs<br>tools inside your process','In the Agent SDK, create SDK MCP server runs the tools inside your own process.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Custom tools on the agent','agent.custom_tool_use pauses<br>user.custom_tool_result answers','In Managed Agents, the agent declares custom tools, and the host answers each paused call with a user custom tool result.'),
 ('map-port','THIS PLATFORM','The live port','lab05-port.ts creates the session<br>tool-session-port.ts responds','The calls are in the Lab five port and the shared tool session port.')],'The calls are in server/lib/lab05-port.ts and server/lib/tool-session-port.ts.')
d.port('port-create','Live port · Check the agent and create the session',{'port-retrieve':'First, agents dot retrieve loads the dedicated Lab five agent and checks that it has no MCP servers, skills, or multiagent configuration.',
 'port-create':'Then sessions dot create starts the session with that agent and version.'})
d.port('port-respond','Live port · Send the results',{'port-respond':'And respond sends each answer: sessions dot events dot send with user custom tool result events, each correlated to its custom tool use ID, with is error when the call failed.'})
d.knowledge('Finish with the knowledge check: who executes an application custom tool handler?','The host, after validating the paused call. The host validates input and returns a correlated custom tool result.')
d.summary([('sum-declare','DECLARE','Tools on the agent','Schemas generated from Zod.','You can now explain that custom tools are declared on the agent, with schemas generated from Zod.'),
 ('sum-validate','VALIDATE','Before any handler','Bad input returns is_error.','That the host validates every input before any handler runs.'),
 ('sum-answer','ANSWER','One result per call','Correlated by the call ID.','And that each call is answered with exactly one correlated result.')],'Lab 06 · Sessions and retained context')
d.finish()
