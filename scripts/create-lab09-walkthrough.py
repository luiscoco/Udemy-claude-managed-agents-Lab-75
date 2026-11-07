"""Lab 09 step-by-step walkthrough authored from real captures of the running platform (four offline variants and two live sessions)."""
from lab_video_common import Deck
d=Deck(9,'Lab 09 Step by Step: System Instructions, Offline and Live','System instructions and explicit context');e=d.e
base,custom=e['live-base_card'],e['live-custom_card']
assert 'omitted' in base['override'] and 'explicit replacement' in custom['override']
tokens=lambda c:int(c['usage'].split(' input tokens, ')[1].split(' output')[0])
assert tokens(custom)<tokens(base)
d.cover('CLAUDE MANAGED AGENTS · LAB 09 · SYSTEM INSTRUCTIONS','<h2>In this lab</h2><p>Keep the question fixed.<br>Change only instructions.<br>Compare fresh sessions.<br>Inherit or replace.</p>',
 'Welcome to Lab nine, System instructions and explicit context. In this lecture, you will keep the same question and model, change only the system instructions, and compare fresh sessions: the inherited base, a custom replacement, appended instructions, and explicit project context. Then we will compare two variants with real Claude.')
d.overview('ONE QUESTION · FOUR INSTRUCTION VARIANTS','Change only the instructions, then compare',[
 ('ov-concepts','1 · CONCEPTS','Inherit or replace','Omit the override to inherit<br>or send an explicit system','First, the concepts: omitting the system override inherits the agent\'s base instructions, while an override replaces them.'),
 ('ov-offline','2 · OFFLINE','Four variants','Base · custom · appended<br>project context','Second, four offline variants with the same question.'),
 ('ov-live','3 · LIVE','Two real sessions','Base versus custom<br>same question, same model','Third, two real fresh sessions: the base and a custom replacement.'),
 ('ov-code','4 · CODE','Read the TypeScript','agent_with_overrides<br>one fresh session per variant','Finally, the TypeScript code that composes the instructions.')],
 'Project context is never loaded automatically: the server selects it explicitly.')
d.shot('lesson','Open Lab 09',{'lesson-title':'Open Lab zero nine, System instructions and explicit context.',
 'lesson-objective':'The objective: compare inherited and explicitly composed system instructions in fresh sessions, while keeping the question and base model fixed.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: compare inherited and composed instructions in fresh sessions.'),
 (2,'Core rule','Region two, the core rule. How should instruction variants be compared? In fresh sessions, with the same question and base model.'),
 (3,'Keep the boundary clear','Region three: holding the question and model fixed isolates the instruction change.'),
 (6,'Put it to the test','Region six: keep the question fixed, change only the system instructions, and explain what is inherited and what is replaced.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: compare all four offline variants with the same question.'),
 (2,'Run the comparison','Step two: find the omitted system override in Base, and the replacement in Custom.'),
 (3,'Inspect the boundary','Step three: inspect base plus append, and the authored project context selection.'),
 (4,'Follow the workflow','Step four: compare the requested composition with the resolved session snapshot.')])
d.shot('experiment','The instruction comparison',{'exp-rule':'Open Run the exercise. Each run creates a fresh session, and keeps the base agent\'s model and version.',
 'exp-question':'The fixed user question: what is Aurora Finch, and what should its next release prioritize?',
 'exp-variant':'The System variant selector chooses one of four compositions.'})
d.shot('instructions','Custom and appended instructions',{'instr-custom':'The custom replacement says: answer in two short bullet points, and state when project facts are unknown.',
 'instr-append':'The appended instructions say: use three numbered sentences, and state uncertainty explicitly.'})
d.shot('context','Explicit project context',{'context-summary':'Expand the authored project context.','context-text':'This fictional context describes Aurora Finch. The server selects it explicitly: no file is loaded automatically.'})
d.shot('offline-base','Offline · Base',{'offline-base-override':'Click Compare all offline variants. In Base, the system override is omitted, so the session inherits the agent\'s base instructions.',
 'offline-base-settings':'The code block shows the requested composition next to the resolved session settings.'})
d.shot('offline-base-answer','Offline · Base answer',{'offline-base-answer-text':'Without explicit context, the facts about Aurora Finch are unknown.','offline-base-usage':'Offline usage is not reported: these answers are authored examples.'})
d.shot('offline-custom','Offline · Custom replacement',{'offline-custom-override':'In Custom, the override is an explicit replacement.','offline-custom-settings':'The resolved system is your custom text, not the base.'})
d.shot('offline-custom-answer','Offline · Custom answer',{'offline-custom-answer-text':'The custom instruction replaces the base system.','offline-custom-usage':'Same question, same model, different instructions.'})
d.shot('offline-append','Offline · Base plus appended instructions',{'offline-append-override':'Base plus append also sends an explicit system, composed from the base and your appended line.','offline-append-settings':'The composition shows both parts.'})
d.shot('offline-append-answer','Offline · Appended answer',{'offline-append-answer-text':'The base and appended instructions are composed explicitly.','offline-append-usage':'Composition is visible, not hidden.'})
d.shot('offline-project','Offline · Base plus project context',{'offline-project-override':'Base plus project context composes the base with the explicitly selected context.','offline-project-settings':'You can see exactly which context was included.'})
d.shot('offline-project-answer','Offline · The context answers the question',{'offline-project-answer-text':'Only this variant knows that Aurora Finch is a community bird observation notebook, and prioritizes offline capture.','offline-project-usage':'Facts come from explicit context, not from the model guessing.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend.')
d.restart('Restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-ready','Live · Run the Base variant',{'live-variant':'Choose Base, and keep the same question.','live-run':'Click Run live. Each live run is a billed fresh session.'},note='LIVE RUN')
d.shot('live-base','Live · Base inherits the agent',{'live-base-override':'The real session omitted the override, so it inherited the agent\'s base instructions.','live-base-settings':'The resolved settings come from the real session.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-base-answer','Live · Base answer',{'live-base-answer-text':'Claude answers honestly: it has no information about Aurora Finch, and it will not invent priorities. It asks for details instead.'},note='LIVE RUN')
d.shot('live-base-usage','Live · Base usage',{'live-base-usage-line':f'The real usage: {tokens(base)} output tokens.'},note='LIVE RUN')
d.shot('live-custom','Live · Custom replacement',{'live-custom-override':'Now choose Custom replacement and run live again. The override is an explicit replacement.','live-custom-settings':'The resolved system is the custom text.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-custom-answer','Live · Custom answer',{'live-custom-answer-text':'Claude follows the replacement: two short bullet points, stating that the project facts are unknown.','live-custom-usage':f'And only {tokens(custom)} output tokens. Changing only the instructions changed the format and the length.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the comparisons prove?',[
 ('cmp-inherit','INHERIT','Omit the override','The session keeps the<br>agent\'s base instructions','Omitting the override inherited the base instructions.'),
 ('cmp-replace','REPLACE','An explicit system wins','Two bullets, '+str(tokens(custom))+' tokens<br>versus '+str(tokens(base))+' with the base','An explicit replacement changed the answer\'s format and length, with the same question and model.'),
 ('cmp-context','CONTEXT','Facts must be explicit','Without context, Claude<br>says the facts are unknown','And facts about the project came only from explicitly selected context.')],'A fresh session per variant keeps the comparison fair.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the instructions module to its composition schema and the live port.'),
 (3,'POST /query','Section three is the query route. Each variant runs in its own fresh session.'),
 (4,'Decision and early response','Section four returns four twenty-nine when the server is closing or busy.'),
 (5,'Decision and early response','Section five returns four hundred when the request is invalid.'),
 (6,'Return the module contract','Section six returns the router and its cleanup contract.')])
d.mapping('Where are systemPrompt and append?',[
 ('map-sdk','CLAUDE AGENT SDK','systemPrompt options','A preset or a string,<br>with an append option','In the Agent SDK, the system prompt option takes a preset or a custom string, with an optional append.'),
 ('map-managed','CLAUDE MANAGED AGENTS','agent_with_overrides','Omit system to inherit<br>or send the composed system','In Managed Agents, you create a session with agent with overrides: omit system to inherit the base, or send the composed system explicitly.'),
 ('map-port','THIS PLATFORM','The live port','server/lib/lab09-port.ts','The calls are in the Lab nine port.')],'The calls are in server/lib/lab09-port.ts.')
d.port('port-overrides','Live port · Compose the session',{'port-overrides':'The session parameters use agent with overrides, pinned to the base agent\'s ID and version. The system field is included only when the composition overrides it.'})
d.port('port-create','Live port · Retrieve, create and archive',{'port-retrieve':'agents dot retrieve loads the base agent, so its model and version stay fixed.',
 'port-create':'sessions dot create starts one fresh session per variant.','port-archive':'And each session is archived after its turn.'})
d.knowledge('Finish with the knowledge check: how should instruction variants be compared?','In fresh sessions with the same question and base model. Holding the question and model fixed helps isolate the instruction change.')
d.summary([('sum-inherit','INHERIT','Omit to inherit','The base instructions apply.','You can now explain that omitting the override inherits the base instructions.'),
 ('sum-replace','REPLACE','Send to replace','An explicit system wins.','That an explicit system replaces them.'),
 ('sum-fair','FAIR','Compare fairly','Same question, same model.','And how to compare variants fairly, with fresh sessions and everything else fixed.')],'Lab 10 · Validated reports and interruption')
d.finish()
