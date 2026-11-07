// Validate the saved real response against the same closed schema as the host. No API calls.
import {readFile,writeFile} from 'node:fs/promises';
import {lab50SummarySchema} from '../../shared/lab50-capstone.js';
const path='presentations/managed-agents-lab50-walkthrough/platform/capture-evidence.json';
const evidence=JSON.parse(await readFile(path,'utf8'));
const messages=String(evidence.live_approved??'').split('\n\n').filter(line=>line.startsWith('agent: '));
if(!messages.length)throw Error('No saved live agent response to audit');
const report=JSON.parse(messages.at(-1)!.slice('agent: '.length));
const checked=lab50SummarySchema.safeParse(report);
evidence.liveReportAudit={source:'saved-real-agent-response-checked-with-host-schema',valid:checked.success,
 issues:checked.success?[]:checked.error.issues.map(issue=>({path:issue.path,code:issue.code,message:issue.message})),
 hostRefundRecorded:/Refunds:.*2500 cents/.test(evidence.live_approved),
 archiveConfirmed:evidence.status_live_closed==='Cleanup: archived.'};
await writeFile(path,JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence.liveReportAudit));
