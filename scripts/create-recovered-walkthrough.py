"""Author recovered Labs 46-50 from saved real captures and terminal evidence.

Usage: python scripts/create-recovered-walkthrough.py 46
No provider calls. Run again after slide capture to bind the measured cue geometry.
"""
import html
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

from lab_video_common import Deck

LAB = int(sys.argv[1])
ROOT = Path(__file__).resolve().parents[1]
TITLES = {
    46: 'Observed Cache Usage and Cost',
    47: 'Model Driven and Host Driven Orchestration',
    48: 'Security Hardening',
    49: 'Headless Host and CI Outcomes',
    50: 'Full Stack Capstone: Acme Support Desk',
    51: 'Testing the Managed Host Offline',
    52: 'Evals, Judges and Regression Baselines',
    53: 'Debugging Session and Host Traces',
    54: 'Designing Tools the Model Uses Well',
    55: 'Official SDK and API Upgrades',
    56: 'Teams and Evidence Messages',
    57: 'Workers in Host Git Worktrees',
    58: 'Tool Catalogs and Bounded Discovery',
    59: 'Routing with Verified Outcomes',
    60: 'Durable Long Running Agents',
    61: 'Exposing an Agent as an MCP Server',
    62: 'Retrieval RAG through Custom Tools',
    63: 'A Safe Database Agent',
    64: 'Browser Tools across Host and Cloud',
    65: 'Human Approval over Slack, Teams or Email',
    66: 'Real-time Frontends over WebSocket',
    67: 'A Multi-tenant SaaS Architecture',
    68: 'Scheduled and Event-driven Agents',
    69: 'Desktop and IDE Host Integration',
    70: 'Python Client for Managed Agents',
    71: 'A Data Analysis Agent',
    72: 'Document Generation with Skills',
    73: 'An Autonomous PR Reviewer and Fixer',
    74: 'Prompt Injection Red Teaming',
    75: 'Capstone Two: An Autonomous Engineering Team',
}
PRINCIPLES = {
    46: 'Compare counters at the same scope, and keep missing usage and savings claims separate.',
    47: 'Verify closed worker reports before a handoff, and account for shared and independent sessions separately.',
    48: 'The trusted host validates proposed operations. Attempts and observed effects are separate facts.',
    49: 'A useful CI result combines a validated report, bounded execution and confirmed cleanup.',
    50: 'Customer ownership, trusted host review and the refund ledger establish a completed refund.',
    51: 'Test the actual host modules with injected ports, explicit event outcomes and verified local effects.',
    52: 'Keep holdout labels outside agent context, compare reports with host effects, and block unsafe promotion.',
    53: 'Trace events, host decisions and effects separately; an incomplete stream cannot establish remote completion.',
    54: 'Make units, prerequisites and effects explicit in tool contracts, and let the host enforce review and idempotency.',
    55: 'Separate installed SDK, API compatibility and resource pins; server evidence governs upgrade rehearsals.',
    56: 'Task ownership, evidence delivery, acknowledgment and checked completion are separate host state changes.',
    57: 'Verify worker paths and behavior before serialized integration; preserve work when conflicts or cancellation block completion.',
    58: 'Discovery returns data; closed schemas and trusted host context still govern every dispatched effect.',
    59: 'Verify answers independently of confidence, and distinguish authored routing assumptions from observed API performance.',
    60: 'Persist authoritative effects and stable business keys; a journal or transcript alone cannot prevent every duplicate.',
    61: 'Separate local MCP transport identity from Managed session identity; closed tools and trusted host context govern the exposed capability.',
    62: 'Filter tenant and version before retrieval, then check same-run citations and policy correctness independently.',
    63: 'Read through fixed tenant-scoped queries; only a separate version-checked human transaction can change an order.',
    64: 'Host browser tools require allowlisted navigation, checked DOM state and actual proof; cloud and localhost are separate boundaries.',
    65: 'Immutable proposals and notifications do not authorize effects; a trusted unexpired reviewer decision and stable business key govern execution.',
    66: 'Transport reconnection and replay do not create another prompt; the host owns command identity, sequencing, deadlines and remote cleanup.',
    67: 'Trusted authentication selects tenant and project before access, cancellation or illustrative quota admission.',
    68: 'A trigger admits work; only a due host claim may execute an effect under its stable business key.',
    69: 'Explicit document identity, correlation, workspace trust, version and hash govern a reviewed patch; a proposal cannot apply itself.',
    70: 'Validate the isolated interpreter, pinned SDK, typed worker protocol and remote cleanup as separate facts.',
    71: 'Match numeric findings to recorded computations, units and quality choices; ledger evidence does not establish causal interpretation.',
    72: 'A closed specification and immutable local skill bundle feed a deterministic builder; independent package checks govern download.',
    73: 'Route eligible changed-line findings and verify real host tests before a local fix commit or ready handoff.',
    74: 'Separate attempted attacks, executed fictional effects and safe utility; scripted results and detector heuristics do not prove immunity.',
    75: 'Validate owned task graphs, actual Git and tests, review gates and durable state before handing a release to a person.',
}
PORT_NARRATION = {
 'port-customer-scope': 'The trusted context selects the owner, customer and conversation before a tool can inspect or change anything.',
 'port-owned-order': 'Order reads use the server-owned customer identity; a tool argument cannot switch customers.',
 'port-proposal': 'The closed proposal schema validates a refund request before the trusted host review.',
 'port-review-scope': 'Approval is a host operation scoped to the owner, customer and pending review.',
 'port-review-once': 'Only a matching pending approval can be consumed. A repeated decision is refused.',
 'port-ledger': 'The host writes the refund ledger and marks the approval consumed together.',
 'port-live-opt-in': 'Live execution requires a dedicated agent, a positive pinned version and an explicit live opt-in.',
 'port-pinned': 'The host retrieves that exact pinned agent version before creating a session.',
 'port-toolset': 'An archived agent, wrong capabilities or mismatched tools is refused before session creation.',
 'port-normalize': 'The host normalizes supported input, output and cache-read counters through the Lab fifteen accounting boundary.',
 'port-creation': 'Cache-creation tokens come from the supported model-usage record.',
 'port-comparable': 'The comparable flag requires retained identities and two observed usage records at the same scope.',
 'port-delta': 'Only comparable records produce per-reading token differences; otherwise the delta is null.',
 'port-uncertainty': 'The returned uncertainty explains changed identity or missing usage instead of inventing a result.',
 'port-multiagent': 'The configured multiagent type names the native Managed capability in the installed SDK.',
 'port-native': 'Only orchestrator and hierarchy use native worker-thread fixtures.',
 'port-capacity': 'The host rejects work when its bounded local capacity is reached.',
 'port-thread': 'Native workers share the parent session and have thread IDs. Host workers receive separate session IDs with no thread.',
 'port-scope': 'The usage scope is explicitly session shared or independent session.',
 'port-verify': 'Delayed or blocked workers have no accepted report; matching or corrected fixture data can become a verified report.',
 'port-gate-rule': 'The gate checks blocked and delayed worker states before allowing the handoff.',
 'port-aggregate': 'The host sums independent-session counters, while a native shared-session aggregate stays separate.',
 'port-schema': 'A closed input schema validates the proposed operation before policy or effects.',
 'port-path': 'The host resolves and compares the target path against its allowed directory.',
 'port-boundary': 'The deliberately naive policy permits effects; the layered path enforces host refusal.',
 'port-deny': 'Egress, file writes and secret reads have explicit host denial reasons.',
 'port-network': 'Only the naive path sends the fake canary to a local loopback witness.',
 'port-exposed': 'A completed secret read counts as exposure, even if the file was never modified.',
 'port-result': 'The result separately reports an attempt, execution and the blocking policy.',
 'port-limits': 'The authored fixture declares a deadline, one-message cap, zero-tool cap, concurrency bound and budget.',
 'port-facts': 'Unresolved approvals are denied, and a terminal interface is not required.',
 'port-report': 'The closed report schema rejects malformed or unexpected fields.',
 'port-pass': 'A validated report is returned only for a successful terminal outcome.',
 'port-exit': 'The outcome maps to exit zero for success, three for cancellation, and two for other failures.',
 'port-cleanup': 'An unconfirmed remote stop leaves cleanup pending rather than claiming an archive.',
 'port-interrupt': 'The host distinguishes an attempted interruption from an unconfirmed remote stop.',
 'port-abort': 'The evidence states the key limit: a local abort alone does not prove remote stop.',
}

# Each entry follows the cue order in capture-evidence.json. These descriptions
# explain the observed screen; no fixture is presented as a real model run.
SCENES = {
46: {
 'experiment': ['Compare authored usage counters. Managed Agents owns the internal prompt composition; this interface exposes no cache-control or time-to-live switch.', 'Choose a comparison scenario.', 'Compare usage fixtures runs only authored records.', 'The status distinguishes observations from savings measurements.'],
 'reused': ['The stable handbook is a short fictional field guide.', 'The dynamic suffix is recorded separately, even when its content is reused.', 'The first authored request has four hundred sixty input tokens and three hundred ten cache-creation tokens.', 'The second has one hundred ninety input tokens and two hundred seventy cache-read tokens. These are authored examples.'],
 'reused-delta': ['Check the retained session, model, tools and turn identity.', 'Comparable scopes allow a per-reading difference.', 'No hit, minimum size, price or savings is guaranteed. The host does not control the internal cache boundary.', 'The evidence explicitly identifies two authored model-request records and zero provider calls.'],
 'prefix': ['Change the prefix in the second input.', 'The first reading remains the baseline.', 'The second now illustrates new cache creation rather than cache reads.', 'A counter difference describes these observations; it does not establish a general cache rule.'],
 'model': ['The first reading uses one session and model identity.', 'Changing the model creates a fresh session.', 'The comparison refuses to subtract unlike identities.', 'Display the readings side by side and keep their uncertainty explicit.'],
 'tools': ['Record the first tools identity.', 'Changing the tool configuration also uses a fresh session.', 'No per-reading difference is calculated.', 'A changed tools identity prevents the retained-session comparison.'],
 'short': ['The short first input has no cache reads or creation.', 'The short second input also has zero cache counters.', 'Zero is an observed counter, not a promised minimum input size.'],
 'missing': ['The first usage record is missing, so every counter is unknown.', 'The second record is also unknown, rather than zero.', 'No difference can be calculated.', 'Cache behavior remains unknown when usage is not observed.'],
 'no-live': ['A host HTTP tap cannot expose the harness internal Messages calls.', 'The app reports that the missing-usage case is not comparable.', 'This screen uses no provider calls. Next, inspect the separate real terminal demonstration.'],
},
47: {
 'experiment': ['Compare native threads in one Managed session with a host pipeline of separate sessions. Closed reports and fixture values govern every handoff.', 'Choose an orchestration route.', 'Choose a sales scenario.', 'Run offline coordination generates authored fixtures.', 'The initial status identifies all displayed reports as fixtures.'],
 'native': ['The architecture is native, and the installed SDK supports the configured type. This fixture makes zero provider calls.', 'One parent session contains the worker threads.', 'The north worker has a thread inside that session.', 'The south worker has another thread in the same session.'],
 'native-usage': ['Worker usage is labeled session shared.', 'Parent final text says two hundred units across six orders.', 'The session total is a separate record; do not sum illustrative worker counters.', 'A convincing parent answer cannot replace verified worker reports.'],
 'host': ['The host architecture is different from native threads.', 'Workers belong to independent sessions, and the host checks their reports.', 'The north worker has its own session and no thread.', 'The south worker has a different session.'],
 'host-usage': ['Usage is labeled independent session.', 'The host aggregate sums independent-session readings, including the editor fixture.', 'Keep that aggregate separate from a native shared-session total.'],
 'incorrect': ['Choose the incorrect-total scenario.', 'The gate passes only after the incorrect report is corrected.', 'The south worker is marked corrected.'],
 'incorrect-detail': ['The raw report claims eight hundred sales.', 'The verified report contains eighty, matching the fixture.', 'One corrective round resolves the contradiction before the handoff.'],
 'delayed': ['Choose the delayed-worker scenario.', 'The gate waits instead of accepting an incomplete report.', 'The south worker is delayed.'],
 'delayed-detail': ['A deadline prevents late text from satisfying the gate.', 'The parent still believes the work is complete.', 'That belief does not provide a closed worker report.'],
 'blocked': ['Choose dependency failure.', 'The gate is blocked.', 'The north worker cannot proceed.'],
 'blocked-detail': ['The dependency failed before a report existed.', 'Usage is unknown for this failed worker.', 'No report is accepted after the dependency failure.'],
 'no-live': ['Installed type support does not establish account entitlement, and this exercise starts no live session.', 'The fixture gate remains blocked. Next, compare the separate real host and coordinator runs in the terminal.'],
},
48: {
 'experiment': ['Probe fictional secret reads, writes outside the allowed path and injected egress to a loopback sink.', 'Start with the layered host policy.', 'Choose a hostile action.', 'Run local probe executes the local range only.', 'Every secret in this range is a fake canary.'],
 'layered-secret-read': ['Choose the layered policy for a secret read.', 'The attempt exists, but least-privilege host policy prevents execution.', 'There are zero collector hits and no exposed canary.', 'Both temporary files remain unchanged.', 'The tool result reports the host denial.'],
 'layered-secret-ids': ['The tool event ID correlates a request; the separate business key protects idempotency.', 'The host checks path containment and its local witness.', 'The status confirms refusal by the read policy.'],
 'layered-out-of-scope-write': ['Select a write outside the allowed path.', 'The canonical host path boundary blocks execution.', 'The witness records zero collector hits.', 'The allowed report and fake canary remain unchanged.', 'The tool result is a denial.'],
 'layered-injected-egress': ['Select injected egress.', 'Host egress policy refuses the proposed operation.', 'Zero hits confirm that no loopback request reached the collector.', 'The temporary files remain unchanged.', 'A host denial is returned to the caller.'],
 'naive-secret-read': ['Now choose the naive prompt-only policy.', 'This time the fake secret read actually executes.', 'The canary is exposed even though no network request was made.', 'Reading does not modify the file, so unchanged bytes alone do not prove privacy.', 'The tool result visibly contains the fictional canary.'],
 'naive-injected-egress': ['Keep the naive policy and choose injected egress.', 'The local effect now executes.', 'The loopback collector records one hit.', 'The file contents stay unchanged while the network witness records the effect.', 'The result confirms a local fixture effect, with content redacted.'],
 'naive-out-of-scope-write': ['Choose the naive write outside the allowed directory.', 'The write executes without a host boundary.', 'Zero network hits do not make a file write safe.', 'The outside file now contains the unauthorized fixture write.', 'The result records that observed local effect.'],
 'no-live': ['Prompts and the working directory alone do not enforce file or network boundaries. All secrets here are fictional.', 'The last naive local effect executed. The next section shows a separately bounded real model request refused by the host.'],
},
49: {
 'experiment': ['The app runs authored machine-readable headless verdicts. Its Dockerfile and workflow are examples, and nothing is deployed.', 'Choose a scenario.', 'Run headless fixture exercises the local classification.', 'Offline verdicts need neither a terminal interface nor an API key.', 'A live pass also needs confirmed idle and archive; local abort alone leaves remote cleanup uncertain.'],
 'run-pass': ['Choose pass.', 'A completed fixture maps to CI exit zero.', 'The closed report validates task, verdict and summary.', 'The host records an archived session and explicit execution limits.', 'The status repeats the machine-readable outcome.'],
 'run-validation': ['Choose validation.', 'An unexpected report field causes validation failure and exit two.', 'No validated report is returned.', 'Closed schemas and unresolved-approval policy keep an invalid result from passing.'],
 'run-limit': ['Choose limit.', 'Reaching an execution limit produces exit two.', 'A bounded failure remains a failure even when the process stops cleanly.'],
 'run-error': ['Choose execution error.', 'An execution error also maps to exit two.', 'The status exposes the failure rather than hiding it in prose.'],
 'run-sigterm': ['Choose the signal-shaped cancellation fixture.', 'Cancellation maps to exit three.', 'The fixture reports an attempted interruption and archived cleanup.', 'This is a modeled signal path, rather than a deployed process receiving a real signal.'],
 'run-concurrency': ['Choose concurrency.', 'Capacity is rejected before a session exists.', 'The evidence records reservation refusal and no provider call.'],
 'run-unconfirmed': ['Choose unconfirmed stop.', 'Unconfirmed remote stop cannot pass CI.', 'Cleanup stays pending even after the local request ends.', 'Local abort is not proof that the remote session stopped.'],
 'no-live': ['The app remains offline and deploys no container or workflow.', 'The last fixture still has an unconfirmed remote stop.', 'Next, the terminal runs one real headless turn and checks its report and archive.'],
},
50: {
 'experiment': ['The support desk retains a conversation and lets the trusted host review a proposed refund. Only the host ledger establishes an issued refund.', 'Choose the fictional customer, Avery or Blair.', 'Start with the offline scripted desk. Live Managed is a separate explicit opt-in.', 'Ask to refund twenty-five for order O one thousand one.', 'Send the request to the desk.'],
 'backoffice': ['The first customer owns the lamp and cable orders. The lamp has five thousand cents remaining.', 'Initially, no refund or ticket exists.', 'This baseline uses no provider calls.'],
 'pending': ['The retained fixture conversation is waiting for approval.', 'The customer has requested a refund, but a request is not an issued payment.', 'The pending host review names the order and two thousand five hundred cents.', 'The trusted host reviewer may approve once. An agent cannot authorize its own effect.'],
 'approved': ['After host approval, the agent returns a structured resolved summary.', 'The summary validates as a report, but does not itself prove the refund.', 'The refund ledger now contains one entry for two thousand five hundred cents.', 'The lamp order has two thousand five hundred cents remaining. These host records establish the effect.'],
 'events': ['Correlated event evidence links the custom tool request to the session lifecycle.', 'The fixture reports zero provider calls and unknown billed usage.'],
 'audit': ['The audit records conversation creation, refund proposal and the issued refund as separate steps.', 'The host decision was applied once.'],
 'closed': ['Closing the conversation changes its state to closed and records archived cleanup.', 'The status confirms cleanup.'],
 'foreign': ['Now ask the first customer to read an order owned by the second customer. The host denies it.', 'The validated summary reports rejection.', 'The visible order list remains scoped to the first customer.'],
 'injected': ['The second customer asks for a refund as an injected order note suggests. The host rejects it.', 'The structured summary records rejection.', 'The monitor order remains unchanged.', 'No refund ledger entry is created. An order note cannot override the trusted refund policy.'],
 'evals': ['The deterministic host cases check an approved damaged-item refund, policy rejection, customer ownership and an injected order note.', 'All four cases ran offline. These checks validate host handlers, rather than evaluating a live model.'],
 'no-live': ['Live Managed is an explicit opt-in separate from the scripted desk.', 'Without a dedicated pinned agent and the live opt-in, the server refuses before any provider call.', 'The reviewer is assigned by the server. Agent-provided names and reassuring prose never authorize a refund.'],
}}


def shot(d, identity, title, texts):
    source = next(s for s in d.e['shots'] if s['id'] == identity)
    assert len(texts) == len(source['cues']), (identity, len(texts), len(source['cues']))
    d.shot(identity, title, {cue['id']: text for cue, text in zip(source['cues'], texts)})


def infographic_regions(d):
    assets = json.loads((ROOT / 'public/infographics/pilot-manifest.json').read_text(encoding='utf-8'))['assets']
    labels = {
        'concepts': ['The objective.', 'Core rule.', 'Keep the boundary clear.', 'How the flow works.', 'Evidence to inspect.', 'Put it to the test.'],
        'lab': ['Prepare the baseline.', 'Run the comparison.', 'Inspect the boundary.', 'Follow the workflow.', 'Verify the result.', 'Reflect and record.'],
    }
    if LAB == 65:
        labels = {
            'concepts': ['Immutable proposal.', 'Separate identities.', 'Notification only.', 'Trusted reviewer.', 'Effect ledger.', 'Audit the boundary.'],
            'lab': ['Preview proposal.', 'Notify locally.', 'Inspect guards.', 'Decide explicitly.', 'Try duplicate click.', 'Record the evidence.'],
        }
    for kind, indices in [('concepts', [1, 2, 3, 6]), ('lab', [1, 2, 3, 4])]:
        text = assets[f'{LAB}:{kind}']['text']
        regions = []
        for n in indices:
            start = text.index(labels[kind][n - 1])
            end = text.index(labels[kind][n], start) if n < 6 else len(text)
            narration = text[start:end].strip()
            regions.append((n, labels[kind][n - 1].rstrip('.'), narration))
        d.regions(kind, regions)


def live_terminal(d):
    source = d.P / 'terminal/live.raw.txt'
    if not source.exists():
        return
    lines = d.transcript('live.raw.txt')
    assert lines and not any('sk-ant-' in line or 'Authorization:' in line for line in lines)
    if LAB == 62:
        diagnostic = json.loads((d.P/'terminal/report-diagnostic.json').read_text(encoding='utf-8'))
        assert diagnostic['archived'] and diagnostic['checked']['citationsValid'] and not diagnostic['checked']['verified']
        assert '30 days' in diagnostic['report']['answer'] and '365 days' in diagnostic['report']['answer'] and 'was ignored' in diagnostic['report']['answer']
        assert any('Real retrieval report failed the same-run evidence check' in line for line in lines)
        shutil.copy2(d.P/'terminal/report-diagnostic.json',d.V/'live-report-diagnostic.json')
    elif LAB == 64:
        diagnostic = json.loads((d.P/'terminal/report-diagnostic.json').read_text(encoding='utf-8'))
        assert diagnostic['archived'] and diagnostic['toolCalls']==1 and not diagnostic['strictJsonValid']
        assert diagnostic['hostBrowserResult']['verified'] and diagnostic['rawReport'].startswith('```json')
        assert hashlib.sha256((d.P/'terminal/live-proof.png').read_bytes()).hexdigest()==diagnostic['proof']['sha256']
        assert any('Live demonstration failed: SyntaxError:' in line for line in lines)
        shutil.copy2(d.P/'terminal/report-diagnostic.json',d.V/'live-report-diagnostic.json')
        shutil.copy2(d.P/'terminal/live-proof.png',d.V/'live-browser-proof.png')
    elif LAB != 46:
        assert any('Archived:' in line or line.startswith('Archived sesn_') for line in lines), 'Live archive evidence missing'
        assert not any('failed:' in line.lower() for line in lines), 'Failed live run needs explicit editorial handling'
    else:
        assert 'cache creation 7841' in ' '.join(lines) and 'Cleanup: archived' in lines
        diagnostic = json.loads((d.P/'terminal/session-diagnostic.json').read_text(encoding='utf-8'))
        assert diagnostic['archived'] and any(reason['type']=='budget_reached' for reason in diagnostic['stopReasons'])
        shutil.copy2(d.P/'terminal/session-diagnostic.json',d.V/'live-session-diagnostic.json')
    if LAB == 66:
        diagnostic=json.loads((d.P/'terminal/websocket-diagnostic.json').read_text(encoding='utf-8'))
        assert diagnostic['archiveConfirmed'] and diagnostic['createdSessions']==1 and diagnostic['eventSendRequests']==1
        shutil.copy2(d.P/'terminal/websocket-diagnostic.json',d.V/'live-websocket-diagnostic.json')
    if LAB == 70:
        diagnostic=json.loads((d.P/'terminal/python-diagnostic.json').read_text(encoding='utf-8'))
        assert diagnostic['archiveConfirmed'] and diagnostic['readiness']['capable'] and not diagnostic['protocolError']
        shutil.copy2(d.P/'terminal/python-diagnostic.json',d.V/'live-python-diagnostic.json')
    # Terminal pages retain exact output. Spoken text omits opaque identifiers.
    for i in range(0, len(lines), 5):
        group = lines[i:i + 5]
        display = []
        narration = {}
        for j, line in enumerate(group):
            cid = f'live-{i + j}'
            display.append((line, cid))
            speech = re.sub(r'\b(?:sesn|agent|sthr|sevt)_[A-Za-z0-9]+', 'the recorded resource', line)
            speech = speech.replace('→', ',').replace('·', ',').replace('…', '').replace('SHA256', 'hash')
            prefix=line.strip()
            explanations={
              'Lab 46 facts:': 'The script imports the lab facts. Reading those facts makes no provider request.',
              'Host controls internal': 'The host does not control the internal Managed cache boundary.',
              'Stable system prompt:': 'The script records the stable system prompt length and a content hash before starting the session.',
              'Turn 1:': 'The first turn reaches idle with the same session, system, model and tools.',
              'Offline Lab47': 'The host pipeline fixture uses the lab class, passes its verification gate and makes zero provider calls.',
              'HOST-DRIVEN': 'In the host-driven path, the host explicitly orders the counter and reviewer sessions.',
              'counter: session': 'The counter finishes in its own independent session, without a worker thread.',
              'Host gate on counter': 'The host validates both regional reports against the closed schema and fictional fixture values before continuing.',
              'reviewer: session': 'Only after that gate passes does the host call the separate reviewer session.',
              'reviewer said:': 'The clipped reviewer response approves the host-verified total of two hundred sales.',
              'MODEL-DRIVEN': 'The model-driven path uses the existing coordinator agent with its predefined workers.',
              'session.thread_created': 'The provider emits a real worker-thread creation event inside the coordinator session.',
              'agent.custom_tool_use add_numbers': 'The calculator thread asks to add one hundred twenty and eighty. The host answers two hundred through the correlated custom-tool result.',
              'Coordinator idle after': 'The coordinator reaches idle after one worker thread, a sent and received thread message, and one custom-tool request.',
              'Parent final text:': 'The clipped parent answer reports the calculator result separately from the host verification gate.',
              'One session sesn_': 'The coordinator reports one session-shared usage total for all its threads. It is not an aggregate of independent sessions.',
              'Lab 48 worker environment': 'The scrubbed worker environment exposes only the fictional lab value.',
              'Only range_operation': 'The agent receives one custom tool, with no built-in tools, MCP servers or skills.',
              'agent.custom_tool_use range_operation': 'The model proposes a range operation, and its closed input schema validates.',
              'Host policy:': 'The trusted host refuses egress. The operation does not execute, and the loopback collector records zero hits.',
              'Canary exposed': 'The canary is not exposed and the fictional canary file remains unchanged.',
              'Tool result correlated': 'The denial is returned against the actual provider tool event ID, before any egress occurs.',
              'Observed custom-tool requests': 'Exactly one custom-tool request was observed in this demonstration.',
              'The audit deliberately': 'This controlled audit explicitly requests a denied operation. It demonstrates host enforcement, rather than measuring spontaneous resistance to prompt injection.',
              'Lab49Headless fixture': 'The lab class first produces its offline pass fixture with exit zero and no provider calls.',
              'Headless process:': 'The real demonstration runs without a terminal interface or browser. It allows one message and no tools.',
              'Real outcome:': 'The real turn completes with a valid closed report and zero tool calls, so the host classifies it as a pass.',
              'Validated report:': 'The validated report checks the fictional arithmetic: one hundred twenty plus eighty equals the expected two hundred.',
              'Host exit mapping:': 'The successful result maps to exit zero. An unresolved approval could not pass this gate.',
              'The live deadline': 'The live demonstration uses a bounded one hundred eighty second deadline. The authored fixture retains its separate three second limit.',
              'CI process exit code:': 'After confirmed archive, the real headless process exits with zero. No container or workflow was deployed.',
              'Actual returned ledger:': 'The actual host ledger records computation C one. Clean January revenue totals six thousand four hundred ninety-eight euros across eight eligible rows, with no empty revenue cells skipped in this month. The full returned JSON remains available as evidence.',
              'Independent package SHA256:': 'The host records the independent package digest. It identifies the exact verified document bytes; it does not establish visual pagination in Word.',
              'Dedicated native team readiness:': 'The readiness check makes no provider calls. The dedicated live team is unavailable because its isolated key and three pinned role agents are not configured. The separate existing-agent planner control is shown next.',
            }
            for start, explanation in explanations.items():
                if prefix.startswith(start):
                    speech=explanation
                    break
            if prefix.startswith('Session sesn_'):
                speech='The script creates a real Managed session using the existing pinned agent and environment.'
            if prefix.startswith('Archived:') or prefix.startswith('Archived sesn_') or prefix.startswith('Cleanup: archived'):
                speech='The provider confirms that this session was archived.'
            if LAB==48 and prefix.startswith('Reply:'):
                speech='The clipped agent reply summarizes the fictional document.' if 'summary' in prefix.lower() else 'The clipped agent reply acknowledges the host denial and says it will not retry.'
            if LAB==46 and prefix.startswith('model-request:'):
                speech='The real model-request usage records four input tokens, twenty-seven output tokens, zero cache reads and seven thousand eight hundred forty-one cache-creation tokens.'
            if 'model [object Object]' in speech:
                speech = 'The session was created with the existing pinned agent. This diagnostic printed the model object without formatting it.'
            if LAB == 46 and 'Live demonstration failed:' in line:
                speech = 'The second send was refused with HTTP four hundred. A read-only check confirmed the first turn reached the session budget, so no second paid run was attempted.'
            if LAB == 62 and 'Live demonstration failed:' in line:
                speech = 'The live control flags a strict-verifier rejection. Read-only inspection confirms the answer states thirty days and rejects the imported alternative, but the simple verifier also rejects that negative mention.'
            if LAB == 64 and ('Live demonstration failed:' in line or 'is not valid JSON' in line):
                speech = 'The real browser evidence was verified, but the final report has Markdown fences and fails the strict JSON parser. Read-only inspection confirms the successful host DOM checks and the archived session.'
            narration[cid] = speech
        d.terminal(f'Live terminal evidence · {i // 5 + 1}', display, narration,
                   note='ACTUAL SAVED OUTPUT · EXISTING AGENT AND ENVIRONMENT')


def main():
    assert LAB in TITLES
    capture_file=ROOT/f'presentations/managed-agents-lab{LAB}-walkthrough/platform/capture-evidence.json'
    capture=json.loads(capture_file.read_text(encoding='utf-8'))
    live_setup_only=(LAB==50 and not any(s['id']=='live-answer' for s in capture['shots'])) or (LAB>=51 and not (ROOT/f'presentations/managed-agents-lab{LAB}-walkthrough/terminal/live.raw.txt').exists())
    suffix=('Local Evidence Draft' if LAB>=61 else 'Offline and Live Setup') if live_setup_only else 'Offline and Live'
    d = Deck(LAB, f'Lab {LAB} Step by Step: {TITLES[LAB]}, {suffix}', 'Production and host boundaries')
    assert not d.e['errors']
    d.cover(f'CLAUDE MANAGED AGENTS · LAB {LAB}',
            f'<h2>In this lab</h2><p>{html.escape(TITLES[LAB])}<br>Inspect the baseline.<br>Compare the evidence.<br>Follow the host boundary.</p>',
            f'Welcome to Lab {LAB}, {TITLES[LAB]}. {PRINCIPLES[LAB]} We will use real captures of the running platform, '
            + ('inspect the offline evidence and prerequisites for live execution' if live_setup_only else 'separate offline evidence from a bounded live demonstration')
            + ', and connect the result to the TypeScript source.')
    if LAB>=50:
        d.slides[0]['body']=d.slides[0]['body'].replace('<h1>','<h1 style="font-size:52px;max-width:1760px">',1)
    d.overview('OBSERVE · COMPARE · VERIFY', 'Follow the evidence from screen to host', [
        ('ov-baseline', '1 · BASELINE', 'Learn the contract', 'Objective and concept map', 'First, identify the objective and the boundary in the Concept map.'),
        ('ov-fixtures', '2 · COMPARE', 'Run the exercise', 'Offline scenarios and limits', 'Next, compare the offline scenarios and inspect their recorded outcomes.'),
        ('ov-live', '3 · LIVE', 'Inspect local limits' if LAB>=61 and live_setup_only else 'Inspect live setup' if live_setup_only else 'Inspect real evidence', 'No live model recorded' if LAB>=61 and live_setup_only else 'A separate bounded script' if live_setup_only and LAB>=51 else 'Pinned agent and host review' if live_setup_only else 'Bounded run and cleanup', 'Then distinguish these local protocol experiments from a live Managed model demonstration, which this draft has not recorded.' if LAB>=61 and live_setup_only else 'Then inspect the separately bounded terminal demonstration, which uses existing resources and confirms cleanup.' if live_setup_only and LAB>=51 else 'Then inspect the pinned-agent requirements and trusted host review for live execution.' if live_setup_only else 'Then inspect the actual live evidence and its limits, including confirmed cleanup.'),
        ('ov-source', '4 · SOURCE', 'Explain the guard', 'TypeScript and knowledge check', 'Finally, connect the visible behavior to its TypeScript guard and check your understanding.'),
    ], PRINCIPLES[LAB])
    shot(d, 'lesson', f'Open Lab {LAB}', [f'Open Lab {LAB}, {TITLES[LAB]}.', d.e['shots'][0]['cues'][1]['text']])
    learn = next(s for s in d.e['shots'] if s['id'] == 'learn')
    shot(d, 'learn', 'Start in the Learn tab', [learn['cues'][0]['text']])
    infographic_regions(d)
    if LAB>=51:
        assert d.e.get('captureComplete') and d.e.get('stagedScenes'), 'Offline capture did not finish'
        for scene in d.e['stagedScenes']:
            d.shot(scene['id'],scene['title'],scene['narration'])
    else:
        for identity, texts in SCENES[LAB].items():
            shot(d, identity, identity.replace('-', ' ').title(), texts)
    if LAB == 50:
        if d.e.get('liveAttemptNotes'):
            d.compare('A real contract mismatch, then a corrected pin', 'Keep the refused attempt in the evidence', [
                ('serial-observed','OBSERVED','Two tools in one pause','Dedicated agent version one','The first real session requested two custom tools at the same pause. The host refused the batch before any refund, and its session was archived.'),
                ('serial-contract','HOST CONTRACT','One correlated tool at a time','No authority was relaxed','The host still accepts one correlated custom-tool call per pause. Its customer ownership, policy and approval checks remain in force.'),
                ('serial-pin','CORRECTION','Pin agent version two','Explicit serial-tool instructions','The dedicated agent instructions now require one tool at a time and direct refund proposals when the order and amount are supplied. The next screens show the separately verified retry.'),
            ],'The archived first-attempt diagnostic is retained with the capture evidence.')
        live_scenes = {
          'live-run': ['Select the dedicated Live Managed mode.', 'Request the same fictional damaged-item refund.', 'Send one live customer request through the app.'],
          'live-pending': ['The real conversation is retained by the Managed API.', 'The agent has proposed an action rather than issuing a refund.', 'The trusted host review remains a separate gate.'],
          'live-answer': ['Inspect the real agent response after the host decision.', 'Check the closed summary independently of the host effects.', 'The host refund ledger records what actually happened.'],
          'live-usage': ['These are the reported usage counters for the real Managed conversation.'],
          'live-closed': ['The real conversation is now closed and its cleanup is archived.', 'The app confirms that the session was archived.'],
        }
        if d.e.get('liveReportAudit', {}).get('valid') is False:
            live_scenes['live-answer'] = [
                'Inspect the real agent response after the host decision. Its prose still describes a pending review, even though the host has approved the refund.',
                'The displayed validated summary is none yet: this actual report failed the closed schema. A model response is not a validated host conclusion.',
                'The host ledger independently records the approved twenty-five-dollar fictional refund. Its remaining balance also decreased by twenty-five dollars.',
            ]
        for identity, texts in live_scenes.items():
            if any(s['id'] == identity for s in d.e['shots']):
                shot(d, identity, identity.replace('-', ' ').title(), texts)
    live_terminal(d)
    if LAB == 75 and (d.P/'terminal/live.raw.txt').exists():
        d.compare('Keep the capstone evidence separate','Three different execution scopes',[
            ('team-scripted','BROWSER','Scripted roles','Actual Git and Node tests','The browser capstone uses scripted role responses with actual worktrees, test execution, review gates, integration and durable journals.'),
            ('team-planner','LIVE CONTROL','One existing-agent planner','Proposal checked, session archived','A real model proposed the closed task plan. Host validation accepted its ownership and dependency graph and rejected a separate protected-module control. The proposal created no workers.'),
            ('team-native','NATIVE TEAM','Dedicated setup unavailable','Isolated key and three role pins missing','The recorded readiness check found no configured dedicated key or pinned planner, developer and reviewer. No persistent role agents were provisioned and this video does not claim a dedicated live team run.'),
        ],'Publication remains a separate human action.')
    if LAB == 62 and (d.P/'terminal/report-diagnostic.json').exists():
        d.compare('A real answer exposes the verifier limit','Separate evidence validity from a strict text oracle',[
            ('rag-live-answer','ANSWER','Current thirty-day policy','Imported claim explicitly ignored','The actual answer states thirty days and explicitly says the imported three-hundred-sixty-five-day claim was untrusted and ignored.'),
            ('rag-live-citations','CITATIONS','Same-run quotes match','Current policy chunks','The exact citations and quotes pass the same-run evidence check. The session was archived and the saved response was inspected read-only.'),
            ('rag-live-limit','LIMIT','Negative mention also rejected','Conservative regular expression','The simple policy checker rejects any occurrence of sixty, ninety or three hundred sixty-five days, even a rejected claim. This observed false rejection is a verifier limitation, not evidence that the answer adopted the imported instruction.'),
        ],'The complete read-only diagnostic is retained with the video. No second paid model run was made.')
    if LAB == 64 and (d.P/'terminal/report-diagnostic.json').exists():
        d.compare('Verified browser proof, rejected report framing','Keep tool evidence and final format separate',[
            ('browser-live-proof','HOST PROOF','DOM and screenshot verified','Three actual MCP calls','Read-only provider inspection confirms navigation, snapshot and screenshot completed. The host result verified the actual product and price and saved a real PNG proof.'),
            ('browser-live-boundary','BOUNDARY','Host adapter, cloud session','Separate local MCP connection','One real Managed custom-tool request invoked the host browser adapter. The cloud model did not connect to host localhost or a remote browser MCP server.'),
            ('browser-live-report','FINAL REPORT','Markdown fences rejected','Strict JSON parser','The model returned the correct product and price inside Markdown fences. That framing is not a valid raw JSON document, so the strict parser rejected it. The session was archived and no second paid run was made.'),
        ],'The saved PNG and complete read-only diagnostic are retained with the video.')
    if LAB == 70 and (d.P/'terminal/python-diagnostic.json').exists():
        d.compare('Local worker fixtures and one actual Python SDK turn','Keep interpreter and remote-session evidence separate',[
            ('python-local','BROWSER WORKSHOP','Standard-library fixtures','No package installation or provider call','The browser workshop exercised real Python processes with authored protocol and retained-handle data. Its initial interpreter probe did not install an SDK or start a model.'),
            ('python-live','LIVE TERMINAL','Isolated project environment','Exact Python package pin','The separate terminal control used the project virtual environment and verified the exact installed SDK API surface before making one actual Python SDK turn.'),
            ('python-cleanup','VERIFY','Independent archive check','No extra retained live turns','The typed worker result reported completion and archive, and the provider state was retrieved independently. Offline retained-handle scenes were not additional live SDK turns.'),
        ],'The Python worker diagnostic is retained with the video.')
    if live_setup_only and LAB>=51:
        d.compare('Offline evidence and a separate live path','What the app can establish',[
            ('vs-local','OFFLINE APP','Actual local host code','Injected ports and authored traces','The app runs actual local host modules with authored inputs or recorded events. Its zero provider calls do not establish live model quality.'),
            ('vs-live-path','LIVE PATH','Not yet recorded' if LAB>=61 else 'One bounded terminal sample','Separate live adapter required' if LAB>=61 else 'Existing agent and environment','A separate bounded live adapter is still required. The local app experiment starts no Managed model and this draft records no live model demonstration.' if LAB>=61 else 'A separately authorized terminal script can make one real model turn with existing resources and then archive its session. This draft has not recorded that live demonstration.'),
            ('vs-limits','LIMITS','Keep conclusions scoped','No synthetic quality score',PRINCIPLES[LAB]),
        ],'This draft records local host experiments and has no live model demonstration.' if LAB>=61 else f'The runnable terminal demonstration is scripts/live-labs/{"operations-live" if LAB>=56 else "quality-live"}.ts, with this lab number.')
    elif live_setup_only:
        d.compare('Offline evidence and the live path', 'Keep the prerequisites explicit', [
            ('vs-offline', 'OFFLINE', 'Host ledger verified', 'Scripted support conversation', 'The scripted desk demonstrates customer ownership, trusted review and the refund ledger without provider calls.'),
            ('vs-setup', 'LIVE SETUP', 'Dedicated pinned agent', 'Five closed custom tools', 'A live conversation requires a dedicated pinned agent with the declared five-tool contract and an explicit live opt-in. No live capstone run is shown here.'),
            ('vs-host', 'HOST', 'Review still governs', 'The model cannot approve itself', 'Customer ownership and the trusted reviewer continue to govern effects in live mode. The session must be archived when the conversation closes.'),
        ], PRINCIPLES[LAB])
    elif LAB == 46:
        d.compare('What the live run established', 'One observation, no savings claim', [
            ('vs-fixture', 'OFFLINE', 'Two authored readings', 'Comparable fixture identities', 'The app demonstrates comparisons using authored records with explicit identities and scopes.'),
            ('vs-live', 'LIVE', 'Creation observed', 'One real model request', 'The real first request reported cache creation. The session reached its budget and refused the second send.'),
            ('vs-limit', 'LIMIT', 'No cache-hit comparison', 'Archived; no paid retry', 'There is no real second-turn cache-read comparison and no savings measurement. Cleanup was confirmed and the run was not repeated.'),
        ], 'A budget stop remains part of the evidence.')
    else:
        d.compare('Offline and live, compared', 'Which evidence supports the conclusion?', [
            ('vs-source', 'SOURCE', 'Separate evidence', 'App fixture and live evidence', 'The offline screens and the real provider evidence are separate sources.'),
            ('vs-host', 'HOST', 'Verify the boundary', 'Checks before conclusions', PRINCIPLES[LAB]),
            ('vs-limit', 'LIMIT', 'Bounded demonstration', 'No general guarantee', 'One bounded demonstration establishes its observed outcome. It does not guarantee future model behavior or deploy any infrastructure.'),
        ], PRINCIPLES[LAB])
    code = [s for s in d.e['shots'] if s['id'].startswith('code-')]
    for source in code:
        cue = source['cues'][0]
        shot(d, source['id'], 'TypeScript · ' + cue['text'], ['Open the TypeScript source. ' + cue['text'] + '. Follow this highlighted entry point to its delegated host implementation. Reading the source does not execute a provider request.'])
    d.mapping('Where is the enforcement boundary?', [
        ('map-sdk', 'AGENT SDK', 'Local orchestration', 'Agent loop in your process', 'With the Agent SDK, your process hosts the agent loop and its surrounding policies.'),
        ('map-managed', 'MANAGED AGENTS', 'Cloud session', 'Supported events and counters', 'This platform uses Managed Agents beta sessions. The cloud owns the model loop; the host observes supported events and usage.'),
        ('map-host', 'THIS PLATFORM', 'Trusted host checks', 'Validate before effects', PRINCIPLES[LAB]),
    ], 'A prompt can request behavior; the host must establish what actually happened.')
    for source in d.e['shots']:
        if source['id'].startswith('port-'):
            d.port(source['id'], 'Host implementation · ' + source['id'].removeprefix('port-'), {
                c['id']: d.e.get('sourceNarration',{}).get(c['id']) or PORT_NARRATION[c['id']]
                for c in source['cues']
            })
    knowledge = next(s for s in d.e['shots'] if s['id'] == 'knowledge')
    d.knowledge(knowledge['cues'][0]['text'], knowledge['cues'][1]['text'].split('You can change')[0].strip())
    d.summary([
        ('sum-evidence', 'OBSERVE', 'Name the evidence', 'Fixture, local effect or live event', 'Name the source before drawing a conclusion: an authored fixture, a local host effect or a real provider event.'),
        ('sum-boundary', 'VERIFY', 'Check the boundary', 'Inspect host outcomes', PRINCIPLES[LAB]),
        ('sum-limit', 'RECORD', 'Keep the limits', 'Cleanup and uncertainty', 'Record cleanup and remaining uncertainty alongside the result. A saved note is self-assessment, rather than proof of another live run.'),
    ], f'Lab {LAB + 1}')
    d.finish()


if __name__ == '__main__':
    main()
