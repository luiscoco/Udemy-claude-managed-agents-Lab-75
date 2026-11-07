"""Lab 23 step-by-step walkthrough authored from real captures of the running platform (offline bundle fixtures, plus a real read-only Managed Agents run from a small terminal script)."""
from lab_video_common import Deck
d=Deck(23,'Lab 23 Step by Step: Reusable Capability Bundles, Offline and Live','Capability bundles');e=d.e
assert 'Bundle contribution hash differs' in e['reload_changed-hash']
live=d.transcript('live.raw.txt');lt=' | '.join(live)
assert 'Bundle names on the agent: none' in lt and 'no message sent' in lt and "Snapshot equals the agent's capabilities: yes" in lt and 'Archived: yes' in lt
d.cover('CLAUDE MANAGED AGENTS · LAB 23 · CAPABILITY BUNDLES','<h2>In this lab</h2><p>Pin reviewed contributions.<br>Compose an inventory.<br>Run a host tool.<br>Reject unsafe reloads.<br>Check a real agent.</p>',
 'Welcome to Lab twenty-three, Reusable capability bundles. In this lecture, you will inspect a reviewed host bundle whose contributions are pinned by hash, compose its capability inventory, run its read-only host tool, and see unsafe reloads rejected while the accepted inventory stays pinned. The application stays offline, so at the end we run a small script that makes real, read-only Managed Agents calls, to see which capabilities a session actually receives.')
d.overview('PIN · COMPOSE · RELOAD SAFELY','A bundle is a host packaging convention',[
 ('ov-concepts','1 · CONCEPTS','Reviewed bundles','Six contributions,<br>each pinned by hash','First, the concepts: a bundle of six reviewed contributions, each pinned by hash.'),
 ('ov-offline','2 · OFFLINE','Bundle fixtures','Disabled · enabled<br>skill and MCP declarations','Second, the offline runs: disabled, enabled, and with skill and MCP declarations.'),
 ('ov-reload','3 · RELOAD · LIVE','Reloads and a real agent','Unsafe reloads rejected<br>· a live terminal run','Third, unsafe reloads that must be rejected, and a live terminal run against the real agent.'),
 ('ov-code','4 · CODE','Read the TypeScript','Hash checks before<br>any inventory change','Finally, the TypeScript code that checks every hash.')],
 'It is not an Agent SDK plugin loader or a marketplace install.')
d.shot('lesson','Open Lab 23',{'lesson-title':'Open Lab twenty-three, Reusable capability bundles.','lesson-objective':'The objective: compose a reviewed capability bundle with explicit integrity and capability boundaries.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: compose a reviewed bundle with explicit boundaries.'),
 (2,'Core rule','Region two, the core rule: a composed bundle still needs explicit capability and integrity boundaries.'),
 (3,'Keep the boundary clear','Region three: declaring a skill or an MCP server is not the same as using it.'),
 (6,'Put it to the test','Region six: verify that a rejected reload leaves the accepted inventory pinned.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: inspect the six contribution hashes and the active bundle version.'),
 (2,'Run the comparison','Step two: compare the disabled and enabled inventories, then run the read-only host tool.'),
 (3,'Inspect the boundary','Step three: include the skill snapshot and MCP declaration, without claiming a skill read or server contact.'),
 (4,'Follow the workflow','Step four: try malformed, changed-hash, and elevated-worker reloads.')])
d.shot('experiment','The reviewed bundle',{'exp-rule':'Open Run the exercise. This application bundle pins reviewed files. It is a host packaging convention, not a plugin loader.',
 'exp-bundle':'The bird namespace, host version one point zero, and the manifest hash.','exp-contributions':'Six contributions: a command, a tool, a primary agent, a worker agent, an MCP declaration, and a skill, each with its hash.'})
d.shot('disabled-inventory','Offline · Bundle disabled',{'disabled-inventory-requested':'With the bundle disabled, click Inspect composition. Nothing is requested.','disabled-inventory-resolved':'Nothing is resolved.','disabled-inventory-workers':'No worker tools, no delegation, no remote session.'})
d.shot('disabled-run','Offline · No effect',{'disabled-run-ledger':'Run the offline bundle: zero provider sends and zero handler invocations.','disabled-run-effect':'No host tool effect, because the bundle was disabled.'})
d.shot('enabled-inventory','Offline · Bundle enabled',{'enabled-inventory-requested':'Enable the bundle. It requests the observation command and the list sightings tool.','enabled-inventory-resolved':'Both are resolved.','enabled-inventory-workers':'Still no worker tools and no delegation.'})
d.shot('enabled-run','Offline · The host tool runs',{'enabled-run-ledger':'Run it: one host handler invocation, and still zero provider sends.','enabled-run-effect':'List sightings returned one fictional record: three Aurora Finches at north marsh.'})
d.shot('skill-mcp-inventory','Offline · Skill and MCP declarations',{'skill-mcp-inventory-requested':'Include the skill snapshot and the URL MCP declaration. Both now appear in the request.',
 'skill-mcp-inventory-resolved':'And in the fixture-resolved inventory.','skill-mcp-inventory-workers':'Still no remote session.'})
d.shot('skill-mcp-run','Offline · Declared is not used',{'skill-mcp-run-ledger':'Run it. Skill file read by an agent: false. MCP contacted: false. Declaring them is not using them.','skill-mcp-run-effect':'The only effect is the same read-only host tool.'})
d.shot('reload-malformed','Reload · Malformed',{'reload-malformed-variant':'Now choose Malformed, and reload the local bundle.','reload-malformed-status':'Validation failed, and no inventory change was accepted.'})
d.shot('reload-changed-hash','Reload · Changed hash',{'reload-changed-hash-variant':'Changed hash.','reload-changed-hash-status':'A contribution hash differs from the reviewed manifest, so the reload is rejected.'})
d.shot('reload-elevated-worker','Reload · Elevated worker',{'reload-elevated-worker-variant':'Elevated worker tries to give the worker agent more tools.','reload-elevated-worker-status':'Rejected too. The accepted inventory stays pinned.'})
d.shot('live-disabled','Why the app stays offline',{'live-unavailable':'Run live is never available in this application lab. The app stays offline.',
 'live-instructions':'There is no provisioned, pinned Managed agent, skill, or MCP resource for this bundle. So instead, we now make the real calls from a small script, to see what the configured agent and a session actually carry.'})
def lcue(i,l):
 if l.startswith('Host bundle'):return 'lv-bundle'
 if l.startswith('Agent agent_'):return 'lv-agent'
 if l.startswith('Agent skills'):return 'lv-caps'
 if l.startswith('Workspace custom skills'):return 'lv-skills'
 if l.startswith('Bundle names'):return 'lv-names'
 if l.startswith('Session sesn_'):return 'lv-session'
 if l.startswith('Snapshot equals'):return 'lv-equal'
 return None
d.terminal('Live · What a session really receives',[(l,lcue(i,l)) for i,l in enumerate(live)],
 {'lv-bundle':'In the student clone, we run underscore live twenty-three dot T S. First, the script loads the host bundle with the same loader as the app: six contributions, hash-checked locally. Nothing is sent.',
  'lv-agent':'Then agents dot retrieve returns the configured agent: version one, model Claude Opus five point five.',
  'lv-caps':'It has no tools enabled, no skills, and no MCP servers.',
  'lv-skills':'Skills dot list shows three custom skills in the workspace, each with its latest version ID. They exist, but they are not attached to this agent.',
  'lv-names':'None of the bundle names, list sightings, format observation, or the bird catalog, appear on the agent.',
  'lv-session':'Next, a session pinned to agent version one is created. It is idle, and no message is sent, so there is no model turn.',
  'lv-equal':'Its agent snapshot equals the agent configuration exactly, and the session is archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the bundle prove?',[
 ('vs-host','HOST','Hash-checked locally','Six reviewed contributions,<br>never sent to Claude','The bundle is checked by the host, and never sent to Claude.'),
 ('vs-agent','AGENT','The real source','Version, model, tools, skills<br>and MCP servers','The configured agent version is the only capability source.'),
 ('vs-session','SESSION','A pinned snapshot','Exactly the agent capabilities,<br>nothing from the bundle','And a session received exactly those capabilities, nothing from the bundle.')],'To give a session a skill or MCP server, provision it and attach it to a new agent version.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the plugins module to the bundle loader.'),
 (3,'POST /reload','Section three reloads the local bundle, and rejects unsafe variants.'),
 (4,'POST /inventory','Section four composes the capability inventory.'),
 (5,'POST /run','Section five runs the read-only host tool.')])
d.mapping('Where are plugins?',[
 ('map-sdk','CLAUDE AGENT SDK','The plugins option','The SDK loads plugin folders<br>with commands and agents','In the Agent SDK, the plugins option loads local plugin folders with commands, agents, and hooks.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Provisioned resources','Agents, skills and MCP servers<br>are separate API resources','Here, agents, skills, and MCP servers are separate API resources that you provision and pin. This host bundle only describes them.'),
 ('map-port','THIS PLATFORM','The Lab 23 bundles','server/lib/lab23-bundles.ts','The code is in the Lab twenty-three bundles module.')],'Hash checks and inventory composition are in server/lib/lab23-bundles.ts.')
d.port('port-hash','Source · Every contribution is checked',{'port-hash':'Each contribution file is hashed, and a mismatch with the reviewed manifest rejects the whole reload.'})
d.knowledge('Finish with the knowledge check: what should a reviewed host bundle preserve?','Explicit boundaries. A composed bundle still requires explicit capability and integrity boundaries.')
d.summary([('sum-pin','PIN','Reviewed hashes','Every contribution checked.','You can now pin bundle contributions by hash.'),
 ('sum-compose','COMPOSE','Explicit inventory','Declared is not used.','Compose an inventory without confusing declarations with use.'),
 ('sum-reload','RELOAD','Fail closed','The accepted inventory stays.','And reject unsafe reloads, keeping the accepted inventory pinned.')],'Lab 24 · Agent loops')
d.finish()
