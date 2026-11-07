"""Lab 11 step-by-step walkthrough authored from real captures of the running platform (offline skill fixtures and one live pinned-skill session)."""
from lab_video_common import Deck
d=Deck(11,'Lab 11 Step by Step: Managed Skills and Progressive Loading, Offline and Live','Managed skills');e=d.e
assert 'Source: managed-api' in e['live_text'] and 'instructions: succeeded' in e['live_text'] and 'reference: succeeded' in e['live_text'] and 'Cleanup: archived' in e['live_text']
d.cover('CLAUDE MANAGED AGENTS · LAB 11 · MANAGED SKILLS','<h2>In this lab</h2><p>Pin a skill version.<br>Attach it to a fresh session.<br>Observe file reads.<br>Separate metadata from evidence.</p>',
 'Welcome to Lab eleven, Managed skills and progressive loading. In this lecture, you will attach a pinned skill version to a fresh session, and learn to separate what is configured from what the agent actually read. We will run the offline fixtures, upload a real skill, and then run a real session.')
d.overview('PIN · ATTACH · OBSERVE','Attached metadata is not proof of a read',[
 ('ov-concepts','1 · CONCEPTS','Progressive loading','The agent reads SKILL.md<br>and its reference on demand','First, the concepts: a skill is loaded progressively, by reading its files only when the agent decides they are relevant.'),
 ('ov-offline','2 · OFFLINE','Skill fixtures','Reads · metadata only<br>failed read · five variants','Second, the offline fixtures: successful reads, metadata only, a failed read, and all five variants.'),
 ('ov-live','3 · LIVE','Upload and run','One pinned version<br>one real fresh session','Third, an explicit skill upload, and one real session with the pinned version.'),
 ('ov-code','4 · CODE','Read the TypeScript','Session overrides<br>pin verification','Finally, the TypeScript code that attaches and verifies the pin.')],
 'Only a matching read call and result proves that a skill file was loaded.')
d.shot('lesson','Open Lab 11',{'lesson-title':'Open Lab eleven, Managed skills and progressive loading.',
 'lesson-objective':'The objective: inspect pinned skill metadata separately from observed instruction and reference file reads, in fresh sessions.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the same objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: inspect pinned skill metadata, separately from the observed file reads.'),
 (2,'Core rule','Region two, the core rule. What establishes an observed skill file read? A matching file read call and its result.'),
 (3,'Keep the boundary clear','Region three: attached metadata does not establish that the instructions or the reference were read.'),
 (6,'Put it to the test','Region six: compare attached metadata with the read evidence, and explain why no observed read does not prove the skill was unavailable.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: compare all five offline variants, and notice that each one gets a distinct session.'),
 (2,'Run the comparison','Step two: preview the authored instructions and reference. A host preview is not an agent read.'),
 (3,'Inspect the boundary','Step three: run Metadata only and Failed read, to distinguish attachment, attempted loading, and successful loading.'),
 (4,'Follow the workflow','Step four: compare revision one with revision two, and inspect their different pinned versions.')])
d.shot('experiment','The skill experiment',{'exp-rule':'Open Run the exercise. A fresh session attaches a pinned skill version, but metadata does not prove a read. The model may even decide the skill is irrelevant.',
 'exp-question':'The question asks Claude to format an Aurora Finch field observation, using the formatting skill and its reference.',
 'exp-variant':'The skill variant selects no skill, the pinned skill, a missing ID, an absent reference, or a revised version.',
 'exp-scenario':'The offline loading scenario selects what the fixture stream does: reads, metadata only, failed read, duplicate events, or a hang.'})
d.shot('bundle','The authored bundle and pins',{'bundle-readonly':'The session toolset is read only: write, edit, bash, web tools, MCP and orchestration are disabled. Skill filtering is not authorization.',
 'bundle-pins':'No pins are uploaded yet, so live runs with a skill are blocked.','bundle-files':'The bundle has two files: SKILL dot M D, and a reference, format dot M D.'})
d.shot('preview','Preview the authored instructions',{'preview-code':'Click Preview authored instructions. SKILL dot M D tells the agent to read the reference before formatting.',
 'preview-status':'The status is explicit: a host preview is not evidence of an agent read.'})
d.shot('reads','Offline · Successful reads',{'reads-header':'Run the offline experiment with the pinned skill and the reads scenario.','reads-attachment':'The configured attachment is revision one, and one skill resolved.',
 'reads-reads':'Two reads were observed: the instructions and the reference, each with a matching call and a successful result.'})
d.shot('metadata','Offline · Metadata only',{'metadata-header':'Now choose Metadata only.','metadata-attachment':'The attachment is identical: revision one, one resolved skill.',
 'metadata-reads':'But no skill file reads were observed. The metadata alone proves nothing about loading.'})
d.shot('failed','Offline · A failed read',{'failed-header':'Then Failed read.','failed-attachment':'The same attachment again.',
 'failed-reads':'Both reads were attempted but failed, so the content was not loaded. Attempted is not the same as succeeded.'})
d.shot('compare-without','Offline · Compare all variants',{'without-header':'Now click Compare all offline variants. Five fresh sessions run one after another. The first has no skill.',
 'without-attachment':'Its attachment is none, with zero resolved skills.','without-reads':'And of course, no skill reads.'})
d.shot('compare-revised','Offline · The revised version',{'revised-header':'The last comparison is the revised pinned version.','revised-attachment':'It attaches revision two, a different pinned version.',
 'revised-answer':'Revision two changes the headings: Sighting, Capture conditions, Data gaps, and Next action. A new version only applies in a new session.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','The setup steps are listed: check the bundle, upload it explicitly, configure live mode, and refresh the pin metadata.')
lines=d.transcript('skills-upload.raw.txt')
d.terminal('Live · Upload and pin the skill',[(l,'up-check' if i==0 else 'up-upload' if l.endswith('skills:upload -- v1') else 'up-uploaded' if l.startswith('Uploaded v1') else 'up-matches' if 'Pin matches' in l else None) for i,l in enumerate(lines)],
 {'up-check':'In the project folder, run npm dot cmd run skills colon check, dash dash, v one. It validates the bundle locally, without any provider request.',
  'up-upload':'Then upload it deliberately with skills colon upload.','up-uploaded':'The upload returns a skill ID and an immutable pinned version. No session or model run is started.',
  'up-matches':'Check again: the pin now matches the authored bundle.'})
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-ready','Live · The pin is ready',{'live-pin-ready':'Back in Lab eleven, click Refresh pin metadata. The base live setup is ready, and so is the selected skill pin.','live-pins':'Revision one matches the authored bundle.'},note='LIVE RUN')
d.shot('live-question','Live · Keep the question',{'live-question-text':'Keep the same Aurora Finch question.','live-variant':'And the With pinned skill variant.'},note='LIVE RUN')
d.shot('live-run','Live · Run one fresh session',{'live-run-button':'Click Run live. This starts one billed fresh session. It never uploads a skill.'},note='LIVE RUN')
d.shot('live-session','Live · The real session',{'live-header':'The result arrives for the pinned skill.','live-source':'The source is managed API, and the outcome is completed.',
 'live-attachment':'The configured attachment is the immutable version we uploaded.','live-resolved':'The session returned a numeric version alias, and the host resolved it to the same canonical pin.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-reads','Live · Real file reads',{'live-reads-list':'And here is the real evidence: Claude read both SKILL dot M D and the reference, and both reads succeeded.',
 'live-evidence-note':'The exact text match was not established from the returned text, and the note reminds us that a read does not attest semantic compliance.'},note='LIVE RUN')
d.shot('live-answer','Live · The formatted observation',{'live-answer-text':'Claude used the reference headings: Observation, Conditions, and Follow-up, and marked the missing time and location as unknown instead of guessing.'},note='LIVE RUN')
d.shot('live-usage','Live · Usage and cleanup',{'live-usage-text':'No interruption was needed, the session was archived, and the observed usage is shown. Usage is not the complete billed session cost.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the evidence prove?',[
 ('cmp-metadata','METADATA','Configuration only','Same attachment in reads,<br>metadata only and failed','The same attachment appeared whether the files were read, not read, or failed.'),
 ('cmp-reads','READS','Calls plus results','Only matched successful<br>results prove loading','Only a matching read call with a successful result proved loading, offline and live.'),
 ('cmp-pins','PINS','Immutable versions','Upload is explicit;<br>a run never uploads','And the skill version was pinned by an explicit upload; a run never uploads anything.')],'Missing read events mean no observed read, not proof of no read.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the skills module to the bundle reader and the live port.'),
 (3,'POST /load','Section three is the host preview route: it loads an allowlisted file, and it is never an agent read.'),
 (4,'POST /{action}','Section four handles invoke and new session, which each run one fresh comparison turn.'),
 (7,'Return the module contract','Section seven returns the router and its cleanup contract.')])
d.mapping('Where are skills configured?',[
 ('map-sdk','CLAUDE AGENT SDK','Skills on the filesystem','The SDK discovers skills<br>from .claude/skills folders','In the Agent SDK, skills are discovered from local dot claude skills folders, through the setting sources option.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Skills on the session','An uploaded skill ID<br>with a pinned version','Here, a skill is uploaded to Anthropic and attached to a session by its ID and an immutable version. A local folder is not mounted automatically.'),
 ('map-port','THIS PLATFORM','The Lab 11 port','server/lib/lab11-port.ts','The code is in the Lab eleven port.')],'Session overrides and pin verification are in server/lib/lab11-port.ts.')
d.port('port-toolset','Source · A read-only toolset',{'port-toolset':'The toolset disables every built-in tool by default, and enables only read, so the agent can load skill files and nothing else.'})
d.port('port-overrides','Source · Attach the pinned skill',{'port-overrides':'The session uses agent with overrides: the base agent and version, the read-only toolset, no MCP servers, and exactly one custom skill with its pinned version.'})
d.port('port-create','Source · Verify, create, resolve',{'port-metadata':'Before creating a session, the host retrieves the pinned version metadata, a read-only check.',
 'port-create':'Then it creates the session with the overrides.','port-resolved':'And records the skills the session actually resolved, to verify them against the pin.'})
d.knowledge('Finish with the knowledge check: what establishes an observed skill file read?','A matching file read call and its result. Attached metadata does not establish that the instructions or references were read.')
d.summary([('sum-pin','PIN','Immutable versions','Upload explicitly, then pin.','You can now explain that a skill is uploaded explicitly and attached by an immutable version.'),
 ('sum-load','LOAD','Progressive reads','The agent decides what to read.','That the agent loads skill files progressively, only when it decides they are relevant.'),
 ('sum-prove','PROVE','Evidence, not metadata','Matching calls and results.','And that only a matching read call and result proves a file was loaded.')],'Lab 12 · Streaming input')
d.finish()
