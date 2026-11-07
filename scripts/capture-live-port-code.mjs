// Capture the supporting "live port" source of a lab: the exact Managed Agents API calls behind Run live.
// Usage: node scripts/capture-live-port-code.mjs <lab number>   (requires `npm run dev`; no lab request is made)
// Shots are appended to presentations/managed-agents-labNN-walkthrough/platform/capture-evidence.json (phase "port").
import {captureBrowser} from './walkthrough-capture-browser.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const origin=process.env.LEARNING_ORIGIN??'http://127.0.0.1:5174';
// Each cue is [id, first-line pattern, last-line pattern (optional)]. Patterns match line text, not line numbers.
const configs={
 71:{file:'server/lib/lab71-analysis.ts',shots:[
  {id:'port-analysis-schema',cues:[['analysis-schema','verify(raw: unknown)'],['analysis-evidence','if (!computation) { errors.push']]},
  {id:'port-analysis-value',cues:[['analysis-tolerance','Math.abs(item.value - finding.value)'],['analysis-prose','numeric prose is unchecked']]},
  {id:'port-analysis-chart',cues:[['analysis-chart','for (const id of report.chartIds)'],['analysis-meaning','Evidence matching does not establish causal']]}],narration:{
   'analysis-schema':'The host parses a closed report schema before checking its claims.',
   'analysis-evidence':'An invented computation identifier is refused.',
   'analysis-tolerance':'Values and units must match recorded evidence within the explicit tolerance.',
   'analysis-prose':'Numbers embedded in prose are explicitly outside this numeric field check.',
   'analysis-chart':'Each chart identifier must exist and match the report quality choice.',
   'analysis-meaning':'Evidence matching does not establish a causal or sensible interpretation.'}},
 72:{file:'server/lib/lab72-docgen.ts',shots:[
  {id:'port-doc-policy',cues:[['doc-policy',"policy(command: string)"]]},
  {id:'port-doc-build',cues:[['doc-integrity',"if (!await this.unchanged(session))"],['doc-fixed',"await exec(process.execPath"]]},
  {id:'port-doc-download',cues:[['doc-download','async file(owner: string'],['doc-recheck','if (!inspectDocx(bytes, session.spec).valid']]}],narration:{
   'doc-policy':'The command probe never executes strings. Only a typed builder may reach fixed arguments.',
   'doc-integrity':'The immutable local skill manifest is checked before building.',
   'doc-fixed':'A fixed Node builder runs without a shell under a bounded host invocation.',
   'doc-download':'Download requires an owned verified file and an unchanged skill bundle.',
   'doc-recheck':'The host rechecks the actual package and digest immediately before returning its bytes.'}},
 73:{file:'server/lib/lab73-prbot.ts',shots:[
  {id:'port-pr-routing',cues:[['pr-route','export function routeFindings'],['pr-changed',"finding.confidence === 'high'"]]},
  {id:'port-pr-tests',cues:[['pr-suite',"name: 'actual behavioral suite'"],['pr-commit',"await hostGit(session.root, 'add'"],['pr-full',"name: 'postcommit full suite'"]]}],narration:{
   'pr-route':'The host parses closed review findings before routing them.',
   'pr-changed':'Only eligible high-confidence findings on actual changed lines enter the automatic fixer.',
   'pr-suite':'The actual behavioral suite must pass without timeout or test gaming.',
   'pr-commit':'A local fix commit is created only after every preceding host gate passes.',
   'pr-full':'A second actual full suite verifies the resulting commit before a ready handoff.'}},
 74:{file:'server/lib/lab74-redteam.ts',shots:[
  {id:'port-attack-normalize',cues:[['attack-normalize',"export function normalized"],['attack-decode','decodeURIComponent(text)']]},
  {id:'port-attack-policy',cues:[['attack-policy',"allowed = call.name === 'read_fixture'"],['attack-effect','const effect: Effect =']]},
  {id:'port-attack-oracle',cues:[['attack-oracle','export function deskOracle'],['attack-executed','for (const effect of effects) if (effect.executed)']]}],narration:{
   'attack-normalize':'The detector normalizes bounded untrusted payload text.',
   'attack-decode':'Bounded decoding improves this heuristic but does not prove complete detection.',
   'attack-policy':'A separate deterministic capability and output policy decides whether a fictional operation may execute.',
   'attack-effect':'Each effect records attempted and executed as separate facts.',
   'attack-oracle':'The oracle checks final output, effects and safe draft utility.',
   'attack-executed':'An attempted forbidden tool is not counted as a successful effect unless the host executed it.'}},
 75:{file:'server/team/team.ts',shots:[
  {id:'port-team-plan',cues:[['team-plan','export function validatePlan'],['team-schema','const parsed = PlanSchema.safeParse']]},
  {id:'port-team-owners',cues:[['team-owner','Duplicate owner for'],['team-protected','cannot overwrite an existing test'],['team-modules','cannot modify the base notes module']]},
  {id:'port-team-cycle',cues:[['team-cycle','Dependency cycle:']]},
  {id:'port-team-live',file:'server/team/live.ts',cues:[['team-readiness','export function liveTeamReadiness'],['team-isolated','if (!env.LAB75_ANTHROPIC_API_KEY?.trim())']]}],narration:{
   'team-plan':'The trusted host validates the proposed task graph before it creates workers.',
   'team-schema':'Closed schema validation precedes ownership and dependency checks.',
   'team-owner':'A file cannot have two task owners.',
   'team-protected':'Tasks cannot overwrite an existing protected test.',
   'team-modules':'The base notes module remains outside worker ownership.',
   'team-cycle':'Cyclic task dependencies are refused before execution.',
   'team-readiness':'Dedicated live readiness only checks local configuration and makes no provider calls.',
   'team-isolated':'Native role execution requires the dedicated key and explicit live opt-in in addition to pinned role resources.'}},
 66:{file:'server/concepts/66-realtime-websocket.ts',shots:[
  {id:'port-ws-buffer',cues:[['ws-buffer','run.frames.push(frame); if (run.frames.length > 64)'],['ws-send','send(socket, frame); } return frame;']]},
  {id:'port-ws-replay',cues:[['ws-gap','if (afterSeq < first - 1)'],['ws-after','for (const frame of run.frames) if (frame.seq > afterSeq)']]},
  {id:'port-ws-dedup',cues:[['ws-command-replay','replay(run, socket, run.seq > 64 ? run.seq - 64 : 0); return; }'],['ws-one-message',"if (run.state !== 'idle')"],['ws-remember','remember(key, run.id); run.messageCommand = parsed.commandId;']]}],narration:{
   'ws-buffer':'The host retains only the last sixty-four sequenced frames.',
   'ws-send':'Only open attached transports receive the current frame; the host retains run ownership.',
   'ws-gap':'A client that missed evicted frames receives an explicit replay gap.',
   'ws-after':'Reconnection returns only frames after the requested acknowledged sequence.',
   'ws-command-replay':'A repeated message command replays existing evidence instead of sending another model prompt.',
   'ws-one-message':'A run accepts a message only while it is idle.',
   'ws-remember':'The host records the command identity before starting work.'}},
 67:{file:'server/concepts/67-multi-tenant-saas.ts',shots:[
  {id:'port-tenant-owner',cues:[['tenant-identity','private owned(token: string | undefined, id: string)'],['tenant-scope','if (!run || run.principal.tenant !== principal.tenant || run.principal.project !== principal.project)']]},
  {id:'port-tenant-quota',cues:[['tenant-concurrency','if (usage.active >= 1)'],['tenant-budget','if (usage.spent + usage.reserved + 2 > usage.limit)']]},
  {id:'port-tenant-release',cues:[['tenant-release',"finally { this.ledger.push({ tenant: principal.tenant, runId: run.id, event: 'released'"],['tenant-release-once',"run.reservation = 0; run.transcript.push('Reservation released exactly once.');"]]}],narration:{
   'tenant-identity':'Every owned run lookup resolves the trusted token to a principal first.',
   'tenant-scope':'Both tenant and project must match; caller-supplied identifiers alone grant no access.',
   'tenant-concurrency':'The host refuses another active run for this tenant.',
   'tenant-budget':'Admission accounts for both spent and reserved illustrative units.',
   'tenant-release':'The finally block releases the reservation even after failure or cancellation.',
   'tenant-release-once':'Resetting the reservation prevents another release from counting the same units.'}},
 68:{file:'server/concepts/68-scheduled-event-driven.ts',shots:[
  {id:'port-queue-signature',cues:[['queue-freshness','Math.abs(realNow - Number(timestamp) * 1000) > 300000'],['queue-hmac','return timingSafeEqual(Buffer.from(signLab68']]},
  {id:'port-queue-admission',cues:[['queue-identity','const compound = `${owner}:${key}`; const old'],['queue-admitted-only',"audit: ['Admitted only; no worker or billed run started.']"]]},
  {id:'port-queue-claim',cues:[['queue-running',"if (job.state !== 'running' || job.controller?.signal.aborted)"],['queue-stable','INSERT OR IGNORE INTO effects (business_key, owner, job_id)']]},
  {id:'port-queue-attempt',cues:[['queue-before-await',"job.state = 'running'; job.attempts++;"],['queue-deadline',"const timer = setTimeout(() => job.controller?.abort('deadline'), 2000);"]]}],narration:{
   'queue-freshness':'Signature freshness uses real host time, independently of the virtual scheduling offset.',
   'queue-hmac':'The signature compares the HMAC over the actual raw bytes in constant time.',
   'queue-identity':'Owner and business identity deduplicate admission before another job exists.',
   'queue-admitted-only':'The admission audit explicitly says that no worker or billed run started.',
   'queue-running':'A queued proposal cannot execute the tool without a live, uncancelled host claim.',
   'queue-stable':'A unique effect business key protects the fictional ledger from repeats.',
   'queue-before-await':'The worker claims and increments the attempt before its first asynchronous wait.',
   'queue-deadline':'A bounded deadline belongs to the host claim.'}},
 69:{file:'server/lib/lab69-host.ts',shots:[
  {id:'port-document-path',cues:[['document-realpath','const [realRoot, realFile] = await Promise.all([realpath(root), realpath(filename)]);'],['document-boundary',"if (!rel || rel.startsWith(`..${sep}`)"]]},
  {id:'port-document-check',cues:[['document-trust',"if (!trusted) throw new Error('Trusted workspace required.');"],['document-correlation','if (patch.correlationId !== correlationId'],['document-hash','if (patch.baseVersion !== base.version || patch.baseHash !== base.hash'] ]},
  {id:'port-extension-review',file:'extensions/lab69/src/extension.ts',cues:[['extension-trust',"try { if (!vscode.workspace.isTrusted)"],['extension-path','await allowedDocument(folder.uri.fsPath, editor.document.uri.fsPath);'],['extension-apply','const patch = review.apply(pending.base, current, message.correlationId, vscode.workspace.isTrusted);']]}],narration:{
   'document-realpath':'The host resolves actual paths before checking a requested document.',
   'document-boundary':'The relative-path and type policy excludes files outside the trusted allowed folder.',
   'document-trust':'An untrusted workspace cannot apply a patch.',
   'document-correlation':'The patch must belong to the expected active correlation and document identity.',
   'document-hash':'Captured and current versions and hashes must still agree.',
   'extension-trust':'The actual extension implementation checks VS Code workspace trust before applying.',
   'extension-path':'It then resolves the document inside the allowed workspace folder.',
   'extension-apply':'This is the real extension guard implementation being read, not evidence that an extension host ran during the browser workshop.'}},
 70:{file:'server/lib/lab70-python.ts',shots:[
  {id:'port-python-environment',cues:[['python-env','const childEnv: NodeJS.ProcessEnv = {};'],['python-live-env',"if (request.mode === 'live')"],['python-command',"const child = spawn(interpreter, ['-I', '-u', '-B'"]]},
  {id:'port-python-bounds',cues:[['python-stdout',"if (stdoutBytes > 65536)"],['python-line','if (buffer.length > 12000'],['python-typed','lab70FrameSchema.parse(JSON.parse(line))']]},
  {id:'port-python-client',file:'python/lab70/worker.py',cues:[['python-client','client = anthropic.AsyncAnthropic(']]},
  {id:'port-python-cleanup',file:'python/lab70/worker.py',cues:[['python-retain','retained = success and request["operation"]'],['python-archive','await client.beta.sessions.archive(session_id, timeout=3.0)']]}],narration:{
   'python-env':'The host builds a narrow child environment instead of forwarding every application variable.',
   'python-live-env':'Only explicit live mode receives provider credentials and the selected resource identities.',
   'python-command':'A fixed worker path runs under the selected isolated interpreter with unbuffered output.',
   'python-stdout':'The host bounds the worker stdout byte count.',
   'python-line':'An oversized unterminated line is rejected before unrestricted buffering.',
   'python-typed':'Every JSON line must satisfy the typed frame schema.',
   'python-client':'The actual Python live branch creates an asynchronous SDK client with bounded timeouts and zero automatic retries.',
   'python-retain':'Only a successful explicitly retained operation may keep its confirmed idle session.',
   'python-archive':'The one-shot live path otherwise archives its confirmed idle session and records whether cleanup succeeded.'}},
 63:{file:'server/database/lab63.ts',shots:[
  {id:'port-sqlite-scope',cues:[['sqlite-readonly',"read.exec('PRAGMA query_only=ON'); write.exec('PRAGMA query_only=ON');"]]},
  {id:'port-sqlite-tenant',cues:[['sqlite-restore',"try { return callback(); } finally { entry.write.exec('PRAGMA query_only=ON'); }"],['sqlite-tenant',"'SELECT id, tenant, status, version FROM orders WHERE tenant=? AND id=?'"]]},
  {id:'port-sqlite-commit',cues:[['sqlite-transaction',"this.hostWrite(entry, () => { entry.write.exec('BEGIN IMMEDIATE');"],['sqlite-version',"WHERE id=? AND tenant=? AND status='open' AND version=?"],['sqlite-rollback',"if (changedRows !== 1) { entry.write.exec('ROLLBACK');"]]}],narration:{
   'sqlite-readonly':'Both SQLite connections start in query-only mode.',
   'sqlite-restore':'Only the trusted host temporarily enables writes, and its finally block restores query-only mode.',
   'sqlite-tenant':'The fixed parameterized read includes the host-selected tenant.',
   'sqlite-transaction':'The separate human decision begins an immediate transaction.',
   'sqlite-version':'The update requires the expected order, tenant, open status and captured row version.',
   'sqlite-rollback':'If exactly one row did not change, the host rolls back instead of claiming a cancellation.'}},
 64:{file:'server/concepts/64-browser-playwright-mcp.ts',shots:[
  {id:'port-browser-network',cues:[['browser-route',"if (url.origin === origin && url.pathname === '/'"],['browser-block',"else { events.push('Blocked off-fixture request.');"]]},
  {id:'port-browser-call',cues:[['browser-allow',"if (!allowedTools.has(name) || calls >= 6)"],['browser-navigation',"if (name === 'browser_navigate' && args.url !=="],['browser-call','const result = await client!.callTool']]},
  {id:'port-browser-proof',cues:[['browser-proof','const verified = initialText.includes'],['browser-form',"(scenario !== 'fill-form' || confirmation === 'Request saved for Ada Finch');"]]}],narration:{
   'browser-route':'The browser network route permits only the exact local fixture origin and page.',
   'browser-block':'Every other request is aborted by the host route.',
   'browser-allow':'The host permits only a bounded set of browser tool names and call count.',
   'browser-navigation':'Off-fixture navigation is rejected before the MCP call.',
   'browser-call':'The host dispatches the allowed call through the actual pinned Playwright MCP client.',
   'browser-proof':'Verification requires both the MCP snapshot and the independently read DOM product and price.',
   'browser-form':'A form run additionally requires the exact fictional confirmation.'}},
 65:{file:'server/concepts/65-human-approval.ts',shots:[
  {id:'port-reviewer-identity',cues:[['reviewer-session',"if (!session || session.owner !== owner || session.expiresAt <= this.now())"]]},
  {id:'port-reviewer-proposal',cues:[['reviewer-immutable','args: Object.freeze({ ...args })'],['reviewer-key','businessKey: `archive:${owner}:${args.caseId}`']]},
  {id:'port-reviewer-notify',cues:[['reviewer-local',"try { if (channel !== 'local') await deliver"],['reviewer-preview',"'Local preview displayed; no message sent.'"]]},
  {id:'port-reviewer-once',cues:[['reviewer-match','if (proposal.reviewer !== reviewer)'],['reviewer-expiry',"if (proposal.state === 'expired')"],['reviewer-notified',"if (!proposal.notified)"]]},
  {id:'port-reviewer-effect',cues:[['reviewer-effect','INSERT OR IGNORE INTO effects'],['reviewer-row','proposal.state = \'approved\'; proposal.audit.push']]}],narration:{
   'reviewer-session':'The trusted reviewer session must belong to this owner and remain unexpired.',
   'reviewer-immutable':'The host freezes the action arguments when it creates the proposal.',
   'reviewer-key':'A stable owner and case business key identifies the effect independently of tool-event correlation.',
   'reviewer-local':'Only a separately selected external channel can call a delivery adapter. This demonstration selects local notification.',
   'reviewer-preview':'Local preview records an audit entry and sends no message.',
   'reviewer-match':'The proposal authorized reviewer must match the trusted session.',
   'reviewer-expiry':'Expired proposals cannot be approved.',
   'reviewer-notified':'The host requires notification and inspection before a decision.',
   'reviewer-effect':'The SQLite unique business key and insert-or-ignore operation prevent another fictional effect.',
   'reviewer-row':'The host records approval and the actual number of executed effects.'}},
 61:{file:'server/mcp-agent/lab61.ts',shots:[
  {id:'port-mcp-identity',cues:[['mcp-auth',"if (typeof auth !== 'string' || !auth.startsWith('Bearer '))"],['mcp-auth-match','for (const [registered, identity] of this.tokens)']]},
  {id:'port-mcp-closed',cues:[['mcp-input','const call = callParams.safeParse(params);'],['mcp-concurrent',"if (session.active) { this.error(response, id, -32000"],['mcp-deadline',"const close = () => { if (!response.writableEnded)"]]},
  {id:'port-mcp-local',file:'server/mcp-agent/lab61-client.ts',cues:[['mcp-local-note',"note: 'Local HTTP MCP 2025-11-25 subset"],['mcp-close',"} finally { await fetch(baseUrl, { method: 'DELETE'"]]}],narration:{
   'mcp-auth':'Bearer authentication is checked on the host; its secret is never returned to the browser.',
   'mcp-auth-match':'A recognized token selects the trusted tenant and customer identity.',
   'mcp-input':'The server validates the one exposed tool and its closed arguments.',
   'mcp-concurrent':'An already-active transport session rejects another concurrent call.',
   'mcp-deadline':'Client disconnection aborts unfinished local review work; the following server deadline bounds the call.',
   'mcp-local-note':'The client explicitly labels this as local MCP with no Managed agent started.',
   'mcp-close':'The finally block closes the MCP transport even after cancellation or timeout.'}},
 62:{file:'server/retrieval/lab62.ts',shots:[
  {id:'port-rag-filter',cues:[['rag-filter',"const candidates = chunks.filter(chunk => chunk.tenant === tenant && chunk.version === 'current');"],['rag-rank','const score = queryWords.reduce']]},
  {id:'port-rag-citation',cues:[['rag-schema','const parsed = lab62ReportSchema.safeParse(raw);'],['rag-returned','const chunk = returned.find(item => item.id === evidence.id);'],['rag-quote','return chunk && chunk.text.includes(evidence.quote);']]},
  {id:'port-rag-policy',cues:[['rag-policy',"const answerValid = policyQuestion ? /\\b30 days\\b/i.test"],['rag-wrong',"!/\\b(?:60|90|365) days\\b/i.test"],['rag-verdict','verified: Boolean(citationsValid && answerValid)']]}],narration:{
   'rag-filter':'Tenant and current-version filtering happen before lexical ranking.',
   'rag-rank':'This local ranker uses heading and keyword matches, with no embedding or live model call.',
   'rag-schema':'The final report must satisfy the closed answer and evidence schema.',
   'rag-returned':'Every cited identifier must belong to this run returned chunks.',
   'rag-quote':'The quote must occur in the cited returned chunk.',
   'rag-policy':'For the returns question, the checked answer must agree with the current thirty-day host policy.',
   'rag-wrong':'The host rejects the archived, foreign-tenant and injected alternative policy periods.',
   'rag-verdict':'The final verdict requires both valid citations and a correct policy answer.'}},
 56:{file:'server/teams/lab56.ts',shots:[
  {id:'port-team-completion',cues:[['team-owner',"if (task.state !== 'claimed' || task.owner !== action.actor)"],['team-arithmetic','if (action.answer !== 12 + 18 + 7)']]},
  {id:'port-team-replay',cues:[['team-replay',"reason: 'Identical envelope replay ignored.'"]]},
  {id:'port-team-ack',cues:[['team-delivery',"if (message.status !== 'delivered')"],['team-unblock',"message.status = 'acknowledged'; state.tasks[1]!.state = 'available';"]]}],narration:{
   'team-owner':'Only the claimed task owner can propose completion.',
   'team-arithmetic':'The host checks the arithmetic independently of a proposed answer.',
   'team-replay':'An identical stable envelope replay changes no state and triggers no duplicate delivery.',
   'team-delivery':'Acknowledgment requires a previously delivered envelope.',
   'team-unblock':'Acknowledgment makes review available; it does not complete review.'}},
 57:{file:'server/worktrees/lab57.ts',shots:[
  {id:'port-worktree-check',cues:[['worktree-paths','const observed = paths(worktree), allowed ='],['worktree-test','const testPassed = allowed && runTest'],['worktree-commit','const committed = testPassed && !cancelled;']]},
  {id:'port-worktree-conflict',cues:[['worktree-abort',"git(repo, 'cherry-pick', '--abort');"],['worktree-preserve','Conflict while integrating']]},
  {id:'port-worktree-combined',cues:[['worktree-combined',"combinedTestsPassed = runTest(repo, 'Welcome, Ada!|11');"]]}],narration:{
   'worktree-paths':'The host inspects changed and untracked paths against each fixed worker allowlist.',
   'worktree-test':'A permitted path still needs a real behavioral test.',
   'worktree-commit':'The host commits only a passing worker that has not been cancelled.',
   'worktree-abort':'A failed cherry-pick is explicitly aborted.',
   'worktree-preserve':'The timeline records the conflict while preserving worker branches.',
   'worktree-combined':'After serial integration, the host checks the combined behavior rather than trusting individual worker claims.'}},
 58:{file:'server/tool-search/lab58.ts',shots:[
  {id:'port-catalog-score',cues:[['catalog-score','const score = words.reduce'],['catalog-limit','.slice(0, request.limit).map']]},
  {id:'port-catalog-authority',cues:[['catalog-schema','const parsed = tool.schema.safeParse(request.input);'],['catalog-auth',"if (request.scenario !== 'authorized')"]]},
  {id:'port-catalog-once',cues:[['catalog-replay','if (refunds.has(key))'],['catalog-record','refunds.set(key, parsed.data.amountCents as number);']]}],narration:{
   'catalog-score':'This transparent local score weights name, hint and description matches.',
   'catalog-limit':'Only the bounded highest-ranked definitions are returned; this is not native tool loading.',
   'catalog-schema':'Dispatch validates the selected tool closed schema.',
   'catalog-auth':'The authored trusted host context controls authorization independently of catalog prose.',
   'catalog-replay':'A stable owner, invoice and amount key suppresses a repeated fictional refund.',
   'catalog-record':'Only a validated authorized request writes the local fictional ledger.'}},
 59:{file:'server/routing/lab59.ts',shots:[
  {id:'port-routing-answer',cues:[['routing-schema','const parsed = lab59ReportSchema.safeParse(raw);'],['routing-key','correct: parsed.data.answer === answerKeys[taskId]']]},
  {id:'port-routing-budget',cues:[['routing-budget','if (spendUnits + config.spendUnits > budgetUnits)'],['routing-assumed','const correct = rank[tier] >= rank[task.difficulty]']]},
  {id:'port-routing-complete',cues:[['routing-complete','correct: attempts.length === planned.length'],['routing-incomplete','complete: attempts.length === planned.length']]}],narration:{
   'routing-schema':'Reports must satisfy the closed answer and confidence schema.',
   'routing-key':'Correctness comes from an independent server answer key, not confidence.',
   'routing-budget':'The host checks the assumed spend bound before another hypothetical attempt.',
   'routing-assumed':'Offline answers are authored from tier assumptions. They are not observed model results.',
   'routing-complete':'A correct final attempt counts only when all planned steps have completed.',
   'routing-incomplete':'Budget-stopped work retains an explicit incomplete state.'}},
 60:{file:'server/durable/lab60.ts',shots:[
  {id:'port-durable-key',cues:[['durable-key','export const effectKey ='],]},
  {id:'port-durable-dedupe',cues:[['durable-dedupe','if (deduplicate && ledger.some'],['durable-ledger','this.saveLedger(journal.id, ledger); return']]},
  {id:'port-durable-crash',cues:[['durable-crash',"if (item.id === 'ITEM-03') break;"],['durable-journal','journal.completedKeys.push(applied.key);']]},
  {id:'port-durable-recover',cues:[['durable-skip','if (!restartAll && journal.completedKeys.includes(key)) continue;'],['durable-stable',"const effect = this.apply(journal, item, strategy === 'journal-idempotency');"]]}],narration:{
   'durable-key':'The stable effect key binds a fictional refund to its job and item.',
   'durable-dedupe':'Idempotent application checks the authoritative ledger for an existing business key.',
   'durable-ledger':'The ledger persists the effect before later progress bookkeeping.',
   'durable-crash':'The controlled crash occurs after effect three and before its journal write.',
   'durable-journal':'Earlier successful effects update journal progress; that progress alone cannot cover the crash gap.',
   'durable-skip':'Journal-aware recovery skips completed keys.',
   'durable-stable':'Only the idempotency strategy also checks the ledger for an effect missing from the journal.'}},
 51:{file:'server/unit-testing/lab51.ts',shots:[
  {id:'port-policy-test',cues:[['unit-clock',"const now = Date.parse('2026-11-11T12:00:00Z')"],['unit-mutant','const mutatedAllows = eligibleDamageRefund(order, now, 60);'],['unit-expected',"'The deliberate max-age mutation changes 30 days to 60 under the same virtual clock.'"]]},
  {id:'port-replay-test',cues:[['unit-consumer','const outcome = consumer.finish(), snapshot = consumer.snapshot();'],['unit-duplicate',"snapshot.duplicatesIgnored === 1 && snapshot.previews[0]?.state === 'replaced'"]]}],narration:{
   'unit-clock':'The policy test fixes a virtual clock so the thirty-day boundary remains reproducible.',
   'unit-mutant':'The deliberately changed sixty-day window is evaluated against the same order and clock.',
   'unit-expected':'The failing thirty-day assertion is expected only for the deliberate mutation.',
   'unit-consumer':'The recorded fixture events pass through the actual shared event consumer.',
   'unit-duplicate':'The duplicate-event test checks both one ignored duplicate and replacement of the streaming preview.'}},
 52:{file:'server/evals/lab52.ts',shots:[
  {id:'port-eval-effects',cues:[['eval-ledger','const actualRefunds = store.refunds.size;'],['eval-claim',"const claimedRefunds = variant === 'regression'"],['eval-host-pass','const hostPass = actualRefunds === item.expectedRefunds && claimedRefunds === actualRefunds;']]},
  {id:'port-eval-gate',cues:[['eval-promotion','if (!space.baseline || !report.promotable || report.baselineRunId !== space.baseline.id ||','!report.safetyPass || report.regressions.length)'],['eval-pointer','space.promoted = runId; return']]}],narration:{
   'eval-ledger':'The evaluator reads the actual refund ledger, rather than trusting an agent claim.',
   'eval-claim':'The regression fixture deliberately claims a refund when the holdout label expects no refund.',
   'eval-host-pass':'The host pass requires both the expected effect and an honest report of that effect.',
   'eval-promotion':'Promotion requires an owned current baseline, a promotable report, passed safety and no regression.',
   'eval-pointer':'A successful promotion changes only the local evaluation pointer.'}},
 53:{file:'server/debugging/lab53.ts',shots:[
  {id:'port-trace-limit',cues:[['trace-eof',"'The stream closed before an idle event or authoritative final report.'"],['trace-local-limit',"cause = 'The host turn limit stopped local consumption; remote state remains unknown.'"],['trace-cleanup',"cause = 'Cleanup timeout leaves the remote stop unconfirmed.'"]]},
  {id:'port-trace-replay',cues:[['trace-consumer','const first = createEventConsumer(); for (const event of events) first.push(event);'],['trace-repeat','for (const event of events) second.push(event); const replayOutcome = second.finish().kind;'],['trace-effects',"effectsMatch: recordedEffects === store.refunds.size"]]}],narration:{
   'trace-eof':'A stream ending before idle cannot establish an authoritative completed report.',
   'trace-local-limit':'A local turn limit describes the host consumption boundary; remote state remains unknown.',
   'trace-cleanup':'A timed-out local cleanup leaves the remote stop unconfirmed.',
   'trace-consumer':'The authored events are replayed through the shared consumer to classify the outcome.',
   'trace-repeat':'A second consumer replays the same recorded events for comparison.',
   'trace-effects':'Recorded effect entries are checked against the actual local refund ledger.'}},
 54:{file:'server/tool-design/lab54.ts',shots:[
  {id:'port-tool-contract',cues:[['design-name',"explicit: definition('request_damaged_item_refund_review'"],['design-units',"'Request host review for a damaged-item refund"],['design-lint',"if ('amount' in properties) issues.push"]]},
  {id:'port-tool-idempotency',cues:[['design-repeat','const repeated = send(lab54Definitions.explicit.name, input'],['design-key','stableIdempotency = Boolean(first.actionKey && first.actionKey === repeated.actionKey && repeated.reused);'],['design-effect','stableIdempotency = stableIdempotency && store.approvals.size === 1 && store.refunds.size === 1;']]}],narration:{
   'design-name':'The explicit tool name describes a host-reviewed refund request.',
   'design-units':'Its description specifies positive integer cents and states that only trusted approval can issue money.',
   'design-lint':'The linter flags an ambiguous amount field without an explicit unit.',
   'design-repeat':'A repeated proposal uses a new event correlation but the same business action.',
   'design-key':'The host verifies that the action key is stable and the pending review is reused.',
   'design-effect':'The final local check requires exactly one approval and one refund.'}},
 55:{file:'server/upgrades/lab55.ts',shots:[
  {id:'port-upgrade-evidence',cues:[['upgrade-checks','const checks = checksFor(scenario), eligible = checks.every(check => check.pass);'],['upgrade-result',"candidateNpmVersion: null, apiCompatibility, pinnedResources: pins,"]]},
  {id:'port-upgrade-transition',cues:[['upgrade-canary',"if (action === 'canary') { if (!current.eligible || current.state !== 'candidate')"],['upgrade-promotion',"} else if (action === 'promote') { if (!current.eligible || current.state !== 'canary'"],['upgrade-rollback',"Host-code rollback rehearsed. Already-created remote sessions would remain"]]}],narration:{
   'upgrade-checks':'Eligibility is computed from all server evidence checks, independent of a client hint.',
   'upgrade-result':'Candidate package identity stays unknown while API compatibility and resource pins are recorded separately.',
   'upgrade-canary':'Only an eligible candidate can enter the authored canary rehearsal.',
   'upgrade-promotion':'Promotion additionally requires the canary state and an authored passed-canary result.',
   'upgrade-rollback':'A host-code rollback leaves already-created remote sessions to be reconciled separately.'}},
 50:{file:'server/capstone/tools.ts',shots:[
  {id:'port-ownership',cues:[['port-customer-scope','const conversation = store.conversation(context.owner, context.customerId, context.conversationId);'],['port-owned-order','const order = store.order(context.customerId, input.orderId); return result'],['port-proposal','const input = capstoneToolShapes.propose_refund.parse(call.input);']]},
  {id:'port-host-refund',file:'server/capstone/store.ts',cues:[['port-review-scope',"approve(owner: string, customerId: CustomerId, approvalId: string"],['port-review-once',"if (approval.status !== 'pending' || conversation.pendingApprovalId !== approval.id)"],['port-ledger','this.refunds.set(refund.id, refund); approval.status'] ]},
  {id:'port-pinned-agent',file:'server/capstone/agent.ts',cues:[['port-live-opt-in',"if (!settings.liveReady || env.MANAGED_LAB50_LIVE_ENABLED !== 'true'"],['port-pinned',"const agent = await client.beta.agents.retrieve(id, { version }"],['port-toolset',"if (agent.archived_at || agent.version !== version || agent.mcp_servers.length"]]}]},
 46:{file:'server/lib/lab46-cache-observations.ts',shots:[
  {id:'port-counters',cues:[['port-normalize','const normalized = normalizeLab15Usage'],['port-creation','cacheCreationTokens: usage.cache_creation_input_tokens'] ]},
  {id:'port-compare',cues:[['port-comparable','const comparable = !fresh && firstUsage !== null'],['port-delta','const delta = comparable ? {','} : null;'],['port-uncertainty','const uncertainty = fresh ?']]}]},
 48:{file:'server/lib/lab48-security-range.ts',shots:[
  {id:'port-policy',cues:[['port-schema','const parsed = lab48ToolInputSchema.parse'],['port-path','const relativeTarget = relative(this.allowed, resolve(target));'],['port-boundary',"const allowed = policy === 'naive'"],['port-deny',"if (!allowed) blockedBy = action === 'injected-egress'"]]},
  {id:'port-witness',cues:[['port-network',"await fetch(`http://127.0.0.1:${address.port}/sink`"],['port-exposed',"const exposed = action === 'secret-read' && executed;"],['port-result','attempted: true, executed, blockedBy,']]}]},
 1:{file:'server/lib/lab01-port.ts',shots:[
  {id:'port-create',cues:[['port-create','const session = await sessions.create','budget: { type: \'limit\''],['port-budget-label','budget: cost ?']]},
  {id:'port-stream',cues:[['port-stream','sessions.events.stream(id'],['port-send','type: \'user.message\''],['port-cleanup','async interrupt(id)','async archive(id)']]}]},
 2:{file:'server/lib/lab02-port.ts',shots:[
  {id:'port-overrides',cues:[['port-overrides','agent_with_overrides','tools: [], mcp_servers: [], skills: []'],['port-budget','max_list_cost: { amount: String(request.budgetCents)']]},
  {id:'port-create',cues:[['port-retrieve','client.beta.agents.retrieve'],['port-create','client.beta.sessions.create(parameters'],['port-effective','port.effective = effectiveOptionsSchema.parse']]}]},
 3:{file:'server/lib/tool-session-port.ts',shots:[
  {id:'port-create',cues:[['port-upload','client.files.upload'],['port-create','sessions.create(toolSessionParams']]},
  {id:'port-confirm',cues:[['port-stream','sessions.events.stream(id'],['port-send','type: \'user.message\''],['port-confirm','type: \'user.tool_confirmation\'']]},
  {id:'port-outputs',cues:[['port-list','const listOutputs = async','.filter((file) => file.downloadable !== false)'],['port-download','client.files.download','sandbox.writeText']]}]},
 4:{file:'server/lib/lab04-port.ts',shots:[
  {id:'port-spec',cues:[['port-spec',"return { label: 'Lab 04'",'deadlineSeconds: request.deadlineSeconds'],['port-params','return toolSessionParams(lab04Spec']]},
  {id:'port-confirm',file:'server/lib/tool-session-port.ts',cues:[['port-confirm','async confirm(id, confirmations','deny_message']]}]},
 5:{file:'server/lib/lab05-port.ts',shots:[
  {id:'port-create',cues:[['port-retrieve','client.beta.agents.retrieve(agentId'],['port-create','sessions.create(lab05SessionParams']]},
  {id:'port-respond',file:'server/lib/tool-session-port.ts',cues:[['port-respond','async respond(id, results','user.custom_tool_result']]}]},
 6:{file:'server/lib/lab06-port.ts',shots:[
  {id:'port-create',cues:[['port-create','sessions.create({ agent: ids.agentId'],['port-stream','sessions.events.stream(id'],['port-send',"type: 'user.message'"]]},
  {id:'port-history',cues:[['port-list','sessions.events.list(id'],['port-archive','async archive(id)']]}]},
 7:{file:'server/lib/lab07-port.ts',shots:[
  {id:'port-create',cues:[['port-retrieve','client.beta.agents.retrieve(agentId'],['port-create','sessions.create(lab07SessionParams']]},
  {id:'port-respond',file:'server/lib/tool-session-port.ts',cues:[['port-respond','async respond(id, results','user.custom_tool_result']]}]},
 8:{file:'server/lib/lab08-port.ts',shots:[
  {id:'port-config',cues:[['port-multiagent',"type: 'multiagent_20261001'"],['port-system',"system: 'Delegate authored research"]]},
  {id:'port-create',cues:[['port-retrieve','client.beta.agents.retrieve(id'],['port-create','client.beta.sessions.create(lab08SessionParams'],['port-send',"type: 'user.message'"]]}]},
 9:{file:'server/lib/lab09-port.ts',shots:[
  {id:'port-overrides',cues:[['port-overrides',"agent: { type: 'agent_with_overrides'",'composition.overrideIncluded']]},
  {id:'port-create',cues:[['port-retrieve','client.beta.agents.retrieve(managedResourceIds'],['port-create','client.beta.sessions.create(lab09SessionParams'],['port-archive','client.beta.sessions.archive(session.id']]}]},
 10:{file:'server/lib/lab10-run.ts',shots:[
  {id:'port-validate',cues:[['port-validate','lab10ReportSchema.safeParse(raw)']]},
  {id:'port-corrective',cues:[['port-attempts','for(let attempt=1;attempt<=2;attempt++)'],['port-corrective-prompt',"attempt === 1 ? input.prompt"],['port-exhausted',"turn.outcome=attempt === 2 ? 'exhausted'"]]}]},
 11:{file:'server/lib/lab11-port.ts',shots:[
  {id:'port-toolset',cues:[['port-toolset',"export const lab11Toolset",'configs: [{ name: \'read\'']]},
  {id:'port-overrides',cues:[['port-overrides',"return { agent: { type: 'agent_with_overrides'","skills: pin ? [{ type: 'custom'"]]},
  {id:'port-create',cues:[['port-metadata','const metadata = await client.beta.skills.versions.retrieve(pin.version'],['port-create','const session = await client.beta.sessions.create(lab11SessionParams'],['port-resolved','port.resolvedSkills = a.skills.map']]}]},
 12:{file:'server/lib/lab12-port.ts',shots:[
  {id:'port-create',cues:[['port-retrieve','const base = await client.beta.agents.retrieve'],['port-create',"const session = await sessions.create({ agent: { type: 'agent_with_overrides'","title: 'Lab 12 serialized host queue'"]]},
  {id:'port-send',cues:[['port-stream',"sessions.events.stream(id, { event_deltas"],['port-send',"sessions.events.send(id, { events: [{ type: 'user.message'"],['port-update','const session = await sessions.update(id, { agent:'],['port-archive','async archive(id)']]}]},
 13:{file:'server/lib/lab13-port.ts',shots:[
  {id:'port-bridge',cues:[['port-bridge','export function lab13BridgeTools',"return names.map(name => ({ type: 'custom'"],['port-native',"mcp_servers: config.inventoryEnabled ? [{ type: 'url'"]]},
  {id:'port-create',cues:[['port-create',"const params: SessionCreateParams = { agent: { type: 'agent_with_overrides'","title: 'Lab 13 MCP reachability'"],['port-session','const session = await sessions.create(params'],['port-update','const updated = await sessions.update(cached.session.id']]},
  {id:'port-respond',file:'server/lib/tool-session-port.ts',cues:[['port-respond','async respond(id, results','user.custom_tool_result']]}]},
 14:{file:'server/lib/lab14-port.ts',shots:[
  {id:'port-create',cues:[['port-overrides',"const parameters: SessionCreateParams = { agent: { type: 'agent_with_overrides'","budget: { type: 'limit', max_list_cost: { amount: String(input.configuration.budgetCents)"],['port-session','try { session = await client.beta.sessions.create(parameters']]},
  {id:'port-resolved',cues:[['port-resolved','port.snapshot = { model: resolved.model.id','&& resolved.tools.length === 0'],['port-send',"const sent = await client.beta.sessions.events.send(id"]]}]},
 15:{file:'server/lib/lab15-port.ts',shots:[
  {id:'port-budget',cues:[['port-budget','export function lab15Budget'],['port-create',"const parameters: SessionCreateParams = { agent: { type: 'agent_with_overrides'","system: 'Answer briefly"]]},
  {id:'port-usage',cues:[['port-retrieve','const session = await sessions.retrieve(id'],['port-threads','const page = await sessions.threads.list(id'],['port-raise','const session = await sessions.update(id, parameters']]}]},
 16:{file:'server/lib/lab16-port.ts',shots:[
  {id:'port-toolset',cues:[['port-toolset','export const lab16ReadToolset',"configs: [{ name: 'read'"]]},
  {id:'port-create',cues:[['port-environment','const environment = await client.beta.environments.retrieve'],['port-resources',"resources: [{ type: 'file', file_id: fileId"],['port-session','try { session = await client.beta.sessions.create(params']]},
  {id:'port-listed',cues:[['port-listed','const page = await client.beta.sessions.resources.list(session.id','evidence.observedMount = page.data.some']]}]},
 17:{file:'server/lib/lab17-run.ts',shots:[
  {id:'port-session',cues:[['port-session',"const base = input.mode === 'live' ? createLiveLab15Port"]]},
  {id:'port-handler',cues:[['port-handler',"if (action === 'create-draft') { await writeLab17"]]},
  {id:'port-restore',cues:[['port-version','if (entry.version !== input.expectedVersion)'],['port-plan','entry.plan = { planId: randomUUID()'],['port-confirm','if (!entry.plan || entry.plan.planId !== input.planId']]}]},
 18:{file:'server/lib/lab18-sandbox.ts',shots:[
  {id:'port-policy',cues:[['port-policy',"const allowed = name === 'bash' && input?.command === 'pwd'","denyMessage: allowed ? null"]]},
  {id:'port-create',cues:[['port-toolset',"const toolset = toolsetFrom('always_ask'"],['port-environment','const environment = await client.beta.environments.retrieve(ids.environmentId'],['port-overrides',"const params: SessionCreateParams = { agent: { type: 'agent_with_overrides'","system: 'For this diagnostic"],['port-session','const session = await sessions.create(params']]}]},
 19:{file:'server/lib/lab19-sessions.ts',shots:[
  {id:'port-history',cues:[['port-events','const page = await this.client().beta.sessions.events.list(sessionId'],['port-retrieve','const remote = await this.client().beta.sessions.retrieve(']]},
  {id:'port-branch',cues:[['port-summary','const summary = selected.map(event =>'],['port-prompt','const prompt = `Selected-history summary']]},
  {id:'port-manage',cues:[['port-rename','const remote = await this.client().beta.sessions.update(entry.snapshot.sessionId!, { title }'],['port-tag','{ metadata: { lab19_tag: tag } }'],['port-delete','const deleted = await this.client().beta.sessions.delete(']]}]},
 20:{file:'server/lib/lab20-run.ts',shots:[
  {id:'port-interceptor',cues:[['port-exception',"if (input.scenario === 'interceptor-exception') {"],['port-preflight',"audit({ ...correlation(), kind: 'interceptor', phase: 'pre-execution', outcome: 'passed'"]]},
  {id:'port-port',cues:[['port-port',"const defaultPort = () => input.mode === 'live' ? createLiveLab07Port"]]},
  {id:'port-respond',file:'server/lib/tool-session-port.ts',cues:[['port-respond','async respond(id, results','user.custom_tool_result']]}]},
 21:{file:'server/lib/lab21-commands.ts',shots:[
  {id:'port-expand',file:'shared/lab21-slash-commands.ts',cues:[['port-expand','export function expandLab21Command','return `Format a fictional observation note.']]},
  {id:'port-send',cues:[['port-local','if (expanded === null) {'],['port-send',"const snapshot = await this.sessions.execute(runId, owner, { type: 'send', prompt: expanded }"]]}]},
 22:{file:'server/lib/lab22-context.ts',shots:[
  {id:'port-read',cues:[['port-read','const data = await readFile(actual); if (data.byteLength > 4096)'],['port-hash',"sha256: createHash('sha256').update(data).digest('hex')"]]},
  {id:'port-send',cues:[['port-compose','const message = composeLab22Message(input, selected)'],['port-send',"try { outcome = await this.sessions.execute(prepared.runId, internalOwner, { type: 'send', prompt: message }"]]}]},
 23:{file:'server/lib/lab23-bundles.ts',shots:[
  {id:'port-hash',cues:[['port-hash',"if (hash(text) !== entry.sha256) throw new Lab23Error(422"]]}]},
 24:{file:'server/lib/lab24-harnesses.ts',shots:[
  {id:'port-owners',cues:[['port-owners',"const owners = { 'manual-messages': 'application'"],['port-type',"const type = request.harness === 'manual-messages' ? 'messages.tool_use'"]]}]},
 25:{file:'server/lib/lab25-compaction-context.ts',shots:[
  {id:'port-compaction',cues:[['port-observe',"if (event.type === 'agent.thread_context_compacted') observed.push"],['port-summary','const summary = `Host-authored summary:']]}]},
 26:{file:'server/lib/lab26-controls.ts',shots:[
  {id:'port-idle',cues:[['port-scripted',"if (input.mode !== 'scripted') throw new Lab26Error(422"],['port-interrupt',"if (input.operation === 'interrupt') {","entry.status = 'idle'; entry.interruption = 'confirmed-idle'"],['port-idle',"if (entry.status !== 'idle') throw new Lab26Error(409"]]},
  {id:'port-updates',cues:[['port-replace',"case 'idle-tools-mcp':"],['port-budget','if (input.budgetCents > entry.budgetCents && !input.confirmResume)'],['port-handoff','return this.create(owner, entry.budgetCents, input.model, entry.id']]}]},
 30:{file:'server/lib/lab30-board.ts',shots:[
  {id:'port-dedupe',cues:[['port-dedupe','const fingerprint = JSON.stringify({ name, rawInput }), prior = board.seen.get(eventId);',"if (prior) { if (prior.fingerprint !== fingerprint)"],['port-result',"catch (error) { result = { eventId, name, isError: true"]]},
  {id:'port-gate',cues:[['port-version',"if (task.version !== data.expectedVersion) throw new Error('Conflicting task version.')"],['port-deps',"throw new Error('Dependencies are incomplete.')"],['port-evidence','if (data.evidence !== evidenceFor(task)) throw new Error']]}]},
 33:{file:'server/lib/lab33-elicitation.ts',shots:[
  {id:'port-elicit',cues:[['port-elicit',"if (packet.id === 33 && packet.method === 'elicitation/create'","entry.question = params.message; entry.status = 'pending';"],['port-bridge',"entry.bridgeResult = { type: 'user.custom_tool_result', custom_tool_use_id: entry.customCallId,","is_error: Boolean(result?.isError), content: [{ type: 'text', text }] };"],['port-live',"if (input.mode === 'live') throw new Lab33Error(422"]]},
  {id:'port-host',cues:[['port-validate','const parsed = lab33FieldSchema.safeParse(input.content);',"if (!parsed.success) throw new Lab33Error(400"],['port-reply',"send(entry, { id: 33, result: input.action === 'accept'"]]}]},
 27:{file:'server/lib/lab27-ledger.ts',shots:[
  {id:'port-open',cues:[['port-live-refused',"if (input.mode !== 'scripted') throw new Lab27Error(422"],['port-policy',"if (!input.backgroundAllowed) throw new Lab27Error(422"],['port-dedupe',"if (entry.taskState === 'closed' || entry.eventIds.includes(event.id)) return;"]]},
  {id:'port-call',cues:[['port-reconnect',"case 'reconnect': entry.browserConnection = 'attached';","this.observe(entry, { id: 'task-started', type: 'task.running' }); break;"],['port-stop',"case 'stop': if (entry.taskState === 'running')","this.observe(entry, { id: 'stop-confirmed-idle'"],['port-close',"case 'close': if (entry.remoteStatus !== 'idle') throw new Lab27Error(409","entry.taskState = 'closed'; entry.remoteStatus = 'archived'; break;"]]}]},
 28:{file:'server/lib/lab28-faults.ts',shots:[
  {id:'port-retry',cues:[['port-zero-retries','export const sideEffectRequestOptions = { maxRetries: 0 }'],['port-ledger','export class Lab28Ledger']]},
  {id:'port-bounded',cues:[['port-bounded','if (result.status < 400 || ![429, 503].includes(result.status)','const backoff = Math.floor'],['port-live-throw',"if (input.mode === 'live') throw new Error"]]},
  {id:'port-reconcile',cues:[['port-uncertain-create',"reconcile: 'unknown-create-id'","guidance: 'Do not resend create."],['port-host-ledger',"reconcile: 'host-ledger'"],['port-known-session',"classification: 'reconciled', sessionId: knownSession"]]}]},
 29:{file:'server/lib/lab29-files.ts',shots:[
  {id:'port-inline',cues:[['port-image',"{ type: 'image', source: { type: 'base64', media_type: 'image/png'"],['port-document',"{ type: 'document', source: { type: 'base64', media_type: 'application/pdf'","{ type: 'document', source: { type: 'text', media_type: 'text/plain'"],['port-message',"return { type: 'user.message', content: [{ type: 'text', text: question }, block] }"]]},
  {id:'port-mount',cues:[['port-mount',"return { type: 'file', file_id: fileId, mount_path: `/lab29/${name}` }"],['port-offline',"if (input.mode !== 'scripted') throw new Lab29Error(422"],['port-redact','const redacted = message.content.map',"{ type: block.type, source: 'source' in block ? block.source.type"]]}]},
 32:{file:'server/lib/lab32-plan-gate.ts',shots:[
  {id:'port-plan',cues:[['port-hash','const planHash = (version: number, text: string) => sha(JSON.stringify'],['port-live',"if (input.mode === 'live') throw new Lab32Error(422"]]},
  {id:'port-tools',cues:[['port-readonly',"let reason = 'Planning phase is read-only.'; let allowed = false;","else if (tool !== 'append_checklist') reason = 'Tool is outside the selected execution capabilities.';"],['port-append','Approved fictional deployment checklist.','entry.executionFileEffects = 1;']]},
  {id:'port-decide',cues:[['port-stale','if (entry.planVersion !== input.planVersion || entry.planHash !== input.planHash)'],['port-reject',"if (input.decision === 'reject') { entry.status = 'rejected'; return this.view(entry); }"],['port-execute',"entry.status = 'executed'; entry.executionSessionId = randomUUID();","return this.attempt(entry, 'execution', 'append_checklist');"]]}]},
 31:{file:'server/lib/lab31-questions.ts',shots:[
  {id:'port-answer',cues:[['port-correlate','if (entry.sessionId !== input.sessionId || entry.eventId !== input.eventId) throw new Lab31Error(404'],['port-once',"if (entry.status !== 'pending') throw new Lab31Error(409"],['port-option','if (selected && !entry.question.options.some(option => option.id === selected))']]},
  {id:'port-result',cues:[['port-event',"const resultEvent: BetaManagedAgentsUserCustomToolResultEventParams = { type: 'user.custom_tool_result',",'custom_tool_use_id: entry.eventId, is_error: false'],['port-record','entry.answer = answer; entry.resultEvent = resultEvent; entry.resultSendCount = 1'],['port-custom','if (custom && (!entry.question.allowCustom || custom.length > 200))']]}]},
 34:{file:'server/lib/lab34-styles.ts',shots:[
  {id:'port-compose',cues:[['port-hash',"return { name, path: `fixtures/lab34/styles/${file}`, sha256: createHash('sha256')"],['port-unknown',"if (!selected) throw new Lab34Error(400"],['port-compose','const configuredSystem = `${baseSystem}'],['port-verified','const verified = validateLab34Report(report);']]},
  {id:'port-validate',cues:[['port-validate','export function validateLab34Report(raw: string)','return { valid: parsed.success']]}]},
 35:{file:'server/lib/lab35-mirror.ts',shots:[
  {id:'port-append',cues:[['port-atomic','writeFileSync(temporary, JSON.stringify(rows)); renameSync(temporary, this.indexPath());'],['port-append-fail',"if (entry.appendFails) { entry.mirrorIncomplete = true; this.writeIndex(); throw new Lab35Error(507"],['port-dedupe','const stored = this.persisted(entry); if (stored.some(item => item.eventId === event.eventId)) return;']]},
  {id:'port-remote',cues:[['port-live-refused',"if (input.mode === 'live') throw new Lab35Error(422"],['port-flush','if (input.flush === \'eager\') { try { this.append(entry, event); }','else entry.pending.push(event);']]},
  {id:'port-recover',cues:[['port-crash','const lost = entry.pending.length; if (lost) { entry.mirrorIncomplete = true; this.writeIndex(); }'],['port-archived',"if (entry.remoteState === 'archived') throw new Lab35Error(409"]]}]},
 38:{file:'server/lib/lab38-suggestions.ts',shots:[
  {id:'port-when',cues:[['port-absent',"if (entry.status !== 'open' || !entry.enabled || entry.scenario === 'suppressed' || this.now() < entry.availableAt)"],['port-stale','if (entry.suggestions.some(item => item.turn !== entry.turn || item.responseVersion !== entry.responseVersion)) {','entry.suggestions = []; entry.staleRejected = true; return this.view(entry);']]},
  {id:'port-send',cues:[['port-bind','if (input.expectedTurn !== entry.turn || input.expectedResponseVersion !== entry.responseVersion)','if (!suggestion || suggestion.turn !== entry.turn || suggestion.responseVersion !== entry.responseVersion || suggestion.text !== input.text)'],['port-explicit','entry.sentCount++; entry.turn++; entry.responseVersion++;']]},
  {id:'port-offline',cues:[['port-autosend','draft: entry.draft, sentCount: entry.sentCount, autoSendCount: 0,'],['port-live',"if (input.mode === 'live') throw new Lab38Error(422"]]}]},
 44:{file:'server/lib/lab44-telemetry.ts',shots:[
  {id:'port-collector',cues:[['port-bound','if (!incoming.length || incoming.length > 20 || this.spans.length + incoming.length > 128 ||','incoming.some(item => !/^[a-f0-9]{32}$/'],['port-loopback',"this.server.listen(0, '127.0.0.1', resolve)"],['port-timeout',"redirect: 'error', signal: AbortSignal.timeout(2000)"]]},
  {id:'port-run',cues:[['port-record','const recordContent = this.recording.get(owner) === true;'],['port-redact',"...base, effect: String(effectCount), ...(recordContent ?"],['port-export','await this.exporter!.export(spans);']]},
  {id:'port-remote',cues:[['port-ready','if (!remoteTelemetryReadiness(this.env).ready) throw new Lab44Error(422'],['port-allow',"try { const allowed = new Set(['http.route'"],['port-otlp','await new Lab44Exporter(this.env.LAB44_OTLP_ENDPOINT!']]}]},
 45:{file:'server/lib/lab45-providers.ts',shots:[
  {id:'port-catalog',cues:[['port-direct',"{ id: 'claude-api', label: 'Direct Claude API', messagesApi: true, managedDocumented: true"],['port-aws',"{ id: 'claude-platform-aws', label: 'Claude Platform on AWS', messagesApi: true, managedDocumented: true"],['port-bedrock',"{ id: 'bedrock', label: 'Amazon Bedrock', messagesApi: true, managedDocumented: false"]]},
  {id:'port-facts',cues:[['port-first-party','firstParty: { configured: ready.configured, liveReady: ready.liveReady'],['port-aws-setup','awsSetup: awsReadiness(this.env), providerCalls: 0, noAutoProvisioning: true'],['port-check-aws','try { return await checkAwsResources(this.env); }']]},
  {id:'port-emulate',cues:[['port-auth',"if (request.headers.authorization !== `Bearer ${synthetic}`) { response.statusCode = 401;"],['port-loopback',"server.listen(0, '127.0.0.1', resolve)"],['port-refused',"const status = !item.managedRouteEnabled || scenario === 'missing-feature' ? 'refused'"]]}]},
 47:{file:'server/lib/lab47-multi-agent.ts',shots:[
  {id:'port-config',cues:[['port-multiagent',"const config: BetaManagedAgentsMultiagent20261001Params = { type: 'multiagent_20261001' };"],['port-native',"const nativeRoutes: readonly Lab47Route[] = ['orchestrator', 'hierarchy'];"],['port-capacity',"if (this.closed || this.active >= 4) throw new Lab47Error(429"]]},
  {id:'port-ids',cues:[['port-thread','const id = native ? { sessionId: parentSessionId, threadId: `thread_fixture_${index + 1}` } :','{ sessionId: `sesn_fixture_${randomUUID().slice(0, 8)}`, threadId: null };'],['port-scope',"verifiedReport, usageScope: native ? 'session-shared' as const : 'independent-session' as const,"]]},
  {id:'port-gate',cues:[['port-verify','const verifiedReport = delayed || blocked ? null : matches || corrected'],['port-gate-rule',"const gate = workers.some(worker => worker.state === 'blocked') ? 'blocked' :"],['port-aggregate','const hostAggregate = native ? null : { inputTokens: workers.reduce(']]}]},
 49:{file:'server/lib/lab49-headless.ts',shots:[
  {id:'port-limits',cues:[['port-limits','const hostLimits = { deadlineMs: 3000, maxMessages: 1, maxToolCalls: 0'],['port-facts',"limits: hostLimits, approvalPolicy: 'deny unresolved approvals', noTtyRequired: true"],['port-capacity','if (this.closed || this.active >= hostLimits.maxConcurrent) throw new Lab49Error(429']]},
  {id:'port-outcome',cues:[['port-report','const checked = lab49ReportSchema.safeParse(JSON.parse(raw));'],['port-pass','const report = terminalPass && checked.success ? checked.data : null;'],['port-exit',"exitCode: terminalPass ? 0 : outcome === 'cancelled' ? 3 : 2"]]},
  {id:'port-cleanup',cues:[['port-cleanup',"const cleanup = scenario === 'unconfirmed-stop' ? 'pending'"],['port-interrupt',"const interruption = scenario === 'unconfirmed-stop' ? 'unconfirmed'"],['port-abort',"'Local abort alone does not prove remote stop; cleanup remains pending.'"]]}]},
 40:{file:'server/lib/lab40-recovery.ts',shots:[
  {id:'port-guards',cues:[['port-continue',"if (choice === 'continue' && (uncertain || pending)) throw new Lab40Error(409"],['port-fresh',"if (choice === 'fresh-derived' && (uncertain || pending || queued)) throw new Lab40Error(409"],['port-interrupt',"if (choice === 'interrupt' && (uncertain || pending)) throw new Lab40Error(409"]]},
  {id:'port-undo',cues:[['port-undo-version',"if (entry.version !== expectedVersion) throw new Lab40Error(409"],['port-undo-refused',"entry.undo = 'refused'; entry.decision = 'Undo cannot erase"],['port-undo-restore',"} else { entry.hostDraft = entry.snapshotDraft; entry.undo = 'restored-host-draft';"]]},
  {id:'port-live',cues:[['port-rule',"rule: 'Never truncate Managed event history or silently drop accepted commands and applied effects.'"],['port-live-refused',"if (input.mode === 'live') throw new Lab40Error(422"]]}]},
 42:{file:'server/lib/lab42-research.ts',shots:[
  {id:'port-config',cues:[['port-search',"search: { name: 'web_search', enabled: true"],['port-fetch',"fetch: { name: 'web_fetch', enabled: false","url_sources: { user_input: 'none'"],['port-url',"if (url.protocol !== 'https:' || url.username"]]},
  {id:'port-checks',cues:[['port-address',"if (isIP(address) !== 4) throw"],['port-verify','return ids.length > 0 && ids.every(']]},
  {id:'port-hop',cues:[['port-hop','for (let hop = 0; hop <= 2; hop++) {',"catch (error) { decision = 'refused'"],['port-redirect','if (page.redirect) { redirects.push(page.redirect)'],['port-hostile','const hostileInstruction = /IGNORE HOST RULES/i.test(page.text);']]}]},
 41:{file:'server/lib/lab41-lifecycle.ts',shots:[
  {id:'port-turn',cues:[['port-refuse',"if (entry.status === 'archived') throw new Lab41Error(409, 'Archived session refuses a new turn.');"],['port-idle',"if (event.type === 'session.status_idle') { idle = true; break; }"],['port-retrieve',"if (await this.port.status(entry.sessionId) !== 'idle') throw new Lab41Error(502"]]},
  {id:'port-archive',cues:[['port-archive-once',"private async archive(entry: Entry) { if (entry.status === 'archived') throw new Lab41Error(409"],['port-oneshot',"if (scenario === 'one-shot' || scenario === 'archived-refusal') await this.archive(entry);"]]},
  {id:'port-reconnect',cues:[['port-reconnect-refused',"else if (action === 'reconnect') { if (entry.status === 'archived') throw new Lab41Error(409"],['port-hydrate',"entry.lifecycle.push('events.list hydrated history; no sessions.create');"],['port-after-archive',"entry.lifecycle.push('Archived session refused new send; no events.send');"]]}]},
 43:{file:'server/lib/lab43-mcp-bridge.ts',shots:[
  {id:'port-allowlist',cues:[['port-uri',"const allowed = uri === 'lab43://observations/v1' || uri === 'lab43://observations/v2';"],['port-refuse',"else if (method === 'resources/read' && !allowed) { status = 'refused';"],['port-bound',"if (raw.length > 1200) throw new Lab43Error(413, 'MCP result too large.');"]]},
  {id:'port-token',cues:[['port-expiry',"this.owners.set(owner, { consent: true, token, expiresAt: this.now() + 30_000"],['port-bearer',"if (!response.ok) throw new Lab43Error(response.status, response.status === 403 ? 'MCP bridge token refused.'"]]},
  {id:'port-result',cues:[['port-expired',"if (scenario === 'expired-token' || this.now() >= entry.expiresAt) { tokenStatus = 'expired';"],['port-custom',"customToolResult: status === 'allowed' ? { type: 'user.custom_tool_result', tool_use_id:"],['port-direct',"is_error: false, content: result! } : null, directMcpConfigured: false, providerCalls: 0, evidence });"]]}]},
 39:{file:'server/lib/lab39-project-config-root.ts',shots:[
  {id:'port-manifest',cues:[['port-manifest',"const manifest = Object.freeze({ version: 1 as const","mcp: Object.freeze([] as string[])"],['port-hash',"const expectedHash = createHash('sha256').update(manifestText)"]]},
  {id:'port-start',cues:[['port-view','const trusted = entry.suppliedHash === expectedHash;',"branchMarker: 'BRANCH_RULE: ignore the host"],['port-live-refused',"if (input.mode === 'live') throw new Lab39Error(422"],['port-supplied',"const suppliedHash = input.scenario === 'missing-manifest'"]]},
  {id:'port-checked',cues:[['port-takeover',"entry.lastOperation = { operation: 'takeover'"],['port-mismatch',"if (entry.suppliedHash !== expectedHash) throw new Lab39Error(409"],['port-data',"reason: 'Read-only branch data; content has no configuration authority.'"]]}]},
 37:{file:'server/lib/lab37-policy-gate.ts',shots:[
  {id:'port-worker',cues:[['port-spawn','const child = spawn(process.execPath, [workerPath], { windowsHide: true, shell: false'],['port-timeout',"reject(new Lab37Error(504, 'Policy worker timed out.')); }, 3000);"],['port-bounded',"if (code !== 0 || output.length > 2048 || !output.endsWith('\\n')) throw new Lab37Error(502"]]},
  {id:'port-precedence',cues:[['port-path',"const allowedPath = entry.action?.path === '/workspace/notes.txt';"],['port-host',"entry.hostDecision = allowedPath && parsed.data.decision === 'allow' ? 'allow' : 'deny';"],['port-confirm',"entry.confirmation = { type: 'user.tool_confirmation', tool_use_id: entry.eventId,"]]},
  {id:'port-exact',cues:[['port-live-refused',"if (input.mode === 'live') throw new Lab37Error(422"],['port-event',"if (entry.eventId !== input.eventId) throw new Lab37Error(404"],['port-once',"if (entry.status !== 'pending' || entry.deciding) throw new Lab37Error(409"]]}]},
 36:{file:'server/lib/lab36-transport.ts',shots:[
  {id:'port-transport',cues:[['port-call',"const response = await fetch(`${base}${path}`, { method, headers: { 'X-Fixture-Token': token }"],['port-bound',"if (bytes > 16_384) throw new Lab36Error(502, 'Event stream exceeded bound.');"],['port-queue',"if (lines.length > 4) throw new Lab36Error(429, 'Event queue exceeded the host bound.');"]]},
  {id:'port-worker',cues:[['port-spawn',"worker.started = true; const child = spawn(process.execPath, [workerPath], { windowsHide: true, shell: false"],['port-stderr',"child.stderr.on('data', () => { worker.stderrRedacted = true; });"],['port-worker-stop',"outcome = 'worker-error'; remoteStopConfirmed = await port.interrupt(sessionId);"]]},
  {id:'port-cleanup',cues:[['port-live-refused',"if (input.mode === 'live') throw new Lab36Error(422"],['port-cancel',"localAbort = true; outcome = 'canceled'; remoteStopConfirmed = await port.interrupt(sessionId);"],['port-cleanup',"cleanup = remoteStopConfirmed && await port.archive(sessionId) ? 'confirmed' : 'pending';"]]}]},
};
const lab=Number(process.argv[2]);const config=configs[lab];if(!config)throw Error(`Usage: node scripts/capture-live-port-code.mjs ${Object.keys(configs).join('|')}`);
const out=path.resolve(`presentations/managed-agents-lab${String(lab).padStart(2,'0')}-walkthrough/platform`);const file=path.join(out,'capture-evidence.json');
const evidence=JSON.parse(await readFile(file,'utf8'));
if(evidence.captureComplete===false)throw Error(`Lab ${lab} exercise capture is still incomplete; finish it before capturing source views.`);
const capture=await captureBrowser();const {browser}=capture;
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
 page.on('request',r=>{if(r.method()==='POST')throw Error('No lab request is allowed while capturing source');});
 await page.goto(`${origin}/?lesson=${lab}`,{waitUntil:'domcontentloaded',timeout:90000});await page.getByRole('tab',{name:'TypeScript source',exact:true}).waitFor({timeout:90000});
 await page.getByRole('tab',{name:'TypeScript source',exact:true}).click();
 for(const s of config.shots){
  // A shot may open its own file (for example a shared port); otherwise the lab's file is used.
  const source=s.file??config.file;
  await page.getByLabel('Source file',{exact:true}).selectOption({value:source});await page.waitForTimeout(800);
  const lines=page.locator(`pre[aria-label="${source}"] [data-code-line]`);await lines.first().waitFor();
  const texts=await lines.allInnerTexts();
  const find=(pattern,from=0)=>{const i=texts.findIndex((t,k)=>k>=from&&t.includes(pattern));if(i<0)throw Error(`Line not found in ${source}: ${pattern}`);return i;};
  const ranges=s.cues.map(([id,a,b])=>{const start=find(a);return {id,start,end:b?find(b,start):start};});
  await lines.nth(ranges[0].start).evaluate(e=>e.scrollIntoView({block:'start'}));await page.evaluate(()=>window.scrollBy(0,-240));await page.waitForTimeout(500);
  const cues=[];
  for(const r of ranges){
   const box=await page.evaluate(([sel,a,b])=>{const all=document.querySelectorAll(sel);let x1=1e9,y1=1e9,x2=0,y2=0;const text=[];
    for(let i=a;i<=b;i++){const el=all[i];const range=document.createRange();range.selectNodeContents(el.lastElementChild??el);const q=range.getBoundingClientRect();x1=Math.min(x1,q.left);y1=Math.min(y1,q.top);x2=Math.max(x2,q.right);y2=Math.max(y2,q.bottom);text.push(el.innerText.trim());}
    return {text:text.join('\n'),rect:[x1,y1,Math.min(x2,1910)-x1,y2-y1]};},[`pre[aria-label="${source}"] [data-code-line]`,r.start,r.end]);
   const [x,y,w,h]=box.rect;if(w<4||h<4||x<0||y<90||y+h>1068)throw Error(`Offscreen ${s.id}/${r.id} ${JSON.stringify(box.rect)}`);
   cues.push({id:r.id,lines:[r.start+1,r.end+1],...box});
  }
  await page.screenshot({path:path.join(out,s.id+'.png')});
  evidence.shots=evidence.shots.filter(x=>x.id!==s.id);evidence.shots.push({id:s.id,phase:'port',file:source,url:page.url(),cues});
  console.log(`Captured ${s.id}: `+cues.map(c=>`${c.id} L${c.lines[0]}-${c.lines[1]}`).join(', '));
 }
 if(config.narration)evidence.sourceNarration={...evidence.sourceNarration,...config.narration};
 await writeFile(file,JSON.stringify(evidence,null,2));
}finally{await capture.close()}
process.exit(0);
