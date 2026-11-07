"""Lab 43 step-by-step walkthrough authored from real captures of the running platform (offline: the lab's loopback MCP fixture behind a host bridge; live: a small script where a real Managed agent requests MCP resources through a custom tool that the lab's own bridge answers)."""
from lab_video_common import Deck
d=Deck(43,'Lab 43 Step by Step: MCP Resources Through a Host Bridge, Offline and Live','Tools and extensions');e=d.e
assert e['liveButtons']==0 and e['scenarios']==['versioned-resource','allowed-template','known-prompt','bad-token','expired-token','unknown-uri']
assert e['consent']=='Local consent: true; token valid; loopback-http.'
assert '"uri":"lab43://observations/v1"' in e['resources'] and '"uriTemplate":"lab43://observations/{version}"' in e['resources'] and '"name":"summarize-observations"' in e['resources']
assert '"configured":false' in e['toolsets'] and '"name":"read_approved_resource","type":"custom"' in e['toolsets']
assert e['status_v1']=='allowed: Authenticated loopback MCP result inspected.' and 'Resource version: 1. Result bytes: 104.' in e['v1'] and 'Aurora Finch count: 3.' in e['v1']
assert 'Resource version: 2. Result bytes: 104.' in e['v2'] and 'Aurora Finch count: 4.' in e['v2']
assert 'Method: prompts/get; URI: prompt name' in e['prompt'] and 'Result bytes: 167.' in e['prompt']
assert e['status_bad-token']=='refused: MCP bridge refused the bad bearer token.' and 'Loopback server returned an authentication refusal.' in e['bad-token']
assert e['status_expired']=='refused: Host token expired; refresh before another call.' and 'Custom tool result: none.' in e['expired']
assert e['status_unknown']=='refused: Unknown or non-server-owned URI refused before transport.' and 'Result bytes: 0.' in e['unknown']
assert e['status_refresh']=='allowed: Authenticated loopback MCP result inspected.' and '(valid)' in e['refresh']
assert e['calls']=='Direct Managed URL MCP configured: false. Provider calls: 0.'
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'direct Managed MCP: false' in L and 'session MCP servers: 0' in L and 'resources/list: lab43://observations/v1' in L
assert 'uri: lab43://private/unknown' in L and 'refused: Unknown or non-server-owned URI refused before transport. · 0 bytes' in L
assert 'version 1 · 104 bytes · "Aurora Finch count: 3."' in L and 'version 2 · 104 bytes · "Aurora Finch count: 4."' in L
assert 'The Aurora Finch count went from 3 in v1 to 4 in v2' in L and 'custom tool calls answered: 3' in L and 'Session archived: yes' in L
split=next(i for i,l in enumerate(live) if l.startswith('agent.custom_tool_use') and 'observations/v1' in l)
d.cover('CLAUDE MANAGED AGENTS · LAB 43 · TOOLS AND EXTENSIONS','<h2>In this lab</h2><p>Grant local consent.<br>Read versioned resources.<br>Refuse bad tokens and URIs.<br>Return a bounded result.</p>',
 'Welcome to Lab forty-three, MCP resources through a host bridge. In this lecture, a host bridge reads authenticated, bounded resources from a local MCP server, and returns them to the agent as a custom tool result. The app stays offline, and then a small script lets a real Managed agent request those resources through the lab\'s own bridge, live.')
d.overview('CONSENT · READ · BOUND','Resources through a host bridge',[
 ('ov-concepts','1 · CONCEPTS','The host bridge','Consent, a token, an allowlist<br>and a bounded result','First, the concepts: the host, not the agent, owns consent, the bridge token, the URI allowlist and the size bound.'),
 ('ov-cases','2 · CASES','Six offline cases','Two versions, a prompt, a bad token,<br>an expired token, an unknown URI','Second, six offline cases: two resource versions, a known prompt, a bad token, an expired token, and an unknown URI.'),
 ('ov-live','3 · LIVE','A real agent asks','A custom tool call, answered<br>by the lab\'s own bridge','Third, a live terminal run: a real agent calls a custom tool, and the lab\'s own bridge reads two resources and refuses a private one.'),
 ('ov-code','4 · CODE','The bridge rules','TypeScript guards<br>in lab43-mcp-bridge.ts','Finally, the TypeScript code that holds the bridge rules.')],
 'No Managed URL MCP server is configured: the host reads and bounds every resource.')
d.shot('lesson','Open Lab 43',{'lesson-title':'Open Lab forty-three, MCP resources through a host bridge.','lesson-objective':'The objective: read authenticated, bounded MCP resources through a host bridge, without assuming Managed query-control methods.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: grant local consent, then read authenticated, bounded MCP resources through a host bridge.'),
 (2,'Core rule','Region two, the core rule: observed, bounded resource reads go through that bridge, which enforces authentication, the allowlist and the bounds.'),
 (3,'Keep the boundary clear','Region three: bridge evidence must not be confused with a native remote transport, which is not configured here.'),
 (6,'Put it to the test','Region six: refresh the bridge token, and inspect the next authorized call.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: grant local consent, and inspect the tool, resource, template and prompt listings.'),
 (2,'Run the comparison','Step two: read the version one and version two resource URIs, and compare the results.'),
 (3,'Inspect the boundary','Step three: get the known prompt, and inspect the bounded custom tool result shape.'),
 (4,'Follow the workflow','Step four: try a bad token, an expired token and an unknown URI, and confirm that no result escapes.')])
d.shot('experiment','The host bridge experiment',{'exp-rule':'Open Run the exercise. A loopback MCP server lists tools, versioned resources, a template and a prompt. The host reads only approved URIs.',
 'exp-buttons':'Four buttons: grant local consent, refresh the bridge token, list resources, and inspect toolsets.',
 'exp-scenario':'Choose an offline case: versioned resource, allowed template, known prompt, bad token, expired token, or unknown URI.',
 'exp-read':'Read through host bridge runs the chosen case.','exp-status':'Start with local consent. The bridge token stays on the server.'})
d.shot('consent','Offline · Grant local consent',{'consent-status':'Select Grant local consent. Consent true, the token is valid, and the transport is loopback H T T P.'})
d.shot('resources','Offline · List resources',{'resources-button':'Select List resources.',
 'resources-status':'The loopback server lists one resource, observations v1, a template, observations slash version, and one prompt, summarize observations. Zero provider calls.'})
d.shot('toolsets','Offline · Inspect toolsets',{'toolsets-button':'Select Inspect toolsets.',
 'toolsets-status':'A direct Managed URL MCP toolset is not configured: it needs a reachable server. Instead, a custom tool, read approved resource, bridges server-owned URIs.'})
d.shot('v1','Offline · Read version one',{'v1-transport':'The toy token lives only thirty seconds, so the capture grants consent again before each read. Its preview is redacted.',
 'v1-method':'The versioned resource case: resources slash read, observations v1, allowed.','v1-version':'Resource version one, one hundred four bytes.',
 'v1-result':'The resource text: Aurora Finch count: three.','v1-custom':'It returns as a user dot custom tool result, with is error false.',
 'v1-status':'Allowed: the authenticated loopback MCP result was inspected.'})
d.shot('v2','Offline · Read version two',{'v2-method':'The allowed template case reads observations v2.','v2-version':'Resource version two, also one hundred four bytes.',
 'v2-result':'Now the count is four. Same URI shape, a newer version.','v2-status':'Allowed again.'})
d.shot('prompt','Offline · Get the known prompt',{'prompt-method':'The known prompt case uses prompts slash get, by prompt name, not by URI.',
 'prompt-version':'No resource version, and one hundred sixty-seven bytes.','prompt-custom':'It returns the same bounded custom tool result shape.','prompt-status':'Allowed.'})
d.shot('bad-token','Offline · A bad token',{'bad-transport':'The bad token case sends an invalid bearer token.','bad-version':'No version, and zero bytes.',
 'bad-evidence':'The evidence: the loopback server returned an authentication refusal.','bad-token-status':'Refused: the MCP bridge refused the bad bearer token.'})
d.shot('expired','Offline · An expired token',{'expired-transport':'The expired token case marks the token expired.','expired-custom':'There is no custom tool result.',
 'expired-status':'Refused: the host token expired. Refresh before another call.'})
d.shot('unknown','Offline · An unknown URI',{'unknown-method':'The unknown URI case asks for lab forty-three colon slash slash private slash unknown.',
 'unknown-version':'Zero bytes: nothing escapes.','unknown-evidence':'The host owns the URI allowlist, so the request is refused before any transport.',
 'unknown-status':'Refused: unknown, or non-server-owned URI.'})
d.shot('refresh','Offline · Refresh and read again',{'refresh-transport':'Select Refresh bridge token. The token preview changes, and the new token is valid.',
 'refresh-method':'The next authorized read of observations v1 is allowed.','refresh-version':'Version one, one hundred four bytes.','refresh-status':'Allowed: the refreshed token works.'})
d.shot('no-live','The app stays offline',{'no-live-calls':'The app stays offline in this lab: there is no Run live button, no direct Managed URL MCP, and zero provider calls.',
 'no-live-text':'A direct URL MCP needs a reachable server, and reviewed credentials. So now we make the real calls from a small script, in the terminal of the project: a real agent requests resources through the lab\'s own bridge.'})
d.terminal('Live · A real agent asks for a private URI',[(l,'lv-bridge' if l.startswith('Lab 43 bridge') else 'lv-session' if l.startswith('Session sesn_') else 'lv-consent' if l.startswith('Local consent') else 'lv-list' if l.startswith('resources/list') else 'lv-refused' if l.startswith('  host bridge → refused') else None) for l in live[:split]],
 {'lv-bridge':'The script imports the lab\'s own Lab forty-three bridge class. It drives the local loopback MCP server, and no direct Managed MCP is used.',
  'lv-session':'It creates one real session, with one custom tool, read approved resource, and zero MCP servers.',
  'lv-consent':'The host grants local consent. The toy token stays in the script, redacted, on a loopback transport.',
  'lv-list':'Resources slash list returns observations v1. The allowlist holds version one and version two.',
  'lv-refused':'Turn one asks the agent to read three URIs. Its first custom tool call asks for private slash unknown. The bridge refuses it before transport, with zero bytes, and returns is error true.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Bounded reads, then the answer',[(l,'lv-v1' if 'allowed · version 1' in l else 'lv-v2' if 'allowed · version 2' in l else 'lv-agent' if l.startswith('Agent:') else 'lv-cache' if l.startswith('Host cache') else 'lv-archived' if l.startswith('Session archived') else None) for l in live[:1]+live[split:]],
 {'lv-v1':'The next call asks for observations v1. The bridge reads it: resources slash read, version one, one hundred four bytes, Aurora Finch count: three.',
  'lv-v2':'Then observations v2: version two, one hundred four bytes, and a count of four. Each result goes back as a user dot custom tool result.',
  'lv-agent':'The agent\'s answer uses both results: the count went from three in v1 to four in v2, and the host refused the private URI. Three custom tool calls were answered.',
  'lv-cache':'The host cache holds only the two allowed reads.',
  'lv-archived':'Finally, the session is archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real agent prove?',[
 ('vs-caller','CALLER','A real tool call','Fixture tool_use ID offline;<br>a real agent event live','Offline, the custom tool result has an authored tool use ID. Live, each result answered a real agent custom tool use event.'),
 ('vs-refuse','REFUSAL','Same allowlist','The private URI is refused<br>before transport, zero bytes','In both, the unknown private URI was refused before transport, and zero bytes escaped.'),
 ('vs-version','VERSIONS','Bounded results','v1 count three, v2 count four,<br>one hundred four bytes each','And the same bounded reads: version one says three, version two says four, and the live agent compared them.')],'The bridge rules are the same code: the live script imports Lab43Bridge from the app.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect this router to the Lab forty-three schemas and the bridge class.'),
 (3,'POST /auth','Section three, post slash auth, validates local consent, and grants or refreshes the bridge token.'),
 (5,'POST /resources','Section five, post slash resources, lists resources, templates and prompts through the bridge.'),
 (6,'POST /host-read','Section six, post slash host read, runs one bounded read through the host bridge.'),
 (7,'POST /live','Section seven, post slash live, is refused: direct Managed URL MCP is not configured.')])
d.mapping('Where does the MCP client live?',[
 ('map-sdk','CLAUDE AGENT SDK','In-process MCP servers','Your process connects<br>and reads resources','In the Agent SDK, your own process configures MCP servers, and the SDK reads their resources directly.'),
 ('map-managed','CLAUDE MANAGED AGENTS','A custom tool and a host bridge','agent.custom_tool_use →<br>user.custom_tool_result','This platform uses Managed Agents beta sessions, not the Agent SDK. A URL MCP server would need a reachable service and credentials, so here the agent calls a custom tool, and the host answers it.'),
 ('map-port','THIS PLATFORM','The Lab 43 bridge class','server/lib/lab43-mcp-bridge.ts','Here, the Lab forty-three bridge class holds consent, the token, the allowlist and the size bound.')],'No Agent SDK MCP client is installed: the bridge lives in server/lib/lab43-mcp-bridge.ts.')
d.port('port-allowlist','Source · The URI allowlist and the size bound',{'port-uri':'Only observations v1 and v2 are allowed.',
 'port-refuse':'Any other resource URI is refused before transport.','port-bound':'And a result over twelve hundred characters is refused as too large.'})
d.port('port-token','Source · The bridge token',{'port-expiry':'Consent creates a toy token that expires after thirty seconds.',
 'port-bearer':'If the loopback server answers four hundred three, the bridge token is refused.'})
d.port('port-result','Source · The custom tool result',{'port-expired':'An expired token is refused before any read.',
 'port-custom':'Only an allowed read becomes a user dot custom tool result.','port-direct':'With is error false, no direct Managed MCP, and zero provider calls.'})
d.knowledge('Finish with the knowledge check: what does a host MCP bridge establish?','Bridge evidence must not be conflated with native remote transport capabilities.')
d.summary([('sum-consent','CONSENT','Host-owned token','Consent, expiry, refresh.','You can now grant local consent, and refresh a short-lived, server-side bridge token.'),
 ('sum-allow','ALLOWLIST','Server-owned URIs','Unknown URIs never leave the host.','The host owns the URI allowlist: unknown URIs are refused before transport.'),
 ('sum-result','RESULT','Bounded and typed','A user.custom_tool_result.','And each bounded read returns to the agent as a typed custom tool result.')],'Lab 44 · Host telemetry and provider event traces')
d.finish()
