"""Lab 16 step-by-step walkthrough authored from real captures of the running platform (offline provenance fixtures and one live file-mount session)."""
from lab_video_common import Deck
d=Deck(16,'Lab 16 Step by Step: Environment and Configuration Provenance, Offline and Live','Configuration provenance');e=d.e
assert 'Source: managed-api' in e['live'] and 'Observed mount: listed' in e['live'] and 'Outcome: completed' in e['live'] and 'Cleanup: archived' in e['live']
d.cover('CLAUDE MANAGED AGENTS · LAB 16 · CONFIGURATION PROVENANCE','<h2>In this lab</h2><p>Trace host setting layers.<br>Keep credentials server-side.<br>Mount one approved file.<br>Separate mount from read.</p>',
 'Welcome to Lab sixteen, Environment and configuration provenance. In this lecture, you will trace where each setting comes from: host layers that only your application sees, a server credential that never reaches the agent, and an explicit file resource that the Managed sandbox actually receives. We will run the offline fixtures, and then a real session with a mounted file.')
d.overview('TRACE · ISOLATE · MOUNT','Host settings never enter the sandbox by themselves',[
 ('ov-concepts','1 · CONCEPTS','Three scopes','Host precedence, credential<br>readiness, remote resources','First, the concepts: host precedence, credential readiness, and remote resources are three separate scopes.'),
 ('ov-offline','2 · OFFLINE','Provenance fixtures','Layers · missing credential<br>absent mount · path guard','Second, the offline fixtures: layer precedence, a missing credential, an absent mount, and the host path guard.'),
 ('ov-live','3 · LIVE','One mounted file','A real session with<br>one approved file resource','Third, a real session that receives exactly one approved file.'),
 ('ov-code','4 · CODE','Read the TypeScript','File resources need<br>the read tool','Finally, the TypeScript code that mounts and verifies the file.')],
 'A listed mount proves the file is available, not that the agent read it.')
d.shot('lesson','Open Lab 16',{'lesson-title':'Open Lab sixteen, Environment and configuration provenance.','lesson-objective':'The objective: trace host configuration precedence, server credential readiness, and explicit Managed environment resources, without conflating their scopes.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: trace host precedence, credential readiness, and environment resources separately.'),
 (2,'Core rule','Region two, the core rule. Are host configuration and Managed environment resources identical? No: trace their separate scopes explicitly.'),
 (3,'Keep the boundary clear','Region three: host precedence, credential readiness, and remote resources are distinct.'),
 (6,'Put it to the test','Region six: explain which values reach the sandbox, and which stay on the host.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: change the user and session region overrides, and compare which host layer wins.'),
 (2,'Run the comparison','Step two: run the missing credential and absent mount fixtures, keeping unknown remote values separate.'),
 (3,'Inspect the boundary','Step three: inspect an allowed path and an outside path with the host guard.'),
 (4,'Follow the workflow','Step four: review the authored cloud environment definition and the server-only manifest.')])
d.shot('experiment','The provenance experiment',{'exp-rule':'Open Run the exercise. Change a synthetic host layer and see which value wins, then compare it with what the sandbox actually receives through an explicit file resource.',
 'exp-user':'The user region override.','exp-session':'The session region override.','exp-scenario':'And four offline scenarios.'})
d.shot('manifest','The approved manifest',{'man-credentials':'The manifest shows credential names and readiness, never values. Offline, the approved file ID is still missing.',
 'man-example':'The authored cloud example uses limited networking, with no allowed hosts and no packages.','man-files':'Exactly one file is approved, with a fixed mount path.'})
d.shot('resolve-user','Offline · The user layer wins',{'user-precedence':'Click Resolve host settings. The precedence is session override, then user override, then the course default.',
 'user-card':'With only a user override, the region is south, from the user override. But the remote value is not injected: there is no Managed session option for host environment variables.'})
d.shot('resolve-session','Offline · The session layer wins',{'session-precedence':'Now set the session override to north and resolve again.','session-card':'North wins, from the session override. Still, this only affects the application, never the sandbox.'})
d.shot('layers','Offline · Three layers compared',{'layers-list':'Compare three layers shows each case: the course default, the user override, and the session override.'})
d.shot('winning','Offline · The environment exercise',{'winning-mount':'Run the offline environment exercise. The fixture requests the approved mount, with a limited network and no packages.',
 'winning-session':'The authored session completed.','winning-message':'All of this is authored offline evidence.'})
d.shot('missing-cred','Offline · Missing credential',{'cred-precedence':'Choose Missing credential. Credential readiness is now missing.',
 'cred-card':'And the key is never injected into the sandbox. The server key never becomes an agent-visible environment variable.'})
d.shot('absent','Offline · Absent mount',{'absent-mount':'Choose Absent remote mount. No mount is requested, and the observed mount is absent.','absent-session':'The session still completes.','absent-message':'Unknown remote values stay separate from host values.'})
d.shot('path-allowed','Offline · The approved path',{'path-allowed-candidate':'Now the path boundary. Choose the approved fixture mount.','path-allowed-result':'Allowed: the approved fixture path only. This is a host policy result, not a cloud filesystem read.'})
d.shot('path-outside','Offline · An outside path',{'path-outside-candidate':'Choose an outside path.','path-outside-result':'Denied: the path is outside the single approved mount, and no file was opened.'})
d.shot('path-traversal','Offline · Traversal',{'path-traversal-candidate':'And a traversal path.','path-traversal-result':'Denied as well.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Live mode also needs a reviewed fictional file, uploaded separately, with its ID in a server-only setting.')
lines=d.transcript('file-upload.raw.txt')
d.terminal('Live · Upload the approved file',[(l,'up-file' if i==0 else 'up-run' if '_upload16.ts' in l else 'up-id' if l.startswith('Uploaded') else 'up-env' if 'LAB16_FILE_ID=file' in l else None) for i,l in enumerate(lines)],
 {'up-file':'The approved file is a short fictional field guide.','up-run':'Upload it with the Files API. Here, a small script calls files dot upload.',
  'up-id':'The upload returns a file ID.','up-env':'Save it in dot env as CLAUDE underscore MANAGED underscore LAB16 underscore FILE underscore ID.'})
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-manifest','Live · The file ID is configured',{'live-man-credentials':'Back in Lab sixteen, the approved file ID is now configured, and redacted.','live-man-files':'The approved mount path is unchanged.'},note='LIVE RUN')
d.shot('live-question','Live · Run one session',{'live-question-text':'The question asks Claude to explain the region, and to distinguish the approved mount from a confirmed read.','live-run-button':'Click Run live. This creates one billed session with only that approved mount.'},note='LIVE RUN')
d.shot('live-report','Live · The mount is listed',{'live-report-mount':'The real cloud environment has a limited network and no packages, and the session resources list the file at the approved mount path.',
 'live-report-session':'The turn completed, and the session was archived.','live-report-message':'Resource listing is an API observation; the answer alone does not prove a read.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-answer','Live · Mounted, but not read',{'live-answer-text':'Claude tried to read the uploads directory, got "is a directory", and said honestly that it had not confirmed the file contents. A mount is not a read.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the provenance prove?',[
 ('vs-host','HOST','Layers stay local','Session, user and default<br>never reach the sandbox','Host layers decided the application value, and never reached the sandbox.'),
 ('vs-key','KEY','Server only','The API key is never<br>an agent variable','The API key stayed on the server.'),
 ('vs-mount','MOUNT','Listed, not read','One approved file resource;<br>a read needs evidence','And the one approved file was listed as mounted, but a read needs its own evidence.')],'File resources require the read tool on the session.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the settings module to the provenance resolver and the live port.'),
 (3,'POST /resolve','Section three resolves the host layers.'),
 (5,'POST /layers-run','Section five compares the three layers.'),
 (7,'POST /env-run','Section seven runs the environment exercise, offline or live.')])
d.mapping('Where are env and settingSources?',[
 ('map-sdk','CLAUDE AGENT SDK','env and settings','env, settingSources and<br>additionalDirectories options','In the Agent SDK, env, setting sources, and additional directories configure the local process.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Environment and resources','A cloud environment, plus<br>explicit file resources','Here, the cloud environment and explicit session resources define what the sandbox receives. Host variables are not injected.'),
 ('map-port','THIS PLATFORM','The Lab 16 port','server/lib/lab16-port.ts','The code is in the Lab sixteen port.')],'The environment check, file resource and mount listing are in server/lib/lab16-port.ts.')
d.port('port-toolset','Source · A read-only toolset',{'port-toolset':'File resources require the built-in read tool, so the session enables read, and nothing else.'})
d.port('port-create','Source · Check, then mount',{'port-environment':'The host retrieves the cloud environment and checks its restricted policy.',
 'port-resources':'The session declares one file resource, at the approved mount path.','port-session':'Then the session is created.'})
d.port('port-listed','Source · Verify the mount',{'port-listed':'Before any prompt, the host lists the session resources, and verifies the file at the expected mount path.'})
d.knowledge('Finish with the knowledge check: are host configuration and Managed environment resources identical?','No. Host precedence, credential readiness, and remote resources are distinct.')
d.summary([('sum-trace','TRACE','Host layers','Session, user, default.','You can now trace which host layer wins.'),
 ('sum-isolate','ISOLATE','Server credentials','Never agent-visible.','Keep credentials on the server.'),
 ('sum-mount','MOUNT','Explicit resources','Listed is not read.','And mount one explicit file, without confusing a mount with a read.')],'Lab 17 · Host snapshots')
d.finish()
