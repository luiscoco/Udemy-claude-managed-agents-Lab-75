"""Lab 34 step-by-step walkthrough authored from real captures of the running platform (offline: authored style answers; live: a small script making real Managed Agents calls)."""
from lab_video_common import Deck
d=Deck(34,'Lab 34 Step by Step: Output Instruction Variants, Offline and Live','Output instruction variants');e=d.e
assert e['nolive']=='Ready. All comparisons use authored offline answers.' and e['unknown']=='Unknown trusted host style; no session was created.'
assert 'Report schema: valid. Capabilities: 0. Provider calls: 0.' in e['run_concise'] and 'fixtures/lab34/styles/review-v2.md' in e['run_review-v2']
assert 'Trusted output preference (review-v2; SHA-256 be8e2e24' in e['system'] and 'report valid' in e['status_concise']
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert "Unknown style 'missing-style' → Unknown trusted host style; no session was created. (no API call)" in L
assert L.count('(matches host)')==2 and L.count('Format check')==2 and L.count(': pass · report schema: valid')==2
assert 'only the system differs' in L and L.count(': yes')==2 and 'stop end_turn · 3 answer lines' in L
d.cover('CLAUDE MANAGED AGENTS · LAB 34 · OUTPUT INSTRUCTION VARIANTS','<h2>In this lab</h2><p>Pick a trusted style file.<br>Compose the system override.<br>Compare in fresh sessions.<br>Validate the report separately.</p>',
 'Welcome to Lab thirty-four, Output instruction variants. In this lecture, you will compare trusted host style files, each composed into the system override of a fresh session, while the question, the empty tools, and the report schema stay the same. You will see why a style is not a validator. The app stays offline, and then a small script asks the same question live, on two real Managed Agents sessions.')
d.overview('STYLE · SESSION · VALIDATE','Styles shape answers; schemas check reports',[
 ('ov-concepts','1 · CONCEPTS','Trusted style files','A host registry<br>with SHA-256 hashes','First, the concepts: a host registry of trusted style files, each with its hash.'),
 ('ov-compare','2 · COMPARE','Fresh sessions','Same question, same tools;<br>only the system changes','Second, the comparison: every style runs in a fresh session with the same question and the same empty tools.'),
 ('ov-validate','3 · VALIDATE','Independent checks','A JSON schema, not<br>the style, checks the report','Third, validation: the report schema is checked independently of the style text.'),
 ('ov-code','4 · LIVE AND CODE','Real calls, then code','Two live sessions;<br>then the TypeScript','Finally, a live terminal run with two real sessions, and the TypeScript code behind the lab.')],
 'An output style formats an answer. It never proves that a report is valid.')
d.shot('lesson','Open Lab 34',{'lesson-title':'Open Lab thirty-four, Output instruction variants.','lesson-objective':'The objective: compare trusted host output instruction files in fresh session snapshots, while validating JSON reports independently of style text.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: trusted style files, a fresh session snapshot, and a JSON report validated independently of style text.'),
 (2,'Core rule','Region two, the core rule: a style instruction changes presentation. It does not validate. The JSON report is validated separately.'),
 (3,'Keep the boundary clear','Region three: formatting instructions are not an independent schema validator.'),
 (6,'Put it to the test','Region six: use an unknown style, and inspect the preflight rejection.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: inspect the trusted concise, explanatory and review style catalog, and its hashes.'),
 (2,'Run the comparison','Step two: compare the same fixed question across styles. Each run has a fresh session and identical empty capabilities.'),
 (3,'Inspect the boundary','Step three: inspect the exact composed system override, and the host file provenance.'),
 (4,'Follow the workflow','Step four: compare review v one with review v two. Older session snapshots stay unchanged.')])
d.shot('experiment','The output styles experiment',{'exp-rule':'Open Run the exercise. Trusted host files supply output preferences in the system override of each fresh session. The question, empty tool capabilities, and the report schema stay the same.',
 'exp-question':'There are four trusted host instruction files, and one fixed question: what should a fictional Aurora Finch observation note include?','exp-controls':'Choose a trusted style, and compare it in a fresh session.'})
d.shot('concise','Offline · The concise style',{'concise-heading':'Select concise, and Compare in fresh session. The run is completed.',
 'concise-file':'It names the instruction file, fixtures slash lab thirty-four slash styles slash concise dot m d, and its SHA-256 hash.',
 'concise-answer':'The authored answer is three short bullets: date and time, location, count and observation notes.',
 'concise-schema':'The report schema is valid. Capabilities: zero. Provider calls: zero.','concise-status':'The status confirms a fresh session, and a valid report.'})
d.shot('review-v2','Offline · The review v2 style',{'review-v2-heading':'Now select review v two, and compare again.',
 'review-v2-file':'A different instruction file, with a different hash, and another fresh session.',
 'review-v2-answer':'The same question now gets a reviewer answer, grouped under Completeness, Clarity, and Next steps.',
 'review-v2-schema':'The report schema check is the same, and still valid.','review-v2-status':'Only the style changed.'})
d.shot('system','Offline · The composed system override',{'system-summary':'Open Exact composed system override.',
 'system-pre':'The host composes a read-only base instruction, then the trusted output preference, labeled with the style name and its SHA-256 hash, then the style text itself.',
 'system-note':'The authored answer illustrates formatting only. It is not a live style quality score, and report validation is a separate schema check.'})
d.shot('unknown','Offline · An unknown style',{'unknown-status':'Select Try unknown style. Unknown trusted host style: no session was created.',
 'unknown-rule':'Unknown style names fail before session creation, and existing run snapshots do not change.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: all comparisons use authored offline answers, and there is no Run live button.',
 'no-live-rule':'Authored answers cannot show what a real model does with each style. So now we make the real calls from a small script, in the terminal of the project.'})
d.terminal('Live · The concise style, in a fresh session',[(l,'lv-run' if l.startswith('PS ') else 'lv-unknown' if l.startswith('Unknown style') else 'lv-style' if l.startswith('Style concise') else 'lv-session' if l.startswith('  Session') else 'lv-check' if l.startswith('  Format check') else None) for l in live[:9]],
 {'lv-run':"The script reads the agent and environment IDs from dot env, and runs with node and t s x. It reuses the lab's own trusted style registry.",
  'lv-unknown':'First, the unknown style is refused by the host registry, before any API call: no session was created.',
  'lv-style':'Then the concise style: its file, and the start of its SHA-256 hash.',
  'lv-session':'The script creates a fresh session with agent with overrides: zero tools, and the composed system. The system read back from the session matches the host.',
  'lv-check':"The real answer has three bullet lines. The host format check passes, and the JSON report at the end is valid against the lab's report schema."},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · The review v2 style, then archive',[(l,'lv-session2' if l.startswith('  Session') else 'lv-answer2' if l.startswith('    Completeness') else 'lv-check2' if l.startswith('  Format check') else 'lv-differs' if l.startswith('Same question') else 'lv-archived' if l.startswith('Archived sesn_017') else None) for l in live[:1]+live[9:]],
 {'lv-session2':'For review v two, a second fresh session, again with zero tools, and a different system that also matches the host.',
  'lv-answer2':'The same question now gets a reviewer answer, starting with Completeness and Clarity.',
  'lv-check2':'Its format check looks for Completeness, Clarity, and Next steps: pass. The report schema is checked the same way: valid.',
  'lv-differs':'Same question, zero tools, the same report schema. Only the system differs, as the two short hashes show.',
  'lv-archived':'Finally, both sessions are archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real sessions prove?',[
 ('vs-style','STYLE','The system shapes the answer','Bullets for concise;<br>review headings for v2','Like the authored answers, the real model followed each style: three bullets, then reviewer headings.'),
 ('vs-session','SESSION','Fresh, and only the system differs','agent_with_overrides with<br>zero tools, system read back','Each style ran in its own fresh session, and the session confirmed the exact composed system.'),
 ('vs-validate','VALIDATE','Checks stay on the host','Format check and JSON schema<br>run after the answer','And the host, not the style, checked the format and validated the report.')],'Unknown styles are refused by the host registry before any session is created.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the route to the style registry and the schemas.'),
 (3,'POST /compare','Section three handles compare. It validates the request, and refuses live mode.'),
 (6,'POST /live','Section six: the live route is refused, until a dedicated Managed agent is configured.'),
 (7,'POST /who','Section seven inspects or closes a run, for its owner only.')])
d.mapping('Where do output styles live?',[
 ('map-sdk','CLAUDE AGENT SDK','Output styles and prompts','A system prompt or output<br>style set in query options','In the Agent SDK, you shape output with the system prompt or an output style, set in the query options of your own process.'),
 ('map-managed','CLAUDE MANAGED AGENTS','A per-session system override','agent_with_overrides<br>with a replacement system','This platform uses Managed Agents beta sessions, not the Agent SDK. A fresh session gets a replacement system through agent with overrides.'),
 ('map-port','THIS PLATFORM','The Lab 34 registry','server/lib/lab34-styles.ts','Here, the Lab thirty-four registry hashes trusted style files, composes the system, and validates the report separately.')],'Style hashes, the composed system and report validation are in server/lib/lab34-styles.ts.')
d.port('port-compose','Source · Hash, refuse, compose',{'port-hash':'Each trusted style file is read from fixtures, and hashed with SHA-256.',
 'port-unknown':'An unknown style is refused with four hundred, before any session exists.','port-compose':'The configured system is the base, plus the trusted preference, labeled with its name and hash.',
 'port-verified':'The report is validated by a separate function, not by the style.'})
d.port('port-validate','Source · An independent validator',{'port-validate':'validate Lab thirty-four Report parses the JSON, and checks it against the report schema, returning valid or the first errors.'})
d.knowledge('Finish with the knowledge check: does an output style validate a report schema?','No. Formatting instructions are not an independent schema validator.')
d.summary([('sum-trusted','TRUSTED','Host style files','Hashed and named.','You can now compose trusted, hashed style files into a system override.'),
 ('sum-fresh','FRESH','One session per style','Only the system differs.','Compare styles in fresh sessions, with the same question and tools.'),
 ('sum-validate','VALIDATE','Separate checks','Schemas, not styles.','And validate reports with an independent schema.')],'Lab 35 · Event mirrors and conversation indexes')
d.finish()
