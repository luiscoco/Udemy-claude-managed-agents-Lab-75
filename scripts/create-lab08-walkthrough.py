"""Lab 08 step-by-step walkthrough authored from real captures of the running platform (offline delegation and two live runs)."""
from lab_video_common import Deck
d=Deck(8,'Lab 08 Step by Step: Delegation and Session Threads, Offline and Live','Delegation and session threads');e=d.e
assert 'verified' in e['live1']['states'] and 'Host independently computed 42' in e['live1']['ledger'] and 'Host independently computed 42' in e['live2']['ledger']
d.cover('CLAUDE MANAGED AGENTS · LAB 08 · DELEGATION','<h2>In this lab</h2><p>Delegate to three workers.<br>Read each thread.<br>Verify role capabilities.<br>Check host effects.</p>',
 'Welcome to Lab eight, Delegation and session threads. In this lecture, a coordinator delegates work to three predefined agents: a researcher, a reviewer, and a calculator. You will read each worker\'s separate session thread, and verify their capabilities and effects in the host, not in their names or reports. We will run it offline and with real Claude.')
d.overview('DELEGATE · REPORT · VERIFY','Worker names are not evidence of what they can do',[
 ('ov-concepts','1 · CONCEPTS','Predefined agents','A coordinator with three workers<br>each on its own sthr_ thread','First, the concepts: a coordinator delegates to three predefined agents, each with its own session thread.'),
 ('ov-offline','2 · OFFLINE','The effect ledger','Normal · wrong role<br>cross-posted call','Second, the offline fixtures and the capability and effect ledger.'),
 ('ov-live','3 · LIVE','Real delegation','Provision four agents<br>two real runs','Third, you will provision the coordinator and its workers, and run two real delegations.'),
 ('ov-code','4 · CODE','Read the TypeScript','The multiagent configuration<br>and the session calls','Finally, the TypeScript code that configures and runs the delegation.')],
 'The host recomputes and records each effect: a worker\'s report is a claim.')
d.shot('lesson','Open Lab 08',{'lesson-title':'Open Lab zero eight, Delegation and session threads.',
 'lesson-objective':'The objective: delegate bounded work to predefined managed agents, inspect separate session thread histories, and verify role capabilities and effects in the host.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: delegate bounded work to predefined agents, and verify their effects in the host.'),
 (2,'Core rule','Region two, the core rule. What establishes a worker role capability? Verified role configuration and host-observed effects.'),
 (3,'Keep the boundary clear','Region three: worker names alone are not evidence of their configured tools or effects.'),
 (6,'Put it to the test','Region six: restrict one worker capability, and compare its report with the host effect ledger.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run the normal fixture, and identify the researcher, reviewer, and calculator thread IDs.'),
 (2,'Run the comparison','Step two: separate delegation, report receipt, and independent verification states.'),
 (3,'Inspect the boundary','Step three: confirm the reviewer write is denied, and the calculator sum is recomputed by the host.'),
 (4,'Follow the workflow','Step four: run the cross-posted, duplicate, and wrong-role scenarios.')])
d.shot('experiment','The delegation experiment',{'exp-rule':'Open Run the exercise. The coordinator uses a multiagent configuration with three predefined agents. Inline agents and workflows are disabled, and each child stream is identified by its own session thread ID.',
 'exp-prompt':'The prompt asks the coordinator to delegate fixture research, review the proposed change, and calculate twenty-one plus twenty-one.'})
d.shot('normal-threads','Offline · Separate thread histories',{'normal-thread-table':'Run the offline delegation. Thread histories lists one row per thread: the parent coordinator and each worker, with its own thread ID, status, and history of what was sent and reported.'})
d.shot('normal-ledger','Offline · The capability and effect ledger',{'normal-ledger-table':'The ledger records what each role really did. The researcher\'s read was allowed. The reviewer\'s proposed write was denied, and its handler did not run. And the host independently computed forty-two for the calculator.',
 'normal-states':'The states show three separate steps: delegated, report received, and verified.'})
d.shot('wrong-role-ledger','Offline · A wrong-role call',{'wrong-role-ledger-table':'In the wrong-role scenario, the reviewer tries to use the calculator\'s add numbers action. It is denied, because that capability is not configured for the reviewer role.',
 'wrong-role-states':'The run still completes, and the denied action had no effect.'})
d.shot('cross-ledger','Offline · A cross-posted call',{'cross-ledger-table':'In the cross-posted scenario, a call arrives on the wrong thread. The host checks which thread each call belongs to, and the ledger shows no extra effect.',
 'cross-states':'Delegation, report, and verification are still recorded separately.'})
d.live_disabled('Now real delegation. With live mode disabled, Run live does not call Claude.','Live mode also needs the Lab eight coordinator and its three workers.')
d.terminal('Live · Provision the coordinator and workers',[(l,'prov-cmd' if 'managed:provision -- lab08' in l else 'prov-id' if l.startswith('CLAUDE_MANAGED_LAB08_AGENT_ID') else 'verify-cmd' if 'managed:verify -- lab08' in l else 'verify-ok' if 'verified' in l else None) for l in d.transcript('provision.txt')+d.transcript('verify.txt')],{
 'prov-cmd':'Run npm dot cmd run managed colon provision, dash dash, lab zero eight. It creates the three worker agents, then the coordinator that references them.',
 'prov-id':'Paste the printed coordinator ID, CLAUDE underscore MANAGED underscore LAB zero eight underscore AGENT underscore ID, into dot env.',
 'verify-cmd':'Then run managed colon verify, dash dash, lab zero eight.',
 'verify-ok':'It confirms three predefined subagents, with inline agents and workflows disabled.'})
d.restart('Enable live mode and restart the backend with npm dot cmd run dev colon server. Live delegation can take a while, so the platform allows up to one hundred and twenty seconds for a live run.','Wait for Backend ready.')
d.shot('live1-threads','Live · Real session threads',{'live1-thread-table':'Click Run live. Now each row is a real session thread from the service. The coordinator turned your request into separate, bounded instructions for each worker, and each worker\'s history is kept in its own thread.'},note='LIVE RUN')
d.shot('live1-ledger','Live · Verified by the host',{'live1-ledger-table':'The ledger shows the effects the host actually observed: the researcher read the authored fixture, and for the calculator, the host independently computed forty-two.',
 'live1-states':'Delegated, report received, verified: the outcome is completed.'},note='LIVE RUN')
d.shot('live2-threads','Live · A second delegation',{'live2-thread-table':'For run two, change only the prompt: ask the calculator to add forty plus two, and the reviewer to check it. The threads show the coordinator\'s instruction and the calculator\'s work.'},note='LIVE RUN')
d.shot('live2-ledger','Live · The host checks the sum',{'live2-ledger-table':'The ledger records the calculator\'s add numbers call with forty and two, and the host independently computed forty-two.',
 'live2-states':'The host\'s verification is what makes the answer trustworthy, not the worker\'s report.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the delegation prove?',[
 ('cmp-threads','THREADS','Separate histories','Each worker has its own<br>sthr_ thread','Each worker had its own thread history, offline and live.'),
 ('cmp-roles','ROLES','Capabilities are configured','Wrong-role calls are denied<br>names prove nothing','Role capabilities came from configuration: a wrong-role call was denied.'),
 ('cmp-host','HOST','Effects are verified','The host recomputed 42<br>both times','And the host recomputed every answer it could verify, instead of trusting the report.')],'Delegation, report receipt and verification are three different states.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the delegation module to its roster and the live port.'),
 (3,'POST /query','Section three is the query route. It validates the request and runs the delegation through the live or fixture port.'),
 (4,'Decision and early response','Section four returns four twenty-nine when the server is closing or busy.'),
 (5,'Decision and early response','Section five returns four hundred when the request is invalid.'),
 (6,'Return the module contract','Section six returns the router and its cleanup contract.')])
d.mapping('Where are the SDK subagents?',[
 ('map-sdk','CLAUDE AGENT SDK','agents option','Subagents run in<br>your own process','In the Agent SDK, subagents are defined in the agents option and run in your own process.'),
 ('map-managed','CLAUDE MANAGED AGENTS','multiagent coordinator','Predefined agents on the coordinator<br>each child on an sthr_ thread','In Managed Agents, the coordinator agent carries a multiagent configuration with predefined agents, and each child runs on its own session thread.'),
 ('map-port','THIS PLATFORM','The live port','server/lib/lab08-port.ts','The calls are in the Lab eight port.')],'The calls are in server/lib/lab08-port.ts.')
d.port('port-config','Live port · The multiagent configuration',{'port-multiagent':'The coordinator is configured with the multiagent type, its three predefined agents, inline agents disabled, and workflows disabled.',
 'port-system':'Its system instructions tell it to delegate to the matching agents, and to treat host tool results as authoritative.'})
d.port('port-create','Live port · Check, create and send',{'port-retrieve':'agents dot retrieve checks that the coordinator really has that multiagent configuration.',
 'port-create':'sessions dot create starts the coordinator session,','port-send':'and the user message starts the delegation. Each child thread then streams its own events.'})
d.knowledge('Finish with the knowledge check: what establishes a worker role capability?','Verified role configuration and host-observed effects. Worker names alone are not evidence of their configured tools or effects.')
d.summary([('sum-threads','THREADS','One per worker','Each child has its own history.','You can now explain that each worker runs on its own session thread.'),
 ('sum-roles','ROLES','Configured, not named','Capabilities come from configuration.','That a role\'s capabilities come from configuration, not from its name.'),
 ('sum-verify','VERIFY','Host effects','The host checks the result.','And that the host verifies the effects instead of trusting the worker\'s report.')],'Lab 09 · System instructions and explicit context')
d.finish()
