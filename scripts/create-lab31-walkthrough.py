"""Lab 31 step-by-step walkthrough authored from real captures of the running platform (offline host question fixtures and one live terminal run where a real Managed agent asks the host a question through a custom tool)."""
from lab_video_common import Deck
d=Deck(31,'Lab 31 Step by Step: Host Questions and Correlated Answers, Offline and Live','Host questions');e=d.e
assert e['answeredStatus']=='answered; 1 correlated result(s).' and '"type": "user.custom_tool_result"' in e['resultEvent'] and '{\\"answer\\":\\"staging\\"}' in e['resultEvent']
assert e['invalid']=='Selected option is not in the stored question.' and e['invalidAnswer'].startswith('Answer: pending.')
assert 'Answer: Staging, then a read-only preview.' in e['custom'] and e['expired']=='expired; 0 correlated result(s).'
assert 'Live custom-tool execution is unavailable until a dedicated Managed agent is configured.' in e['nolive']
live=d.transcript('live.raw.txt');raw=chr(10).join(live);split=next(i for i,l in enumerate(live) if l.startswith('Questions answered'))
assert 'custom tool ask_user' in raw and 'options: dev, staging, production · allowCustom false' in raw and 'host answer (fixed, fictional human): staging' in raw
assert 'custom_tool_use_id sevt_013XDu••••••••RdxN · {"answer":"staging"}' in raw and 'stop_reason requires_action' in raw
assert 'Questions answered: 1 · requires_action pauses: 1 · stop: end_turn' in raw and "Final answer uses the host answer 'staging': yes" in raw
assert 'stale event ID (the live one) → refused 404: Question correlation does not match this run.' in raw
assert 'same event ID again → refused 409: Question is answered; no second result is accepted.' in raw and 'Session archived: yes' in raw
d.cover('CLAUDE MANAGED AGENTS · LAB 31 · HOST QUESTIONS','<h2>In this lab</h2><p>Pause on one bounded question.<br>Answer it once, by event ID.<br>Refuse invalid answers.<br>Let a question expire.</p>',
 'Welcome to Lab thirty-one, Host questions and correlated answers. In this lecture, you will start an offline question fixture, answer it with one valid choice, watch the host refuse an invalid choice, send allowed custom text, and let a question expire. The app itself stays offline, so we finish with a real terminal run, where a Managed agent asks the host a question through a custom tool.')
d.overview('ASK · ANSWER · CORRELATE','One human answer, one correlated result',[
 ('ov-concepts','1 · CONCEPTS','The paused question','A bounded question tied<br>to one event ID','First, the concepts: a paused custom tool call carries one bounded question, tied to one event ID.'),
 ('ov-offline','2 · OFFLINE','Answer, refuse, expire','A valid choice, an invalid one,<br>custom text and expiry','Second, the offline fixtures: a valid choice, an invalid choice, allowed custom text, and an expired question.'),
 ('ov-live','3 · LIVE','A real terminal run','A Managed agent asks;<br>the host answers by event ID','Third, a real terminal run: a Managed agent calls an ask user custom tool, and the host answers by event ID.'),
 ('ov-code','4 · CODE','Read the TypeScript','Correlation checks and<br>the one result event','Finally, the TypeScript code for the correlation checks and the single result event.')],
 'The result must reference the exact paused event ID, exactly once.')
d.shot('lesson','Open Lab 31',{'lesson-title':'Open Lab thirty-one, Host questions and correlated answers.','lesson-objective':'The objective: collect one human answer to a bounded host question, and correlate a single Managed custom tool result with the paused event ID.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: a host question with bounded options, one human answer, one Managed custom tool result, correlated to the paused event ID.'),
 (2,'Core rule','Region two, the core rule: the human answer tool result must reference the exact same paused event ID.'),
 (3,'Keep the boundary clear','Region three: one bounded question, one correlated result. No unrelated tool effects, and no extra results for the same question.'),
 (6,'Put it to the test','Region six: compare a partial or invalid answer with a complete, validated response.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start the deployment target fixture, and inspect the stored run, session and event IDs.'),
 (2,'Run the comparison','Step two: submit a valid choice, and inspect the one correlated result.'),
 (3,'Inspect the boundary','Step three: try an invalid choice, and confirm no result was sent.'),
 (4,'Follow the workflow','Step four: run allowed custom text, expiry, and cancellation while waiting.')])
d.shot('experiment','The question experiment',{'exp-rule':'Open Run the exercise. An authored agent dot custom tool use pauses on a closed ask user tool. The host stores one bounded question, and sends exactly one result tied to the event ID, after validating the human answer.',
 'exp-scenario':'Keep the deployment target scenario.','exp-start':'And select Start question.'})
d.shot('question','Offline · The stored question',{'question-ids':'The host stored a run ID, a session ID, and an event ID that starts with s e v t underscore.',
 'question-text':'The question: which fictional deployment target should the report use?','question-options':'Three closed options: development, staging and production.',
 'question-expiry':'The question has an expiry time, and custom text is not allowed here.'})
d.shot('answered','Offline · One correlated result',{'answered-answer':'Choose Staging, and select Submit answer. The answer is staging. Unrelated tool effects: zero. Provider calls: zero.',
 'answered-event':'The host built one user dot custom tool result event. Its custom tool use ID is the stored event ID, is error is false, and its text carries the answer, staging.',
 'answered-status':'The status: answered, one correlated result.'})
d.shot('invalid','Offline · An invalid answer',{'invalid-buttons':'Now start the invalid answer scenario, and select Try invalid answer. It sends an option the question never offered.',
 'invalid-status':'The host refuses: selected option is not in the stored question.','invalid-answer':'The answer stays pending, so no result was sent.'})
d.shot('custom','Offline · Allowed custom text',{'custom-allowed':'In the allowed custom text scenario, the question says custom text is allowed.',
 'custom-input':'Type a short custom answer: staging, then a read only preview.'})
d.shot('custom-answered','Offline · The custom answer',{'custom-answer':'Select Submit answer. The custom text becomes the answer.',
 'custom-event':'Again one result event, correlated to this question\'s own event ID.','custom-status':'Answered, one correlated result.'})
d.shot('expired','Offline · An expired question',{'expired-expiry':'The expiry scenario gives the question about one second.',
 'expired-status':'Let it pass, and select Wait for answer or expiry. The status is expired, zero correlated results.','expired-answer':'No answer was recorded, and nothing was sent.'})
d.shot('no-live','Why the app stays offline',{'no-live-note':'Every offline run reports provider calls: zero.',
 'no-live-text':'This lab has no Run live button. Live custom tool execution is unavailable until a dedicated Managed agent is configured, so the app makes no billed run. The app stays offline, and we now make the real calls from a small script in the terminal.'})
cue=lambda l,rules:next((c for c,f in rules if f(l)),None)
d.terminal('Live · A Managed agent asks the host',[(l,cue(l,[('la-cmd',lambda l:'_live31.ts' in l),('la-session',lambda l:l.startswith('Session sesn_')),
 ('la-ask',lambda l:l.startswith('#1 ')),('la-options',lambda l:l.strip().startswith('options:')),('la-result',lambda l:l.startswith('user.custom_tool_result')),
 ('la-pause',lambda l:l.startswith('session.status_idle'))])) for l in live[:split]],
 {'la-cmd':'Run the script with node, in the cloned repo.',
  'la-session':'One Managed session uses the existing agent, overriding its tools with one custom tool: ask user. Its input schema is the lab\'s own question shape. One user message asks for a release note, and tells the agent to ask for the deployment target first.',
  'la-ask':'The agent calls ask user. The tool use event has its own s e v t event ID.',
  'la-options':'The host validates the input with the lab schema: three closed options, dev, staging and production, and no custom text. A fixed, fictional human answers staging.',
  'la-result':'The host sends one user dot custom tool result, with custom tool use ID set to that exact event ID, and the answer staging.',
  'la-pause':'The stream also shows the session idle with stop reason requires action: it was waiting for the host.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · The answer is used, stale IDs are refused',[(l,cue(l,[('lb-count',lambda l:l.startswith('Questions answered')),('lb-final',lambda l:l.startswith('Final answer uses')),
 ('lb-archived',lambda l:l.startswith('Session archived')),('lb-stale',lambda l:'stale event ID' in l),('lb-again',lambda l:'same event ID again' in l)])) for l in live[split:]],
 {'lb-count':'The host answered one question, after one requires action pause, and the turn ended with end turn.',
  'lb-final':'The agent\'s final release note names staging, the host\'s answer.',
  'lb-archived':'The script archived the session.',
  'lb-stale':'Then, locally and with no API call, the lab\'s own question store gets an answer carrying the live event ID, which does not match its stored question. Refused, four oh four: question correlation does not match this run.',
  'lb-again':'The matching event ID is accepted once. The same event ID again is refused, four oh nine: no second result is accepted.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','Same correlation, real agent',[
 ('vs-question','QUESTION','Bounded options','Offline fixture and live agent:<br>dev, staging, production','Offline, the question was authored. Live, the agent wrote it, and the lab schema checked the same closed options.'),
 ('vs-result','RESULT','One result per event ID','user.custom_tool_result<br>with the paused event ID','Offline and live, the answer went back as one custom tool result, with the paused event ID.'),
 ('vs-refuse','REFUSE','Wrong or repeated IDs','404 for a foreign ID,<br>409 for a second answer','A foreign event ID and a second answer were both refused by the lab\'s own code.')],'The agent used the human answer only because the result matched its paused event.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the question store and its schemas to the routes.'),
 (3,'POST /run','Section three starts an offline question for the selected scenario.'),
 (5,'POST /answer','Section five validates a correlated answer, and returns the one result.'),
 (6,'POST /tools','Section six handles inspect, cancel and wait for answer or expiry.')])
d.mapping('Who asks the human?',[
 ('map-sdk','CLAUDE AGENT SDK','AskUserQuestion','A built-in tool, answered<br>in the canUseTool callback','In the Agent SDK, the agent asks with the built-in Ask User Question tool, and your app answers in the can use tool callback.'),
 ('map-managed','CLAUDE MANAGED AGENTS','A custom ask_user tool','agent.custom_tool_use, then<br>user.custom_tool_result','This platform uses Managed Agents beta sessions, not the Agent SDK. The agent calls a custom tool, the session pauses, and the host sends a custom tool result with the same event ID.'),
 ('map-port','THIS PLATFORM','The Lab 31 question store','server/lib/lab31-questions.ts','The code is in the Lab thirty-one questions module.')],'Correlation, validation and the single result are in server/lib/lab31-questions.ts.')
d.port('port-answer','Source · Correlate before accepting',{'port-correlate':'An answer must match the stored session ID and event ID, or it is refused with four oh four.',
 'port-once':'A question that is no longer pending accepts no second result: four oh nine.','port-option':'And a selected option must be one of the stored options.'})
d.port('port-result','Source · The one result event',{'port-custom':'Custom text is accepted only when the question allows it, up to two hundred characters.',
 'port-event':'The result is a user dot custom tool result whose custom tool use ID is the stored event ID.',
 'port-record':'The host records the answer, sets the result count to one, and finishes the question as answered.'})
d.knowledge('Finish with the knowledge check: what must a human answer tool result reference?','The result must correlate once to the bounded paused question.')
d.summary([('sum-question','QUESTION','Bounded and stored','Closed options, one event ID.','You can now pause on one bounded host question, stored with its event ID.'),
 ('sum-result','RESULT','One correlated result','custom_tool_use_id = event ID.','Send exactly one custom tool result that references that event ID.'),
 ('sum-refuse','REFUSE','Invalid, stale or repeated','No result is sent.','And refuse invalid choices, foreign IDs, repeated answers and expired questions.')],'Lab 32 · Plan review and execution gate')
d.finish()
