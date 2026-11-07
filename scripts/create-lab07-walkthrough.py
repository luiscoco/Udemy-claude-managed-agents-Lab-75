"""Lab 07 step-by-step walkthrough authored from real captures of the running platform (offline policies and two live runs)."""
from lab_video_common import Deck
d=Deck(7,'Lab 07 Step by Step: Tool Policy and Audit, Offline and Live','Tool policy and execution audit');e=d.e
assert 'handler did not run' in e['live_deny']['audit'] and 'locked' in e['live-deny_file'] and 'rewritten through policy' in e['live-rewrite_file']
d.cover('CLAUDE MANAGED AGENTS · LAB 07 · TOOL POLICY','<h2>In this lab</h2><p>Decide before execution.<br>Rewrite and revalidate.<br>Audit the real effect.<br>Load the files.</p>',
 'Welcome to Lab seven, Tool policy and execution audit. Managed Agents has no Agent SDK hooks, so in this lecture you will build the same protection in the host: validate and decide before a tool runs, optionally rewrite the input, then audit what actually happened. We will run three policies offline and two with real Claude.')
d.overview('VALIDATE · DECIDE · EXECUTE · AUDIT','Host policy before execution, audit after',[
 ('ov-concepts','1 · CONCEPTS','A host policy pipeline','Validate, decide, rewrite<br>then execute and audit','First, the concepts: the host validates, decides, may rewrite the input, executes, and records the real effect.'),
 ('ov-offline','2 · OFFLINE','Three policies','Audit only · Deny write<br>Rewrite input · exception','Second, three offline policies and a handler exception.'),
 ('ov-live','3 · LIVE','A dedicated agent','Deny a protected edit<br>Rewrite a write','Third, a dedicated agent with real Claude: a denied protected edit and a rewritten write.'),
 ('ov-code','4 · CODE','Read the TypeScript','Agent check and session<br>Results back to Claude','Finally, the TypeScript code behind the pipeline.')],
 'Post-execution evidence cannot undo an effect: block what must not happen before it runs.')
d.shot('lesson','Open Lab 07',{'lesson-title':'Open Lab zero seven, Tool policy and execution audit.',
 'lesson-objective':'The objective: replace Agent SDK tool hooks with a host policy pipeline that validates before execution and records the actual effect afterward.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: a host policy pipeline replaces the Agent SDK hooks.'),
 (2,'Core rule','Region two, the core rule. When should host policy validate a tool action? Before execution, and then audit the actual effects.'),
 (3,'Keep the boundary clear','Region three: the host enforces policy before execution, and records what actually happened.'),
 (6,'Put it to the test','Region six: block a protected-file call, and identify the host decision that prevented the effect before any handler ran.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run Audit only, and confirm the safe draft edit executes.'),
 (2,'Run the comparison','Step two: run Deny write, and verify the protected file is unchanged and the handler did not run.'),
 (3,'Inspect the boundary','Step three: run Rewrite input, and compare the original proposed dot md with the effective draft dot md after revalidation.'),
 (4,'Follow the workflow','Step four: run the handler exception and repeated call fixtures.')])
d.shot('experiment','The policy experiment',{'exp-rule':'Open Run the exercise. Managed Agents does not emit Agent SDK pre tool use or post tool use hooks. This dedicated agent declares three custom file tools, and the host runs the whole policy pipeline.',
 'exp-tools':'Expand the tool list to see read file, write file, and edit file.',
 'exp-policy':'The Host policy selector chooses audit only, deny write, or rewrite input.'})
d.shot('audit-audit','Offline · Audit only',{'audit-table':'Run Audit only. The audit row shows the whole pipeline: the tool, the decision allow, validation passed, executed with the handler running, and the effect from Status draft to Status reviewed.'})
d.shot('audit-file','Offline · Load the file',{'audit-file-box':'Click Load draft dot md. The file on disk says Status: reviewed.','audit-outcome':'The turn completed, with one result sent.'})
d.shot('deny-audit','Offline · Deny write',{'deny-table':'Now Deny write. The agent asks to change the protected file. The decision is deny: protected-file writes are denied before execution, and the handler did not run.'})
d.shot('deny-file','Offline · The protected file is unchanged',{'deny-file-box':'Load protected dot md: it still says locked.','deny-outcome':'The agent received an error result, and nothing ran.'})
d.shot('rewrite-audit','Offline · Rewrite input',{'rewrite-table':'Now Rewrite input. The agent writes proposed dot md, but the host rewrites the path to the allowed draft dot md, revalidates the full effective input, and only then executes.'})
d.shot('rewrite-file','Offline · The effective file',{'rewrite-file-box':'Load draft dot md: it contains the rewritten content.','rewrite-outcome':'The audit keeps both the original and the effective input, so the rewrite is visible.'})
d.shot('exception-audit','Offline · A handler exception',{'exception-table':'Finally, the handler exception fixture. The call was allowed and the handler ran, but it failed. The result is an error, and the audit records that the file did not change.'})
d.live_disabled('Now real Claude. Live mode is disabled, so Run live does not call Claude.','This lab also needs a dedicated agent with the three custom file tools.')
d.terminal('Live · Provision the Lab 07 agent',[(l,'prov-cmd' if 'managed:provision -- lab07' in l else 'prov-id' if l.startswith('CLAUDE_MANAGED_LAB07_AGENT_ID') else 'verify-cmd' if 'managed:verify -- lab07' in l else 'verify-ok' if 'verified' in l else None) for l in d.transcript('provision.txt')+d.transcript('verify.txt')],{
 'prov-cmd':'Run npm dot cmd run managed colon provision, dash dash, lab zero seven. It creates one agent that declares the three custom file tools.',
 'prov-id':'Paste the printed CLAUDE underscore MANAGED underscore LAB zero seven underscore AGENT underscore ID into dot env.',
 'verify-cmd':'Then run managed colon verify, dash dash, lab zero seven.',
 'verify-ok':'It confirms exactly read file, write file, and edit file as custom tools.'})
d.restart('Enable live mode in dot env and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-deny-audit','Live · Deny a protected edit',{'live-deny-table':'A tip first: the lab\'s default prompt names no file, and with it real Claude made no tool call at all. So give an explicit task. With Deny write and the prompt, edit protected dot md, Claude called edit file, and the host denied it before execution. The handler did not run.'},note='LIVE RUN')
d.shot('live-deny-file','Live · The protected file is unchanged',{'live-deny-file-box':'Load protected dot md: still locked.','live-deny-outcome':'The turn completed, one result was sent, and the session was archived.'},note='LIVE RUN')
d.shot('live-rewrite-audit','Live · Rewrite a real write',{'live-rewrite-table':'Now Rewrite input, with the prompt: create proposed dot md. Claude called write file for proposed dot md. The host rewrote the path to draft dot md, revalidated, and executed.'},note='LIVE RUN')
d.shot('live-rewrite-file','Live · The effective file',{'live-rewrite-file-box':'Load draft dot md: it contains Claude\'s content, written to the path the policy allowed.','live-rewrite-outcome':'The turn completed, and the audit shows both inputs.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the policy runs prove?',[
 ('cmp-before','BEFORE','Deny before execution','The protected file stayed locked<br>no handler ran','A denial happened before execution: no handler ran, and the protected file stayed locked.'),
 ('cmp-rewrite','REWRITE','Revalidate the new input','proposed.md became draft.md<br>then it was checked again','A rewrite changed the input, and the new input was validated again before it ran.'),
 ('cmp-audit','AUDIT','Record the real effect','Original and effective input<br>before and after the file','And the audit recorded the original input, the effective input, and the real effect on the file.')],'Prompts matter live: name the file and the change you want.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the policy module to its schemas, policies, and the live port.'),
 (3,'POST /query','Section three is the query route. It validates the request, selects the policy, and calls the live or fixture port.'),
 (4,'Decision and early response','Section four returns four twenty-nine when the server is closing or busy.'),
 (5,'Decision and early response','Section five returns four hundred when the request is invalid.'),
 (6,'Return the module contract','Section six returns the router and its cleanup contract.')])
d.mapping('Where are PreToolUse and PostToolUse?',[
 ('map-sdk','CLAUDE AGENT SDK','Tool hooks','PreToolUse and PostToolUse<br>run in your process','In the Agent SDK, pre tool use and post tool use hooks run inside your own process.'),
 ('map-managed','CLAUDE MANAGED AGENTS','No tool hooks','Custom tools pause the session<br>the host runs the pipeline','Managed Agents emits no such hooks. Instead, custom tools pause the session, and the host runs the whole policy pipeline before answering.'),
 ('map-port','THIS PLATFORM','The live port','lab07-port.ts creates the session<br>tool-session-port.ts responds','The calls are in the Lab seven port and the shared tool session port.')],'The calls are in server/lib/lab07-port.ts and server/lib/tool-session-port.ts.')
d.port('port-create','Live port · Check the agent and create the session',{'port-retrieve':'agents dot retrieve loads the dedicated Lab seven agent and rejects unsupported extensions.',
 'port-create':'sessions dot create starts the session with that agent and version.'})
d.port('port-respond','Live port · Send the policy result',{'port-respond':'After the pipeline decides and, if allowed, executes, respond sends the result with user custom tool result events. A denial is sent as an error result.'})
d.knowledge('Finish with the knowledge check: when should host policy validate a tool action?','Before execution, and then audit the actual effects. The host pipeline enforces policy before execution and records what actually happened.')
d.summary([('sum-before','BEFORE','Decide first','Deny stops the handler.','You can now explain that policy decides before any handler runs.'),
 ('sum-rewrite','REWRITE','Revalidate','A changed input is checked again.','That a rewritten input must be validated again.'),
 ('sum-audit','AUDIT','Record effects','Load the files to verify.','And that the audit and the files on disk show the real effect.')],'Lab 08 · Delegation and session threads')
d.finish()
