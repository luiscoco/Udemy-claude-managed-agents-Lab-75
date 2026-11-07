"""Lab 25 step-by-step walkthrough authored from real captures of the running platform (offline compaction replay fixtures, plus a live terminal run against the Managed Agents API)."""
from lab_video_common import Deck
d=Deck(25,'Lab 25 Step by Step: Context Growth and Compaction Evidence, Offline and Live','Context and compaction');e=d.e
assert 'r2: omitted from summary' in e['handoff']
live=d.transcript('live.raw.txt')
for key in ('status idle · tools none','Session usage (cumulative): input 4 · output 64','Usage only grows: all input-side tokens 701 → 1490',
 'Compaction events observed: 0','compaction threshold: not exposed by the API → unknown, not 0','Archived: yes'):assert any(key in l for l in live),key
split=next(i for i,l in enumerate(live) if l.startswith('Events listed'))
d.cover('CLAUDE MANAGED AGENTS · LAB 25 · COMPACTION','<h2>In this lab</h2><p>Read bounded reports.<br>Observe a compaction event.<br>Keep unknowns unknown.<br>Check a summary handoff.</p>',
 'Welcome to Lab twenty-five, Context growth and compaction evidence. In this lecture, you will replay a stream that contains a documented compaction event, compare it with one that does not, keep unavailable metrics distinct from zero, and check which facts a summary handoff loses. Then a small script makes real Managed Agents calls, so you can see live usage and events in the terminal.')
d.overview('OBSERVE · MEASURE · HAND OFF','A compaction event proves occurrence, not thresholds',[
 ('ov-concepts','1 · CONCEPTS','Context evidence','Events, cumulative usage<br>and unknown window size','First, the concepts: compaction events, cumulative usage, and an unknown window size.'),
 ('ov-offline','2 · OFFLINE · LIVE','Replays, then a live run','Compacted · none · missing<br>plus a real terminal run','Second, the offline replays: compacted, no compaction, and missing metrics. Then a live terminal run with real usage and events.'),
 ('ov-handoff','3 · HANDOFF','A summary handoff','Which report facts<br>the summary kept','Third, a summary handoff, and the fact it lost.'),
 ('ov-code','4 · CODE','Read the TypeScript','Observe the event;<br>author the summary','Finally, the TypeScript code that observes the event and builds the summary.')],
 'Cumulative token usage is not current window occupancy.')
d.shot('lesson','Open Lab 25',{'lesson-title':'Open Lab twenty-five, Context growth and compaction evidence.','lesson-objective':'The objective: separate observed compaction events from usage metrics and host-authored summary handoffs.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: separate compaction events, usage, and summaries.'),
 (2,'Core rule','Region two, the core rule: observed provider events and host-authored summaries are distinct.'),
 (3,'Keep the boundary clear','Region three: usage totals do not reveal the free context or the trigger threshold.'),
 (6,'Put it to the test','Region six: identify which fact a summary handoff lost.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: inspect the bounded report files and the checked host reads.'),
 (2,'Run the comparison','Step two: replay the compaction event, and compare it with a stream that has none.'),
 (3,'Inspect the boundary','Step three: run Missing metrics, and keep unavailable values distinct from zero.'),
 (4,'Follow the workflow','Step four: run Summary omits, and inspect which fact the new session lost.')])
d.shot('experiment','The compaction experiment',{'exp-rule':'Open Run the exercise. A documented compaction event proves occurrence when it is observed. Cumulative usage does not tell you the free context or the threshold.',
 'exp-reports':'Three bounded report files, each with its hash.','exp-note':'The thread exposes cumulative usage and timing, not the free window or the compaction threshold.'})
d.shot('compacted','Offline · Compacted',{'compacted-source':'Run the compacted replay. The host read all three reports, with zero provider calls.','compacted-usage':'Cumulative thread usage: four hundred twenty input tokens.',
 'compacted-window':'The context window, free context, and threshold are all unavailable.','compacted-events':'One compaction event was observed in the stream.'})
d.shot('compacted-message','Offline · What the event means',{'compacted-response':'The fixture says it read three reports.','compacted-note':'The event does not reveal a threshold, and cumulative usage is not window occupancy.'})
d.shot('none','Offline · No compaction',{'none-source':'Now no compaction.','none-usage':'The usage is exactly the same.','none-window':'The window is still unavailable.','none-events':'But no compaction event appears. Identical usage, different events.'})
d.shot('missing','Offline · Missing metrics',{'missing-source':'Missing metrics.','missing-usage':'Every usage value is unavailable, not zero.','missing-window':'Unknown stays unknown.','missing-events':'And no event.'})
d.shot('handoff','Offline · Summary omits',{'handoff-sessions':'Summary omits, with the host summary handoff included. A new session starts from the original.',
 'handoff-summary':'The host-authored summary keeps report one and report three.','handoff-retained':'Report two was omitted.','handoff-answer':'So the new session answers without that fact. It only knows what the summary carried.'})
d.shot('live-disabled','Why the app stays offline',{'live-unavailable':'Run live is never available in the app for this lab.',
 'live-instructions':'The app keeps compaction as fixture evidence. So instead, we make the real calls from a small script in the terminal.'})
d.terminal('Live · Two turns, cumulative usage',[(l,'live-session' if l.startswith('Session sesn_') else 'live-usage1' if 'input 4 ·' in l else 'live-usage2' if 'input 8 ·' in l else 'live-grow' if l.startswith('Usage only grows') else None) for l in live[:split]],
 {'live-session':'The script creates one Managed session with no tools, using the existing agent and environment. It starts idle.',
  'live-usage1':'Turn one sends three fictional report facts. After it, the session usage reads four input tokens, sixty-four output tokens, and six hundred ninety-seven tokens written to the cache.',
  'live-usage2':'Turn two asks Claude to recall the facts. The usage only grew: eight input, one hundred six output, and the earlier six hundred ninety-seven now read from the cache.',
  'live-grow':'All input-side tokens went from seven hundred one to one thousand four hundred ninety. That is a running total across turns, not how full the context window is.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Events, compaction and unknowns',[(l,'live-events' if l.startswith('Events listed') else 'live-compact' if l.startswith('Compaction events') else 'live-unknown' if l.startswith('Context window') else 'live-archived' if l.startswith('Archived') else None) for l in live[split:]],
 {'live-events':'Next, the script lists the session events: twenty events of ten types, including two session usage snapshots.',
  'live-compact':'Compaction events observed: zero. A short session never compacted, and the script only reports what the stream contains.',
  'live-unknown':'The API exposes no context window, free context, or compaction threshold. So they stay unknown, never zero.',
  'live-archived':'Finally, the session was archived, and its final status is terminated.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the evidence prove?',[
 ('vs-event','EVENT','Observed, or not','The fixture shows one event;<br>the short live run shows none','The compacted fixture shows one event; the short live run showed none. Only an observed event proves compaction.'),
 ('vs-usage','USAGE','A running total','Live usage grew<br>from 701 to 1490 tokens','Live usage only grew across two turns. It is a total, not window occupancy.'),
 ('vs-unknown','UNKNOWN','Never zero','Window, free context and<br>threshold are not exposed','And offline or live, the window, the free context, and the threshold stay unknown.')],'Compaction proves occurrence only when its event is observed.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the compaction module to the replay runner.'),
 (3,'POST /run','Section three runs one replay scenario.'),
 (4,'Decision and early response','Section four handles the decision and the early response.'),
 (5,'Decision and early response','Section five completes the response.')])
d.mapping('Where is compaction?',[
 ('map-sdk','CLAUDE AGENT SDK','Automatic compaction','The SDK compacts history<br>and can emit a boundary','In the Agent SDK, long conversations are compacted automatically, with a compact boundary message.'),
 ('map-managed','CLAUDE MANAGED AGENTS','A thread event','agent.thread_context_compacted<br>in the session stream','Here, the session stream can include a thread context compacted event; the host only observes it.'),
 ('map-port','THIS PLATFORM','The Lab 25 replay','server/lib/lab25-compaction-context.ts','The code is in the Lab twenty-five compaction module.')],'Event observation and the summary handoff are in server/lib/lab25-compaction-context.ts.')
d.port('port-compaction','Source · Observe, then summarize',{'port-observe':'The host records an agent thread context compacted event only when it appears.','port-summary':'The summary for a new session is host-authored, and can omit facts.'})
d.knowledge('Finish with the knowledge check: what can a compaction event establish?','That compaction occurred. Observed provider events and host-authored summary handoffs are distinct.')
d.summary([('sum-observe','OBSERVE','Compaction events','Occurrence, not thresholds.','You can now treat a compaction event as proof of occurrence only.'),
 ('sum-measure','MEASURE','Unknown is unknown','Never zero.','Keep unavailable metrics distinct from zero.'),
 ('sum-handoff','HANDOFF','Summaries lose facts','Check what was kept.','And check what a summary handoff kept or lost.')],'Lab 26 · Session controls')
d.finish()
