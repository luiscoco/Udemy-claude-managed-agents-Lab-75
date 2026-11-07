"""Lab 18 step-by-step walkthrough authored from real captures of the running platform (offline host policy fixtures and one live pwd diagnostic)."""
from lab_video_common import Deck
d=Deck(18,'Lab 18 Step by Step: Cloud Sandbox and Host Boundaries, Offline and Live','Cloud sandbox');e=d.e
assert 'Ready: true' in e['live_availability'] and 'Observed pwd: true' in e['live'] and 'Cleanup: archived' in e['live']
d.cover('CLAUDE MANAGED AGENTS · LAB 18 · CLOUD SANDBOX','<h2>In this lab</h2><p>Read the platform manifest.<br>Test a host path boundary.<br>Inspect the cloud environment.<br>Run one approved pwd.</p>',
 'Welcome to Lab eighteen, Cloud sandbox and host boundaries. In this lecture, you will inspect the configured cloud sandbox policy, test a disposable host file boundary, and run one approved command in the real remote sandbox, without confusing any of these with agent permission flags.')
d.overview('INSPECT · TEST · CONFIRM','Cloud policy and host boundaries are checked separately',[
 ('ov-concepts','1 · CONCEPTS','Two boundaries','The cloud sandbox policy<br>and the host filesystem','First, the concepts: the cloud sandbox policy and the host filesystem are different boundaries.'),
 ('ov-offline','2 · OFFLINE','Host policy tests','Allowed · outside<br>network · missing env','Second, the offline host tests: an allowed mount, an outside path, a blocked network, and a missing environment.'),
 ('ov-live','3 · LIVE','One remote command','pwd, confirmed by the host<br>in the real sandbox','Third, one real pwd command, confirmed by the host, in the cloud sandbox.'),
 ('ov-code','4 · CODE','Read the TypeScript','always_ask and an<br>exact allowlist','Finally, the TypeScript code that allows only that command.')],
 'Only an observed tool use and result verifies remote execution.')
d.shot('lesson','Open Lab 18',{'lesson-title':'Open Lab eighteen, Cloud sandbox and host boundaries.','lesson-objective':'The objective: inspect the configured cloud sandbox policy, and independently test a disposable host file boundary, without conflating either with agent permission flags.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: inspect the cloud policy, and test a host file boundary, separately.'),
 (2,'Core rule','Region two, the core rule: check the cloud policy and the host file boundaries separately.'),
 (3,'Keep the boundary clear','Region three: cloud sandbox policy and disposable host filesystem tests establish different boundaries.'),
 (6,'Put it to the test','Region six: identify which evidence proves each boundary.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: read the local platform manifest, without starting a session.'),
 (2,'Run the comparison','Step two: run Allowed mount and Outside mount offline, and compare the host read counts and hashes.'),
 (3,'Inspect the boundary','Step three: run Blocked network and Missing environment, and inspect the fail-closed results.'),
 (4,'Follow the workflow','Step four: inspect the live cloud metadata, then optionally run a bounded, billed pwd diagnostic with host confirmation.')])
d.shot('experiment','The sandbox experiment',{'exp-rule':'Open Run the exercise. Inspect the server configuration, test a disposable host path policy offline, then optionally check the cloud environment and request one approved command.',
 'exp-scenario':'The offline policy scenario has four cases.','exp-buttons':'The buttons check availability, run the host test, or inspect the live environment.'})
d.shot('platform','Offline · The configured platform',{'plat-env':'The configured platform is read locally, with no session. The environment ID is shown, partly hidden here.',
 'plat-mount':'The approved offline host mount is one fixture file. The authored network is limited, with no allowed hosts.','plat-note':'The mount is an offline host fixture only; the live diagnostic requests no files.'})
d.shot('availability','Offline · Availability',{'avail-facts':'Check offline availability. This is the authored host policy: ready, limited network, and no session started.','avail-reason':'No cloud environment was queried.'})
d.shot('allowed','Offline · Allowed mount',{'allowed-host':'Run the offline host test with Allowed mount. The path is allowed, with one read call and zero network calls.',
 'allowed-effect':'The host read the exact allowlisted file from a disposable tree, and verified its hash.','allowed-remote':'No remote session was started.'})
d.shot('outside','Offline · Outside mount',{'outside-host':'Outside mount tries a traversal path. It is not allowed, with zero read calls.','outside-effect':'It was denied before any file was opened.','outside-remote':'Still no remote session.'})
d.shot('network','Offline · Blocked network',{'network-host':'Blocked network: zero reads, and zero network calls.','network-effect':'The limited network policy denied the request before a socket was opened.','network-remote':'No remote session.'})
d.shot('missing-env','Offline · Missing environment',{'missing-env-host':'Missing environment: nothing allowed.','missing-env-effect':'It fails closed: no fixture tree and no file operation were started.','missing-env-remote':'And no session.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Live mode creates one billed session, and approves only the exact pwd command in the remote sandbox.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-availability','Live · Inspect the real environment',{'live-avail-facts':'Back in Lab eighteen, click Inspect live environment. The real cloud environment is ready, with a limited network. No session was started.',
 'live-avail-reason':'The live run will check it again before creating a session.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-run','Live · Run the diagnostic',{'live-run-button':'Click Run live. This creates one billed session, with bash set to always ask.'},note='LIVE RUN')
d.shot('live-remote','Live · One confirmed pwd',{'live-remote-facts':'The session completed. pwd was observed, its tool result succeeded, the host gave one confirmation, and the session was archived.',
 'live-remote-uses':'The command was exactly pwd, allowed by the host, and the remote sandbox answered slash.','live-remote-message':'Only an observed tool use and result verifies remote execution. The host never runs bash itself.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did each boundary prove?',[
 ('vs-host','HOST','Disposable host tree','Read counts and hashes<br>prove the host boundary','Read counts and hashes proved the host file boundary.'),
 ('vs-cloud','CLOUD','Environment metadata','Limited network, no packages,<br>read before any session','The real environment metadata proved the cloud policy, before any session.'),
 ('vs-command','COMMAND','Exact confirmation','One pwd, confirmed,<br>observed with its result','And one confirmed pwd, with its observed result, proved remote execution.')],'Permission flags are not sandbox boundaries.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the sandbox module to the policy and the live port.'),
 (3,'POST /availability','Section three checks availability, offline or live, without starting a session.'),
 (4,'POST /run','Section four runs the host test or the remote diagnostic.'),
 (5,'Decision and early response','Section five handles the decision and the early response.')])
d.mapping('Where is the sandbox option?',[
 ('map-sdk','CLAUDE AGENT SDK','sandbox settings','The SDK sandboxes local<br>commands on your machine','In the Agent SDK, sandbox settings restrict commands that run on your own machine.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Cloud environment','A cloud container with<br>a networking policy','Here, commands run in a cloud environment with its own networking policy, and tool permission policies decide which calls need confirmation.'),
 ('map-port','THIS PLATFORM','The Lab 18 sandbox','server/lib/lab18-sandbox.ts','The code is in the Lab eighteen sandbox module.')],'The pwd policy, environment check and session are in server/lib/lab18-sandbox.ts.')
d.port('port-policy','Source · An exact allowlist',{'port-policy':'The host confirms only bash with the exact command pwd. Anything else is denied with a message.'})
d.port('port-create','Source · Check, then create',{'port-toolset':'The toolset sets bash to always ask.','port-environment':'The host checks the real environment first.',
 'port-overrides':'The session uses agent with overrides, with a system prompt that requests only pwd.','port-session':'Then the session is created.'})
d.knowledge('Finish with the knowledge check: how should sandbox boundaries be verified?','Separately. Cloud sandbox policy and disposable host filesystem tests establish different boundaries.')
d.summary([('sum-host','HOST','Disposable tests','Reads and hashes.','You can now test a host file boundary with reads and hashes.'),
 ('sum-cloud','CLOUD','Environment policy','Inspect before running.','Inspect the cloud environment policy before running.'),
 ('sum-confirm','CONFIRM','One exact command','Observed with its result.','And confirm one exact remote command, verified by its observed result.')],'Lab 19 · Session inventory')
d.finish()
