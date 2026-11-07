"""Lab 44 step-by-step walkthrough authored from real captures of the running platform (offline: authored host span fixtures; live: a small script that turns the real events of one Managed Agents turn into redacted host spans, kept local)."""
from lab_video_common import Deck,head,card
d=Deck(44,'Lab 44 Step by Step: Host Telemetry and Provider Event Traces, Offline and Live','Production and deployment');e=d.e
assert e['liveButtons']==0 and e['scenarios']==['successful-tool','denied-tool','failed-tool','missing-provider-span']
assert e['ready']=='Ready. Fictional prompt/tool content is redacted by default.' and e['nolive']=='Claude Code child telemetry environment settings do not apply to the cloud Managed harness.'
assert e['status_success']=='5 host spans; 2 provider event fixtures; effects 1.' and e['calls'].endswith('Effect count: 1. Provider calls: 0.')
assert e['status_denied']=='4 host spans; 2 provider event fixtures; effects 0.' and 'decision=deny' in e['denied']
assert e['status_failed']=='5 host spans; 2 provider event fixtures; effects 0.' and 'host.custom-tool (error)' in e['failed']
assert e['status_missing']=='5 host spans; 0 provider event fixtures; effects 1.' and 'No provider model-span signal observed in this fixture.' in e['missing']
assert 'fictional.prompt=Count fictional Aurora Finches.' in e['record'] and 'Fictional content recorded: true.' in e['record'] and 'Explicit fictional content recording enabled.' in e['record']
assert '"rejectedBatches":0' in e['collector'] and '"transport":"loopback-otlp-json"' in e['collector'] and e['exportDisabled']==[True,True]
assert e['remoteSetup']=='Setup required. Set LAB44_REMOTE_EXPORT_ENABLED=1. Missing: LAB44_OTLP_ENDPOINT. Invalid: none.'
assert e['azureSetup']=='Setup required. Set LAB44_AZURE_EXPORT_ENABLED=1. Missing: APPLICATIONINSIGHTS_CONNECTION_STRING. Invalid: none.'
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'events.list: 10 events · span.model_request_start 1 · span.model_request_end 1 · session.usage 1' in L and '4 host spans checked by lab44SpanSchema' in L
assert 'provider.model_request span' in L and '1.92 s · input 4 · output 110 tokens' in L and 'equals the model_request_end sum: yes' in L
assert 'not in any span attribute' in L and 'no span attribute contains the prompt or reply text: yes' in L
assert 'Lab44Collector (127.0.0.1, OTLP HTTP JSON): 4 spans · rejected batches 0' in L and 'Remote OTLP ready: no · Azure Monitor ready: no' in L and 'nothing exported' in L
assert 'Archived: yes · final status terminated' in L
split=next(i for i,l in enumerate(live) if l.startswith('Redaction:'))
d.cover('CLAUDE MANAGED AGENTS · LAB 44 · PRODUCTION AND DEPLOYMENT','<h2>In this lab</h2><p>Follow one trace ID.<br>Compare effect counts.<br>Keep provider events separate.<br>Redact content by default.</p>',
 'Welcome to Lab forty-four, Host telemetry and provider event traces. In this lecture, you will follow host OpenTelemetry spans across one trace, compare denied and failed tools against the effect count, keep Managed model-span events as separate provider evidence, and keep prompt content redacted by default. The app stays offline, and then a small script turns the events of a real Managed Agents turn into host spans, live.')
d.overview('TRACE · COMPARE · REDACT','Host spans and provider events are different evidence',[
 ('ov-concepts','1 · CONCEPTS','Host spans','One trace ID, parent IDs,<br>a bounded loopback collector','First, the concepts: host spans share one trace ID, link through parent IDs, and go to a bounded loopback collector.'),
 ('ov-cases','2 · CASES','Four trace fixtures','Successful, denied, failed,<br>missing provider span','Second, four offline fixtures: a successful tool, a denied tool, a failed tool, and a missing provider model span.'),
 ('ov-live','3 · LIVE','A real turn as a trace','Real events become spans;<br>nothing leaves the machine','Third, a live terminal run: the real events of one Managed turn become host spans, printed to the console, and nothing is exported.'),
 ('ov-code','4 · CODE','The exporter rules','TypeScript in<br>lab44-telemetry.ts','Finally, the TypeScript code: the bounded collector, redaction, and the guarded remote export.')],
 'Collector acceptance never turns host spans into provider model traces.')
d.shot('lesson','Open Lab 44',{'lesson-title':'Open Lab forty-four, Host telemetry and provider event traces.','lesson-objective':'The objective: correlate redacted host spans with separately labeled Managed model-span event evidence, and with effect counts.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: correlate redacted host spans with separately labeled Managed model-span evidence.'),
 (2,'Core rule','Region two, the core rule: exported fixture spans are labeled as authored host spans, separate from provider traces.'),
 (3,'Keep the boundary clear','Region three: collector acceptance does not transform host fixtures into provider model traces.'),
 (6,'Put it to the test','Region six: compare denied and executed actions in the host trace and the effect ledger.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run a successful tool fixture, and follow trace and parent IDs across the spans.'),
 (2,'Run the comparison','Step two: compare the denied and failed tool cases against the effect count and the host decisions.'),
 (3,'Inspect the boundary','Step three: inspect a missing provider model span, without inferring that no model activity occurred.'),
 (4,'Follow the workflow','Step four: opt in to fictional content recording, and compare the attributes with the default redacted run.')])
d.shot('experiment','The tracing experiment',{'exp-rule':'Open Run the exercise. A host exporter sends OTLP JSON spans to a bounded loopback collector. Managed model-span events are separate provider evidence.',
 'exp-scenario':'Choose an offline scenario: successful tool, denied tool, failed tool, or missing provider span.','exp-record':'Record fictional content is off by default, so content stays redacted.',
 'exp-run':'Run trace fixture builds the authored host spans for the chosen scenario.'})
d.shot('success','Offline · One trace, five host spans',{'success-ids':'Run the successful tool fixture. It names a fixture session, thread, and tool event.',
 'success-collector':'The collector holds five of one hundred twenty-eight spans, with zero rejected batches. Effect count: one. Provider calls: zero.',
 'success-root':'The root span is express dot request, with no parent. Every span shares this trace ID.',
 'success-tool':'The host custom tool span has the approval span as its parent, and records effect equals one.'})
d.shot('provider','Offline · Provider events stay separate',{'provider-events':'Below, the provider event evidence: a span dot model request start, and a model request end that points back to its start ID. Both are authored fixtures.',
 'provider-remote':'Remote OTLP export observed: false. Fictional content recorded: false.',
 'provider-evidence':'The evidence says it plainly: these provider records are not host spans, and they are correlated only as event evidence.','provider-status':'Five host spans, two provider event fixtures, and one effect.'})
d.shot('denied','Offline · A denied tool',{'denied-collector':'Now the denied tool case. The effect count is zero.',
 'denied-approval':'The approval wait span has status error, with decision equals deny.','denied-cleanup':'There is no custom tool span: the trace goes straight to cleanup, with four host spans.'})
d.shot('failed','Offline · A failed tool',{'failed-collector':'The failed tool case also has an effect count of zero.',
 'failed-tool':'But here the custom tool span exists, with status error, and effect equals zero. Denied and failed look different in the trace.'})
d.shot('missing','Offline · A missing provider span',{'missing-none':'In the missing provider span case, no provider model-span signal is observed.',
 'missing-evidence':'The evidence names it: no signal in this fixture. That does not prove that no model activity occurred.','missing-status':'The host still has five spans, and one effect.'})
d.shot('record','Offline · Opt in to content recording',{'record-tool':'Check Record fictional content, and run again. Now the custom tool span carries a fictional prompt attribute.',
 'record-remote':'Fictional content recorded: true.','record-evidence':'And the evidence says: explicit fictional content recording enabled.','record-status':'The run itself is the same: five spans and one effect. Then we uncheck it again.'})
d.shot('collector','Offline · Inspect the collector',{'collector-status':'Inspect collector shows the bounded store: twenty-four of one hundred twenty-eight spans, zero rejected batches, over loopback OTLP JSON.'})
d.shot('setup','Offline · Remote and Azure setup',{'setup-remote':'Remote collector setup: setup required. It needs LAB44 underscore REMOTE underscore EXPORT underscore ENABLED, and an OTLP endpoint.',
 'setup-remote-btn':'So Export redacted host trace stays disabled.',
 'setup-azure':'Azure Monitor setup also needs its enable setting, and an Application Insights connection string.','setup-azure-btn':'Its export button is disabled too. We never click either one in this video.'})
d.shot('no-live','The app stays offline',{'no-live-ready':'The app stays offline in this lab: there is no Run live button, every snapshot reports zero provider calls, and content is redacted by default.',
 'no-live-text':'Claude Code child telemetry settings do not apply to the cloud Managed harness. So now we make the real calls from a small script, in the terminal of the project: one real turn, turned into host spans.'})
d.terminal('Live · One real turn becomes a trace',[(l,'lv-session' if l.startswith('Session ') else 'lv-events' if l.startswith('One user turn') else 'lv-trace' if l.startswith('Trace ') else 'lv-model' if 'provider.model_request' in l else 'lv-root' if 'managed.session.turn' in l else None) for l in live[:split]],
 {'lv-session':'The script removes every LAB44 and Application Insights setting from its own process, then creates one session with no tools.',
  'lv-events':'One short user turn runs to idle. Events dot list returns ten events: one model request start, one model request end, and one session dot usage.',
  'lv-trace':'The host builds one trace, with four spans, each one checked by the lab\'s own span schema.',
  'lv-root':'The root span covers the whole turn: two point zero two seconds, stop reason end turn.',
  'lv-model':'The provider model request span comes from the real start and end events: one point nine two seconds, four input and one hundred ten output tokens. It is labeled as provider event evidence.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Redacted, and kept local',[(l,'lv-redact' if l.startswith('Redaction:') else 'lv-usage' if l.startswith('session.usage') else 'lv-loopback' if l.startswith('Lab44Exporter') else 'lv-nothing' if l.startswith('Remote OTLP ready') else 'lv-archived' if l.startswith('Archived') else None) for l in live[:1]+live[split:]],
 {'lv-redact':'The prompt, eighty-nine characters, and the reply, three hundred two characters, are not in any span attribute. A check confirms it.',
  'lv-usage':'Session dot usage reports four input and one hundred ten output tokens, equal to the sum of the model request end events.',
  'lv-loopback':'The lab\'s own exporter sends the four spans to the lab\'s loopback collector, inside this process, with zero rejected batches.',
  'lv-nothing':'Remote OTLP ready: no. Azure Monitor ready: no. Nothing was exported anywhere.',
  'lv-archived':'Finally, the session is archived, and its status is terminated.'},note='LIVE RUN · IDS PARTLY HIDDEN')
explained=[('ex-enable','1 · ENABLE','Opt in on the server','LAB44_AZURE_EXPORT_ENABLED=1<br>+ connection string, or<br>LAB44_REMOTE_EXPORT_ENABLED=1<br>+ https OTLP endpoint',
  'The explained live path: nothing exports by default. To export, you enable it in the server settings: LAB44 underscore AZURE underscore EXPORT underscore ENABLED with an Application Insights connection string, or the remote setting with an https OTLP endpoint.'),
 ('ex-click','2 · CLICK','Export on purpose','One explicit click per run;<br>a repeated export is not resent',
  'Then the export starts only on your explicit click, once per run. Readiness is checked first, and a repeat is not sent twice.'),
 ('ex-send','3 · SEND','Metadata only','Allowlisted attributes, no content,<br>no provider event records',
  'The same host spans are sent: the remote exporter keeps only allowlisted IDs and decisions, and the Azure Monitor exporter sends span metadata, never the recorded content or the provider event records. We did not run this path here.')]
d.add('The explained live path · Azure Monitor and OTLP',head('EXPLAINED · NOT RUN IN THIS VIDEO','How the same spans would leave the host')+'<div class="grid three">'+''.join(card(cid,t,h,b) for cid,t,h,b,_ in explained)+'</div><div class="banner">Collector acceptance confirms delivery of host spans, never a provider model trace.</div>',[(cid,n) for cid,_,_,_,n in explained])
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-source','SOURCE','Authored vs real events','Fixture spans are authored;<br>live spans come from events.list','Offline, every span and provider record is an authored fixture. Live, the spans were built from the real events of one session.'),
 ('vs-provider','PROVIDER','Still separate evidence','Model request start and end<br>give timing and tokens','In both, provider model-span events stay separate evidence. Live, they carried real timing and token counts, matching session dot usage.'),
 ('vs-redact','REDACT','Content stays out','No prompt or reply in spans;<br>nothing exported','And in both, content is redacted by default. The live spans held no prompt or reply text, and stayed on the loopback collector.')],'The span schema, exporter and collector are the same code: the live script imports them from the app.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect this module to the Lab forty-four schemas and the telemetry class.'),
 (3,'POST /export-remote','Section three, post slash export remote, validates one owned run ID, and asks the manager for a remote export.'),
 (5,'POST /export-azure','Section five, post slash export azure, does the same for the Azure Monitor exporter.'),
 (6,'POST /privacy','Section six, post slash privacy, turns fictional content recording on or off for one owner.')])
d.mapping('Where do the traces come from?',[
 ('map-sdk','CLAUDE AGENT SDK','Local OpenTelemetry','Your process runs the agent<br>loop and emits its own spans','In the Agent SDK, the agent loop runs in your own process, so your process can emit spans for every step.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Provider events','span.model_request_start/end<br>and session.usage in events.list','This platform uses Managed Agents beta sessions, not the Agent SDK. The loop runs in the cloud. The host sees model request start and end events, and session usage, in the event history.'),
 ('map-port','THIS PLATFORM','The Lab 44 telemetry class','server/lib/lab44-telemetry.ts','Here, the Lab forty-four telemetry class builds host spans, exports them to a bounded loopback collector, and guards any remote export.')],'Host spans describe the host; provider events describe the Managed session. Keep both labeled.')
d.port('port-collector','Source · A bounded loopback collector',{'port-bound':'The collector rejects an empty batch, more than twenty spans, more than one hundred twenty-eight in total, or malformed trace and span IDs.',
 'port-loopback':'It listens only on one two seven dot zero dot zero dot one.','port-timeout':'And the exporter refuses redirects, with a two second timeout.'})
d.port('port-run','Source · Redaction by default',{'port-record':'Content is recorded only when the owner explicitly opted in.',
 'port-redact':'Only then does the custom tool span get the fictional prompt attribute.','port-export':'The spans are then exported to the loopback collector.'})
d.port('port-remote','Source · The guarded remote export',{'port-ready':'A remote export is refused until the remote setup is enabled and valid.',
 'port-allow':'Only allowlisted attributes are kept: route, session, thread and event IDs, decision and effect.','port-otlp':'Then the exporter posts them to the configured OTLP endpoint.'})
d.knowledge('Finish with the knowledge check: how should exported fixture spans be labeled?','As authored host spans, separate from provider traces. Collector acceptance does not transform host fixtures into provider model traces.')
d.summary([('sum-trace','TRACE','Follow one trace','Trace and parent IDs.','You can now follow one trace across host spans, using trace and parent IDs.'),
 ('sum-effects','EFFECTS','Compare outcomes','Denied, failed, effect count.','You can tell a denied tool from a failed tool, by the spans and the effect count.'),
 ('sum-labels','LABELS','Keep evidence labeled','Provider events stay separate.','And you keep provider events labeled separately, with content redacted, and export only on purpose.')],'Lab 45 · Provider availability and configuration')
d.finish()
