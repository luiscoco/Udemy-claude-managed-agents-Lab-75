"""Live acceptance scenarios, separated from local integrations and unsupported paths."""
SUPPORTED = set(range(8, 23)) | {50, 66, 69, 70, 75}
PREREQUISITES = {
    8:'Use the dedicated Lab 08 coordinator with its three predefined agents, plus shared Managed key/environment and live opt-in.',
    11:'Configure reviewed immutable skill pins for both bundle revisions, the shared base agent/environment and explicit live opt-in.',
    13:'Use the host bridge with working local MCP transports. Native URL mode additionally needs a reviewed endpoint and matching vault.',
    14:'Declare an account-ready model and supported effort; configure the shared base agent/environment, budget and live opt-in.',
    16:'Configure the approved uploaded fixture file and restricted cloud environment, in addition to the shared Managed settings.',
    18:'Retrieve the exact restricted cloud environment and pass the lesson availability check before starting the live diagnostic.',
    20:'Configure the Lab 07 custom-tool agent, shared environment/key and live opt-in before the lifecycle experiment.',
    50:'Configure the dedicated version-pinned Lab 50 agent and its separate live-enable gate; bind the fictional customer on the host.',
    69:'Capture explicit trusted document context and correlation ID; configure the shared Managed settings for the backend adapter.',
    70:'Probe an allowlisted Python interpreter with the pinned SDK, then enable shared Managed setup. Never install packages during a run.',
    75:'Use the isolated Lab 75 key and three version-pinned role agents. Validate readiness, task plan, budget and parallelism first.',
}
CHECKS = {
    8:'Inspect real session/thread IDs and correlated tool results. Recompute allowed effects; a reviewer write must still be denied.',
    9:'Keep the question fixed. Verify the resolved system/agent snapshot, completed outcome and independently confirmed archival.',
    10:'Validate both reports on the same retained session. Explicitly close it and retrieve remote archival independently.',
    11:'Compare no-skill, pinned-skill and revised-version runs. Verify resolved pins, observed reference reads and remote archival.',
    12:'Reuse one session and stream, queue bounded commands, and match returned user event IDs to observed completion.',
    13:'Correlate the custom result to its sevt_ ID and compare the real local inventory effect with the reported turn outcome.',
    14:'Verify resolved model/effort before sending. Report public messages/usage and any explicit fallback separately.',
    15:'Retrieve real usage within the same identity and scope. Keep unavailable counters null and close the retained session explicitly.',
    16:'Compare requested and listed session resources with environment metadata. Agent prose alone cannot prove a file read.',
    17:'Confirm turn completion before the host file action. Verify restore hashes/version and keep remote history unchanged.',
    18:'Approve only the exact allowed diagnostic command and inspect its tool result; do not infer network isolation from a model answer.',
    19:'Compare parent/child IDs and explicit summary lineage; inspect bounded provider history and perform the appropriate explicit close.',
    20:'Compare pre-execution decisions with actual file effects and correlated results; distinguish denial from handler failure.',
    21:'A model command sends only the checked expansion. Local reset/history must make zero provider sends.',
    22:'Compare the exact composed message and selected host hashes; the run must not claim an attached cloud memory store.',
    50:'Verify pending approval, trusted decision and the refund ledger. Model text must never approve the action.',
    66:'Reconnect the same run from its last sequence and replay a command ID. Verify no second accepted provider send.',
    69:'Require a validated patch, matching context hash/version and explicit host apply. Retrieve remote cleanup independently.',
    70:'Verify two retained turns, explicit close and a correlated custom-tool call in a separate one-shot session.',
    75:'Require Ready, all worker tasks merged, no unresolved questions, independent release gates and archival of every remote session.',
}
LOCAL = {
    33:'Real local MCP worker and elicitation exchange; no configured direct Managed elicitation callback.',
    43:'Authenticated loopback MCP resources; direct cloud MCP configuration is a separate integration.',
    44:'Local OTLP collector is real. Remote OTLP/Azure exports need their own setup and explicit action; they export host spans.',
    45:'Synthetic provider emulator is local. Optional configured AWS checks are read-only resource preflight, not model-session proof.',
    57:'Real disposable Git worktrees and host integration checks; live model-worker orchestration is not supplied by this fixture.',
    61:'Real authenticated local MCP protocol and typed tool output; the demo is not proof of a provider model session.',
    64:'Real local Playwright MCP, fixture DOM and screenshot; no cloud-model browser adapter is configured.',
    65:'Outbox evidence is local. Slack, Teams and email delivery each require their own enabled credentials and separate delivery proof.',
    67:'Real host authentication/quota isolation with authored runner work; this is not a billed multi-tenant model benchmark.',
    68:'Real host queue, signature checks and persistence with authored worker effects; no cloud worker is implied.',
    71:'Real host CSV processing, aggregates and verification; a dedicated live analysis agent is not configured.',
    72:'Real local document construction and package verification; cloud skill upload and a live agent adapter are separate setup.',
    73:'Real host Git, tests and reviewable patch evidence; the provided workshop does not implement a live model fixer.',
}
CLEANUP = {
    8:'Cancel explicitly and inspect remote status separately. This adapter does not automatically archive its session; accepted interrupt is not idle proof.',
    10:'Test invalid JSON/correction and cancellation. Retain only confirmed-idle work; explicitly End the session and verify archival.',
    12:'Test queue bounds and conflicting command IDs. End the retained session explicitly; a browser disconnect is not an independent stop proof.',
    13:'Test a denied bridge call and explicit End. Report local transport closure, remote interruption and session archival separately.',
    15:'Test missing/stale usage and explicit End. A budget increase requires separate resume consent; unknown counters stay unavailable.',
    17:'Reject a stale restore plan or busy session. Host restoration never rewinds remote history; explicitly close the retained session.',
    19:'Reject foreign/busy/archived mutations. Explicitly close retained parent/child sessions and verify each cleanup state.',
    21:'Reject unknown grammar before sending. Local reset/history sends no turn; explicitly close the owned retained session afterward.',
    50:'Deny one proposal, reject a repeated/foreign decision, then explicitly close the conversation and verify idle/archive evidence.',
}

def scenario(n):
    if n in SUPPORTED:
        return {
            'status':'implemented-adapter; actual execution requires readiness',
            'cards':[
                ('1 · Prepare live setup',PREREQUISITES.get(n,'Configure server-side credentials, the base agent/environment and explicit live opt-in. Set bounded budget and deadline first.')),
                ('2 · Execute deliberately','Choose the lesson\'s supported live action and normal scenario. Use owned fictional inputs; setup/readiness alone starts no model turn.'),
                ('3 · Verify independent proof',CHECKS[n]),
                ('4 · Test failure and cleanup',CLEANUP.get(n,'Reject invalid input before dispatch. Check interruption/status independently; archive confirmed-idle work or report cleanup pending.'))],
            'boundary':'Actual-provider evidence requires a real completed test and cleanup verification; injected SDK tests are a separate evidence category.'}
    detail=LOCAL.get(n,'The checked-in lesson is an offline host/fixture exercise. A configured production Managed adapter is not provided for this workflow.')
    return {
        'status':'local integration / offline only; cloud run unsupported',
        'cards':[
            ('1 · Current implementation',detail),
            ('2 · Exercise the supported path','Run the documented local/fixture scenario and verify its real host effects, protocol evidence or checked state.'),
            ('3 · Test the live boundary','Where a live action exists, expect the documented setup/unsupported rejection. Otherwise unsupported mode fields must not select a hidden provider path.'),
            ('4 · Keep evidence scoped','A local protocol, file, browser or database success is not a live model result. Keep unavailable cloud integrations explicitly unverified.')],
        'boundary':'Do not present fixture success or read-only setup as a completed live run. Optional integrations need their own configuration and proof.'}
