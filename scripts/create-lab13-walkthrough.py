"""Lab 13 step-by-step walkthrough authored from real captures of the running platform (offline MCP transports and one live host-bridge session)."""
from lab_video_common import Deck
d=Deck(13,'Lab 13 Step by Step: MCP Connections and Reachability, Offline and Live','MCP connections');e=d.e
assert 'managed-api-host-bridge' in e['live'] and 'list_notes: result observed' in e['live'] and 'get_stock: result observed' in e['live'] and 'Cleanup: archived' in e['live_close']
d.cover('CLAUDE MANAGED AGENTS · LAB 13 · MCP CONNECTIONS','<h2>In this lab</h2><p>Connect local MCP servers.<br>Compare advertised and effective tools.<br>Change tools while idle.<br>Separate local from cloud reachability.</p>',
 'Welcome to Lab thirteen, MCP connections and reachability. In this lecture, you will connect real local MCP servers, compare the tools they advertise with the tools the agent may use, and learn why a local success does not prove that a cloud sandbox can reach an endpoint. We will run the offline transports, and then a real session.')
d.overview('CONNECT · FILTER · OBSERVE','Configuration is not reachability',[
 ('ov-concepts','1 · CONCEPTS','Two integration paths','A typed host bridge<br>or native HTTPS MCP','First, the concepts: a typed host bridge to local MCP servers, or native Managed HTTPS MCP with a vault.'),
 ('ov-offline','2 · OFFLINE','Real local transports','stdio and HTTP handshakes<br>reserve · disable · 401','Second, real local transports: stdio and authenticated HTTP, a reservation, a disabled server, and an unauthorized call.'),
 ('ov-live','3 · LIVE','One real turn','Claude calls the bridged<br>MCP tools','Third, a real session that calls the bridged tools.'),
 ('ov-code','4 · CODE','Read the TypeScript','Custom bridge tools<br>and idle updates','Finally, the TypeScript code behind both paths.')],
 'A local MCP success never proves that a Managed sandbox can reach the endpoint.')
d.shot('lesson','Open Lab 13',{'lesson-title':'Open Lab thirteen, MCP connections and reachability.','lesson-objective':'The objective: connect real local MCP transports, separate configuration from observed reachability, and compare host bridges with native Managed HTTPS MCP.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the same objective.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: real local transports, configuration versus reachability, and the two integration paths.'),
 (2,'Core rule','Region two, the core rule. Does MCP configuration prove reachability? No: inspect the observed connection and transport evidence.'),
 (3,'Keep the boundary clear','Region three: a configured transport and an observed reachability are distinct.'),
 (6,'Put it to the test','Region six: disable a server, prove the disabled tool had no effect, and explain why local success does not prove cloud access.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run Working offline, and inspect the real stdio and authenticated HTTP handshakes.'),
 (2,'Run the comparison','Step two: compare advertised and effective tools, enable the fictional reservation tool while idle, and attempt one reservation.'),
 (3,'Inspect the boundary','Step three: disable the inventory server while idle, attempt the same call, and confirm the stock stayed unchanged.'),
 (4,'Follow the workflow','Step four: compare the Missing and Unauthorized scenarios. Local HTTP errors are not cloud reachability tests.')])
d.shot('experiment','The MCP experiment',{'exp-rule':'Open Run the exercise. Notes run over stdio, and the owned inventory server uses authenticated Streamable HTTP. A local success does not prove a Managed sandbox can reach it.',
 'exp-scenario':'The offline connection scenario selects working, missing, unauthorized, or hang.','exp-integration':'The live integration is either the typed host bridge, or native Managed HTTPS MCP with a vault.',
 'exp-config':'The configuration enables the notes server, the inventory server, and an optional fictional reservation tool.'})
d.shot('connections','Offline · Real local handshakes',{'conn-notes':'Click Run offline MCP experiment. The notes server over stdio is ready locally: a real MCP handshake and tool discovery. Cloud reachability is untested.',
 'conn-inventory':'The inventory server over HTTP advertises get stock and reserve stock, but only get stock is effective, because reservation is disabled.'})
d.shot('calls','Offline · Actual tool evidence',{'call-notes':'The tool evidence shows list notes returned a result.','call-notes-path':'Its path is host MCP: the host ran the real MCP call and submitted the result.','call-stock':'And get stock returned a result too.'})
d.shot('stock','Offline · Owned local inventory',{'stock-scope':'The stock is the host\'s own local inventory, not a remote measurement.','stock-list':'Eight notebooks are available.'})
d.shot('reserve-config','Offline · Enable reservation while idle',{'reserve-checkbox':'Now enable the fictional reservation tool.','reserve-apply':'Apply the idle MCP configuration.','reserve-plan':'And choose the plan that attempts one stock reservation.'})
d.shot('reserve','Offline · One reservation',{'reserve-call':'Run it. Reserve stock returned a result.','reserve-result':'One notebook was reserved, leaving seven.'})
d.shot('reserve-stock','Offline · The effect is real',{'reserve-stock-list':'The local inventory confirms it: seven notebooks.'})
d.shot('disabled','Offline · Disable the inventory server',{'disabled-inventory':'Now disable the inventory server, apply while idle, and run the same plan. The inventory server is disabled, with no advertised or effective tools.'})
d.shot('disabled-call','Offline · The call is rejected',{'disabled-call-head':'The new reserve stock attempt is an error.','disabled-call-path':'Its path is host rejected, and the host handler was not attempted.',
 'disabled-call-text':'No MCP call was made.'})
d.shot('disabled-stock','Offline · Stock unchanged',{'disabled-stock-list':'And the stock stayed at seven. The disabled tool had no effect.'})
d.shot('unauthorized','Offline · Unauthorized',{'unauth-inventory':'Close the session, and run the Unauthorized scenario. The inventory server failed locally with HTTP four oh one. A local error is not a cloud reachability test.',
 'unauth-calls':'The notes server still worked, so list notes still returned a result.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','The host bridge needs the base setup. Native URL mode additionally needs a reviewed public HTTPS endpoint and an existing vault, so this video uses the host bridge.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-question','Live · Use the host bridge',{'live-integration':'Keep the typed host bridge to local MCP.','live-prompt':'And the question: list the field notes and check notebook stock.'},note='LIVE RUN')
d.shot('live-run','Live · Run one real turn',{'live-run-button':'Click Run live. This starts one billed session.'},note='LIVE RUN')
d.shot('live-session','Live · The real session',{'live-head':'The source is the managed API through the host bridge, and the session is idle after the turn.',
 'live-conn-notes':'The notes server is ready locally.','live-conn-inventory':'And so is the inventory server.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-calls','Live · Claude called the tools',{'live-call-1':'Claude called list notes.','live-call-1-path':'The host executed the real MCP call and submitted the result back to the session.','live-call-2':'Then get stock.'},note='LIVE RUN')
d.shot('live-answer','Live · The answer',{'live-outcome':'The turn completed.','live-answer-text':'Claude reports two field notes, and eight notebooks available, which matches the local inventory.'},note='LIVE RUN')
d.shot('live-close','Live · Close the session',{'live-close-head':'Click Close MCP session. The state is closed.','live-close-cleanup':'And the real session was archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the MCP evidence prove?',[
 ('cmp-config','CONFIG','Advertised vs effective','The host decides which<br>advertised tools are usable','The host decided which advertised tools were effective.'),
 ('cmp-effect','EFFECT','Calls and stock','Only an executed call<br>changed the inventory','Only an executed MCP call changed the inventory; a disabled tool had no effect.'),
 ('cmp-reach','REACH','Local is not cloud','A local handshake or 401<br>says nothing about the cloud','And neither a local handshake nor a local four oh one tested cloud reachability.')],'Native HTTPS MCP needs a reviewed public endpoint and a vault credential.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the MCP module to the local servers and the session port.'),
 (3,'POST /{action}','Section three handles session creation and queries.'),
 (4,'POST /{action}','Section four handles the idle configuration, stock, and end controls.'),
 (5,'Return the module contract','Section five returns the router and its cleanup contract.')])
d.mapping('Where are mcpServers?',[
 ('map-sdk','CLAUDE AGENT SDK','The mcpServers option','The SDK starts stdio or<br>HTTP servers in your process','In the Agent SDK, the MCP servers option connects stdio or HTTP servers from your own process.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Two paths','Custom tools bridged by the host,<br>or url MCP servers with a vault','Here, the agent runs in the cloud. Either the host bridges local MCP tools as custom tools, or the session declares URL MCP servers that the cloud must reach.'),
 ('map-port','THIS PLATFORM','The Lab 13 port','server/lib/lab13-port.ts','The code is in the Lab thirteen port.')],'Bridge tools, native URL servers and idle updates are in server/lib/lab13-port.ts.')
d.port('port-bridge','Source · Two integration paths',{'port-bridge':'The host bridge declares one custom tool per enabled local MCP tool.','port-native':'Native mode instead declares a URL MCP server for the inventory.'})
d.port('port-create','Source · Create and update',{'port-create':'The session uses agent with overrides with the desired tools and MCP servers, and a budget.',
 'port-session':'Then the session is created.','port-update':'Idle configuration changes use sessions dot update.'})
d.port('port-respond','Source · Return the MCP result',{'port-respond':'After the host runs the real MCP call, it returns the result with a user dot custom tool result event.'})
d.knowledge('Finish with the knowledge check: does MCP configuration prove reachability?','No. Configured transport and observed reachability are distinct.')
d.summary([('sum-connect','CONNECT','Real transports','stdio and authenticated HTTP.','You can now connect real MCP transports and read their handshake evidence.'),
 ('sum-filter','FILTER','Effective tools','Change them while idle.','Compare advertised with effective tools, and change them while idle.'),
 ('sum-reach','REACH','Local is not cloud','Test reachability separately.','And explain why local success does not prove cloud reachability.')],'Lab 14 · Models and effort')
d.finish()
