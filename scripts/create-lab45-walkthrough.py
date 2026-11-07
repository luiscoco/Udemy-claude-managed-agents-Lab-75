"""Lab 45 step-by-step walkthrough authored from real captures of the running platform (offline: an authored provider catalog and a
loopback emulator; live: a small script that runs the lab's own provider resolution and proves the first-party Claude API path with
read-only lookups and one short session turn. The AWS path is explained, not exercised: no AWS call is made)."""
from lab_video_common import Deck,card,head
d=Deck(45,'Lab 45 Step by Step: Provider Availability and Configuration, Offline and Live','Production and deployment');e=d.e
assert e['liveButtons']==0 and e['targets']==['claude-api','claude-platform-aws','bedrock','vertex','foundry']
assert e['scenarios']==['ready','bad-auth','model-mismatch','missing-config','missing-feature']
assert e['start']=='Ready. Catalog facts and emulator requests never contact a cloud provider.' and e['status_catalog']=='5 provider paths cataloged from official documentation.'
assert e['same_claude-api']=='Installed first-party Managed session types verified.' and e['same_vertex']=='Messages support does not imply Managed sessions.'
assert e['same_claude-platform-aws']=='Installed AWS Managed client verified locally; only read-only resource preflight is available here.'
assert e['status_pre-claude-api-ready']=='ready: Synthetic loopback preflight passed.' and 'Session created: false. Provider calls: 0.' in e['pre-claude-api-ready']
assert e['status_pre-claude-api-bad-auth']=='refused: Synthetic preflight refused with HTTP 401.' and e['status_pre-claude-api-model-mismatch']=='refused: Synthetic preflight refused with HTTP 400.'
assert e['status_pre-claude-api-missing-feature']=='refused: Required Managed feature missing from selected target.'
assert e['status_pre-claude-platform-aws-ready'].startswith('refused: AWS model-session route disabled') and 'Managed route enabled: false.' in e['pre-claude-platform-aws-ready']
assert e['status_pre-bedrock-ready']=='refused: Messages provider path does not establish Managed session support.'
assert 'No cloud account, deployment or billable test starts automatically.' in e['nolive'] and e['awsDisabled'] is True
assert e['awsSetup'].startswith('Setup required. Set LAB45_AWS_LIVE_ENABLED=1. Missing: ANTHROPIC_AWS_API_KEY')
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'first-party configured yes · SDK Managed types yes · providerCalls 0' in L and 'Managed route enabled: claude-api' in L
assert 'Resolved provider: Direct Claude API · auth: Server-side Anthropic API key · model: claude-opus-5-5' in L
assert "models.retrieve('claude-opus-5-5') → \"Claude Opus 5.5\" · lifecycle active" in L and 'configured model listed: yes' in L
assert 'version 1 · model claude-opus-5-5 · archived no' in L and '→ cloud · networking limited · archived no' in L
assert 'agent.message 1' in L and 'Archived: yes · final status terminated' in L
assert 'LAB45_AWS_LIVE_ENABLED no · fields present 0/5 · ready no' in L and 'setup incomplete and NOT exercised · checkAwsResources() not called · AWS requests 0' in L
assert 'First-party API calls in this run: 14 · Lab45Providers provider calls: 0' in L
split=next(i for i,l in enumerate(live) if l.startswith('Session sesn_'))
d.cover('CLAUDE MANAGED AGENTS · LAB 45 · PRODUCTION AND DEPLOYMENT','<h2>In this lab</h2><p>Read the provider catalog.<br>Messages is not Managed.<br>Preflight with no cloud.<br>Prove the real route.</p>',
 'Welcome to Lab forty-five, Provider availability and configuration. In this lecture, you will separate documented Managed Agents availability, installed client verification and Messages API support, before choosing a provider path. The app stays offline with a loopback emulator, and then a small script resolves the provider with the lab\'s own code and proves the first-party Claude API path, live.')
d.overview('CATALOG · COMPARE · PREFLIGHT','Messages access is not Managed support',[
 ('ov-catalog','1 · CATALOG','Five provider paths','Documented, verified, enabled:<br>three separate facts','First, the dated capability catalog: five provider paths, each with three separate facts, documented, client verified, and route enabled.'),
 ('ov-compare','2 · COMPARE','Messages versus Managed','Name similarity proves nothing','Second, comparing Messages support with Managed session support, for the direct API, AWS, and the cloud Messages providers.'),
 ('ov-preflight','3 · PREFLIGHT','A loopback emulator','Synthetic credential;<br>no provider call','Third, synthetic preflights against a loopback emulator: ready, bad auth, model mismatch, and a missing feature.'),
 ('ov-live','4 · LIVE AND CODE','Prove the real route','Read-only checks and one turn;<br>AWS explained, not called','Finally, a live terminal run on the first-party Claude API, an explanation of the AWS path, and the TypeScript code behind the catalog.')],
 'Provider paths require product-specific evidence rather than name similarity.')
d.shot('lesson','Open Lab 45',{'lesson-title':'Open Lab forty-five, Provider availability and configuration.','lesson-objective':'The objective: separate documented Managed Agents availability, installed client verification, and Messages API support, before choosing a provider path.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: separate documented availability, installed client verification, and Messages API support.'),
 (2,'Core rule','Region two, the core rule: does Messages API support prove Managed support? No. Verify documented availability and the installed client.'),
 (3,'Keep the boundary clear','Region three: provider paths require product-specific evidence, rather than name similarity.'),
 (6,'Put it to the test','Region six: identify a preflight check that catches an unsupported provider path.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: load the dated official capability catalog, and compare the direct Claude API with Claude Platform on AWS.'),
 (2,'Run the comparison','Step two: inspect the Bedrock, Vertex and Foundry Messages paths, without inferring Managed sessions.'),
 (3,'Inspect the boundary','Step three: run synthetic ready, and auth, model and config mismatch cases, against the loopback emulator.'),
 (4,'Follow the workflow','Step four: compare a passed emulator wire check with a disabled AWS Managed route.')])
d.shot('experiment','The provider experiment',{'exp-rule':'Open Run the exercise. Managed session support differs from Messages API access. The direct Claude API is the installed baseline, and Claude Platform on AWS is documented separately.',
 'exp-catalog':'Load capability catalog reads the dated provider catalog.','exp-target':'The Target select chooses one of five provider paths, for Compare APIs.',
 'exp-mismatch':'The Offline mismatch select picks a synthetic preflight scenario.','exp-status':'The status line promises that catalog facts and emulator requests never contact a cloud provider.'})
d.shot('same-direct','Offline · Compare the direct Claude API',{'same-direct-target':'Choose claude API, and select Compare APIs.',
 'same-direct-status':'Installed first-party Managed session types verified. This is the one enabled Managed route.'})
d.shot('same-aws','Offline · Compare Claude Platform on AWS',{'same-aws-target':'Now choose claude platform aws, and compare again.',
 'same-aws-status':'The AWS Managed client is verified locally, but only a read-only resource preflight is available here.'})
d.shot('same-vertex','Offline · Compare Vertex AI',{'same-vertex-target':'Then choose vertex.',
 'same-vertex-status':'Messages support does not imply Managed sessions.'})
d.shot('catalog','Offline · The documented provider catalog',{'catalog-direct':'Select Load capability catalog. Five provider paths are cataloged. The direct Claude API: Messages true, Managed documented true, installed client verified true, and route enabled true. It needs an agent ID, an environment ID, a live opt-in, and a budget and deadline.',
 'catalog-aws':'Claude Platform on AWS is documented and its client is verified, but its route is disabled. It needs a workspace, a regional endpoint, and IAM authorization, and this lesson launches no AWS model sessions.',
 'catalog-bedrock':'Amazon Bedrock has Messages, but Managed documented is false. A Messages client is not evidence of Managed session support. Vertex and Foundry read the same way.'})
d.shot('pre-ready','Offline · Loopback preflight, ready',{'pre-ready-target':'Choose claude API with the ready scenario, and select Run loopback preflight. Status ready, emulator HTTP two hundred.',
 'pre-ready-endpoint':'The endpoint is loopback, the credential is redacted, and the model is claude synthetic.','pre-ready-calls':'Session created: false. Provider calls: zero.',
 'pre-ready-evidence':'The host evidence says it plainly: HTTP two hundred is emulator evidence only.'})
d.shot('pre-badauth','Offline · Bad authentication',{'pre-badauth-mismatch':'Now choose bad auth.','pre-badauth-target':'The emulator answers HTTP four oh one.',
 'pre-badauth-status':'The preflight is refused, before any session exists.'})
d.shot('pre-model','Offline · Model mismatch',{'pre-model-mismatch':'Choose model mismatch.','pre-model-target':'The emulator answers HTTP four hundred.',
 'pre-model-status':'Refused again: the wrong model name fails the preflight.'})
d.shot('pre-feature','Offline · Missing Managed feature',{'pre-feature-mismatch':'Choose missing feature.','pre-feature-target':'This time the wire check passes with HTTP two hundred.',
 'pre-feature-status':'But the status is refused: a required Managed feature is missing from the selected target. A passing wire check is not enough.'})
d.shot('pre-aws','Offline · AWS: wire passes, route disabled',{'pre-aws-target':'Now choose claude platform aws, ready. The wire check passes with HTTP two hundred, but the status is refused.',
 'pre-aws-endpoint':'Managed route enabled: false.','pre-aws-status':'The AWS model session route is disabled. Account access stays unverified until an explicit read-only preflight.'})
d.shot('pre-bedrock','Offline · Bedrock: Messages only',{'pre-bedrock-target':'Finally, bedrock, ready: refused, although the emulator answered two hundred.',
 'pre-bedrock-evidence':'The catalog says Managed documented false, and installed client verified false.','pre-bedrock-status':'A Messages provider path does not establish Managed session support.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: there is no Run live button, and no cloud account, deployment or billable test starts automatically.',
 'no-live-aws':'The official AWS client is installed. An explicit check would read two existing resources, and create no model session.',
 'no-live-setup':'Here, the AWS setup is required: LAB45_AWS_LIVE_ENABLED is not set, and all five AWS fields are missing.',
 'no-live-button':'So the AWS check button is disabled. Next, we make the real first-party calls from a small script, in the terminal of the project.'})
lv1={'lv-facts':'The script runs with node and t s x, and imports the lab\'s own Lab45Providers class. Its facts: first-party configured yes, S D K Managed types yes, and provider calls zero.',
 'lv-resolved':'The catalog enables only one Managed route, claude API. So the resolved provider is the direct Claude API, with a server-side Anthropic API key, and the model claude opus five point five.',
 'lv-model':'Now the real read-only checks. Models dot retrieve finds Claude Opus five point five, lifecycle active, and models dot list includes it.',
 'lv-agent':'Agents dot retrieve returns the configured agent: version one, the same model, not archived.',
 'lv-env':'Environments dot retrieve returns a cloud environment, with limited networking, not archived.'}
d.terminal('Live · Resolve the provider, check resources',[(l,'lv-facts' if l.startswith('Lab45Providers.facts') else 'lv-resolved' if l.startswith('Resolved provider') else 'lv-model' if l.startswith('models.retrieve') else 'lv-agent' if l.startswith('agents.retrieve') else 'lv-env' if l.startswith('environments.retrieve') else None) for l in live[:split]],lv1,note='LIVE RUN · IDS PARTLY HIDDEN')
lv2={'lv-turn':'A documented route is not yet a proven one. The script creates one session with no tools, and sends one short Aurora Finch field note request. The session is idle again after seven seconds, with one agent message.',
 'lv-archived':'The session is archived in the same run: final status terminated.',
 'lv-aws-ready':'Then the AWS path, checked locally only: LAB45_AWS_LIVE_ENABLED is no, zero of five fields are present, ready no.',
 'lv-aws-not':'So the AWS path is not exercised: check AWS resources is never called, and AWS requests are zero.',
 'lv-calls':'In total, fourteen first-party API calls, and the Lab45Providers class itself still made zero provider calls.'}
d.terminal('Live · One real turn, AWS not exercised',[(l,'lv-turn' if l.startswith('Turn 1') else 'lv-archived' if l.startswith('Archived:') else 'lv-aws-ready' if l.startswith('claude-platform-aws: LAB45') else 'lv-aws-not' if 'NOT exercised' in l else 'lv-calls' if l.startswith('First-party API calls') else None) for l in live[split:]],lv2,note='LIVE RUN · IDS PARTLY HIDDEN')
aws=[('aws-enable','1 · ENABLE','Opt in, then set five fields','LAB45_AWS_LIVE_ENABLED=1;<br>key, workspace, region,<br>agent and environment IDs','If you enable the AWS path, you set LAB45_AWS_LIVE_ENABLED to one, plus five fields: the AWS-specific API key, the workspace ID, the region, and an AWS agent and environment ID. awsReadiness checks that they are present and well formed.'),
 ('aws-check','2 · CHECK','Two read-only lookups','AWS client, regional endpoint;<br>agents.retrieve and<br>environments.retrieve, 5 s each','Then Check AWS resources becomes enabled. The official AWS client calls the regional endpoint, and runs two read-only lookups, agents dot retrieve and environments dot retrieve, with five-second timeouts and no retries.'),
 ('aws-result','3 · RESULT','Still no model session','Resources accessible, 2 lookups;<br>session created false;<br>model run unverified','The result can only say the resources are accessible, after two lookups. No session is created, the model run stays unverified, and the AWS Managed route stays disabled in this lesson.')]
d.add('Explained · The AWS path, when enabled',head('EXPLAINED LIVE PATH · NO AWS CALL IN THIS VIDEO','How the AWS check would run')+'<div class="grid three">'+''.join(card(cid,t,h,b) for cid,t,h,b,_ in aws)+'</div><div class="banner">Explained, not exercised: this video made no AWS request and used no AWS credential.</div>',[(cid,n) for cid,_,_,_,n in aws])
d.compare('Offline and live, compared','What did the real API prove?',[
 ('vs-resolve','RESOLVE','The same catalog','One enabled Managed route:<br>claude-api, in both runs','Offline and live, the same Lab45Providers catalog resolves one enabled Managed route: the direct Claude API.'),
 ('vs-proof','PROOF','Emulator versus real API','HTTP 200 on loopback;<br>a real model, agent, environment<br>and one real turn','Offline, a loopback two hundred is emulator evidence only. Live, the real API returned the model, the agent and the environment, and completed one turn.'),
 ('vs-aws','AWS','Documented, not proven','Route disabled offline;<br>zero AWS requests live','The AWS path stays documented but unproven: its route is disabled in the app, and the live run made zero AWS requests.')],'Availability is proven per provider, with that provider\'s own client and resources.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the router to the Lab forty-five schemas and the Lab45Providers class.'),
 (3,'POST /aws/check','Section three, post slash aws slash check, takes no fields, and runs the read-only AWS resource check.'),
 (5,'POST /catalog','Section five, post slash catalog, returns the dated provider catalog.'),
 (6,'POST /same','Section six, post slash same, validates a target, and returns its Messages versus Managed distinction.')])
d.mapping('Where does the provider choice live?',[
 ('map-sdk','CLAUDE AGENT SDK','Provider environment flags','Your process picks Bedrock,<br>Vertex or Foundry for the model','In the Agent SDK, your own process runs the agent loop, and environment flags choose which provider serves the model calls.'),
 ('map-managed','CLAUDE MANAGED AGENTS','A hosted Managed route','Sessions need a platform<br>that documents Managed Agents','This platform uses Managed Agents beta sessions, not the Agent SDK. The agent loop runs on the platform, so a provider must document Managed sessions, not just Messages.'),
 ('map-port','THIS PLATFORM','The Lab 45 catalog','server/lib/lab45-providers.ts','Here, the Lab forty-five catalog records those facts for each provider, and enables only the verified route.')],'No Agent SDK provider flags are used: the catalog is in server/lib/lab45-providers.ts.')
d.port('port-catalog','Source · Three facts per provider',{'port-direct':'The direct Claude API: Messages, Managed documented, installed client verified, and route enabled, all true.',
 'port-aws':'Claude Platform on AWS is documented, and its client is checked locally, but its route is not enabled.','port-bedrock':'Bedrock has Messages, but Managed documented is false.'})
d.port('port-facts','Source · Host-only facts',{'port-check-aws':'The AWS check calls checkAwsResources, and maps any failure to a safe message.',
 'port-first-party':'Facts report whether the first-party API is configured and live ready.','port-aws-setup':'And the AWS setup, from awsReadiness, with provider calls zero and no auto-provisioning.'})
d.port('port-emulate','Source · The loopback emulator',{'port-auth':'The emulator compares a synthetic bearer token, and answers four oh one on a mismatch.',
 'port-loopback':'It listens only on the loopback address, on a free port.','port-refused':'A disabled route, or a missing feature, is refused, whatever the wire check says.'})
d.knowledge('Finish with the knowledge check: does Messages API support prove Managed support?','No. Provider paths require product-specific evidence, rather than name similarity.')
d.summary([('sum-catalog','CATALOG','Three separate facts','Documented, verified, enabled.','You can now read a provider catalog as three separate facts: documented, client verified, and route enabled.'),
 ('sum-preflight','PREFLIGHT','Wire checks are not proof','A loopback 200 is emulator evidence.','You know that a passing wire check is not proof of Managed support.'),
 ('sum-live','LIVE','Prove the route you use','Real lookups and one real turn.','And you prove the route you actually use, with real read-only lookups and one short turn, while other paths stay explained, not assumed.')],'Lab 46 · Observed cache usage and cost')
d.finish()
