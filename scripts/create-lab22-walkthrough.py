"""Lab 22 step-by-step walkthrough authored from real captures of the running platform (offline context fixtures and one live nested-context session)."""
from lab_video_common import Deck
d=Deck(22,'Lab 22 Step by Step: Explicit Project Context and Memory, Offline and Live','Project context');e=d.e
assert 'Source: managed-api' in e['live'] and 'root-v1' in e['live'] and 'Cleanup: archived' in e['live']
d.cover('CLAUDE MANAGED AGENTS · LAB 22 · PROJECT CONTEXT','<h2>In this lab</h2><p>Select named context files.<br>Put their bytes in the message.<br>Treat prose as data.<br>Hand off a summary.</p>',
 'Welcome to Lab twenty-two, Explicit project context and memory. In this lecture, the host selects named context files and adds their exact bytes to a user message. Nothing is loaded automatically: no CLAUDE dot M D hierarchy, no home memory, and no cloud memory. We will run the offline fixtures, and then a real session.')
d.overview('SELECT · COMPOSE · VERIFY','Context is only what the host explicitly sends',[
 ('ov-concepts','1 · CONCEPTS','Explicit context','Allowlisted files, read<br>by the host, sent as data','First, the concepts: allowlisted files, read by the host, and sent as data.'),
 ('ov-offline','2 · OFFLINE','Context fixtures','Nested · conflict<br>disabled · handoff','Second, the offline fixtures: nested context, a conflicting note, disabled context, and a handoff.'),
 ('ov-live','3 · LIVE','One real session','Two files in the message,<br>no cloud memory','Third, a real session that receives two files in its message, and no memory.'),
 ('ov-code','4 · CODE','Read the TypeScript','Bounded reads<br>and one message','Finally, the TypeScript code that reads and composes the context.')],
 'Untrusted prose can never change permissions.')
d.shot('lesson','Open Lab 22',{'lesson-title':'Open Lab twenty-two, Explicit project context and memory.','lesson-objective':'The objective: select project context explicitly, and prove exactly which bytes reached the session.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: select context files explicitly, and prove what was sent.'),
 (2,'Core rule','Region two, the core rule: context is what the host reads and places in the message.'),
 (3,'Keep the boundary clear','Region three: no automatic hierarchy or memory is assumed.'),
 (6,'Put it to the test','Region six: compare the host reads with the complete user message.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: inspect the four allowlisted fixture files and their hashes.'),
 (2,'Run the comparison','Step two: run nested selection, and compare the host reads with the complete user message.'),
 (3,'Inspect the boundary','Step three: run the conflicting untrusted note, and explain why its prose cannot change permissions.'),
 (4,'Follow the workflow','Step four: run with context disabled, then start a fresh session with an explicit handoff summary.')])
d.shot('experiment','The context experiment',{'exp-rule':'Open Run the exercise. The host selects named files and adds their bytes to a user message. No automatic CLAUDE dot M D hierarchy or memory is assumed.',
 'exp-inventory':'Four allowlisted files, each with its trust level, size, and hash.'})
d.shot('controls','Offline · Choose a scenario',{'controls-scenario':'Choose a context scenario.','controls-question':'The question asks which observation details are confirmed.','controls-run':'Click Run offline context.'})
d.shot('nested','Offline · Nested selection',{'nested-source':'Nested selection runs a fresh fixture session.','nested-reads':'The host read the root and the nested context files; the untrusted note and memory are disabled.','nested-memory':'No cloud memory, and no remote file reads.'})
d.shot('nested-message','Offline · The exact message',{'nested-message-message':'Here is the exact user message: the question, a data-only notice, and the two files with their markers.'})
d.shot('nested-output','Offline · The reply',{'nested-output-output':'The fixture reply cites only the markers that were supplied.','nested-output-note':'Only allowlisted host files were read.'})
d.shot('conflict','Offline · A conflicting note',{'conflict-source':'Now the conflict scenario.','conflict-reads':'It also includes an untrusted note.','conflict-memory':'Still no memory.'})
d.shot('conflict-output','Offline · Prose is data',{'conflict-output-output':'The untrusted note tells the agent to ignore the application policy and claim that every sighting synced. But it arrives only as labeled, untrusted data inside the message.','conflict-output-note':'Its prose cannot change permissions, tools, or what the host verifies.'})
d.shot('disabled','Offline · Context disabled',{'disabled-source':'With context disabled.','disabled-reads':'No files were read at all.','disabled-memory':'And no memory.'})
d.shot('disabled-message','Offline · Only the question',{'disabled-message-message':'So the message contains only the question.'})
d.shot('handoff','Offline · A handoff',{'handoff-source':'Finally, handoff.','handoff-reads':'The host reads the root file and an explicit host summary file, instead of the nested notes.','handoff-memory':'Still no cloud memory: the summary is just another host file.'})
d.shot('handoff-message','Offline · The handoff message',{'handoff-message-message':'The summary is visible in the message: three Aurora Finches at north marsh. What carries over is exactly what the host wrote.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Live mode starts one billed text-only session; no memory store is attached. The conflict scenario is offline only.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-run','Live · Run nested selection',{'live-scenario':'Back in Lab twenty-two, choose nested.','live-run-button':'Click Run live. This starts one billed fresh session.'},note='LIVE RUN')
d.shot('live-facts','Live · The real session',{'live-facts-source':'The source is the managed API, and the session was archived.','live-facts-reads':'The host read the root and nested files only.','live-facts-memory':'No cloud memory was attached, and no remote file reads were observed.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-message','Live · The exact message',{'live-message-message':'This exact message, with both markers, is everything Claude received as context.'},note='LIVE RUN')
d.shot('live-output','Live · Claude\'s answer',{'live-output-output':'Claude separates what is confirmed, citing root v one and observations v one, from what is still unknown, and says it read no remote files or memory.',
 'live-output-note':'Only allowlisted host files were placed in the message.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the context prove?',[
 ('vs-select','SELECT','Host reads','Only allowlisted files,<br>read and hashed by the host','Only allowlisted files were read, by the host.'),
 ('vs-message','MESSAGE','Exact bytes','The full user message<br>is the whole context','The full user message was the whole context, offline and live.'),
 ('vs-data','DATA','Prose is not authority','An untrusted note cannot<br>change permissions','And untrusted prose could not change permissions.')],'No automatic CLAUDE.md hierarchy or memory reaches a Managed session.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the context module to the context runner.'),
 (3,'POST /reset','Section three resets a stored result.'),
 (4,'POST /run','Section four runs a context scenario, offline or live.'),
 (5,'Decision and early response','Section five handles the decision and the early response.')])
d.mapping('Where are CLAUDE.md and settingSources?',[
 ('map-sdk','CLAUDE AGENT SDK','Project memory files','settingSources loads<br>CLAUDE.md files locally','In the Agent SDK, setting sources can load CLAUDE dot M D files from your local project.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Explicit context','The host reads files and<br>sends them in a message','Here, nothing is loaded automatically. The host reads the files it chooses, and sends their bytes in a user message.'),
 ('map-port','THIS PLATFORM','The Lab 22 context','server/lib/lab22-context.ts','The code is in the Lab twenty-two context module.')],'Bounded reads, hashes and the message are in server/lib/lab22-context.ts.')
d.port('port-read','Source · Bounded reads',{'port-read':'Each allowlisted file is read with a size limit.','port-hash':'And hashed with SHA two fifty-six.'})
d.port('port-send','Source · One message',{'port-compose':'The selected files are composed into one message.','port-send':'And sent as a single user message to a fresh session.'})
d.knowledge('Finish with the knowledge check: what establishes which project context was selected?','The traced host selection. This lab traces selected context, rather than assuming automatic file discovery.')
d.summary([('sum-select','SELECT','Named files','Allowlisted and hashed.','You can now select context files explicitly.'),
 ('sum-send','SEND','Exact bytes','In one user message.','Send their exact bytes in one user message.'),
 ('sum-trust','TRUST','Prose is data','It cannot grant permissions.','And treat untrusted prose as data, never authority.')],'Lab 23 · Capability bundles')
d.finish()
