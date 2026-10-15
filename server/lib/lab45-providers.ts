import { createServer } from 'node:http';
import { lab45CapabilitySchema, lab45SnapshotSchema } from '../../shared/lab45-cloud-providers.js';
import type { Lab45Target, Lab45Scenario } from '../../shared/lab45-cloud-providers.js';
import { managedSettings } from './managed-config.js';

export class Lab45Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
const catalog = [
  { id: 'claude-api', label: 'Direct Claude API', messagesApi: true, managedDocumented: true, installedManagedClientVerified: true, managedRouteEnabled: true,
    authShape: 'Server-side Anthropic API key', prerequisites: ['Agent ID', 'Environment ID', 'Live opt-in', 'Budget and deadline'], limitations: [],
    documentation: 'https://platform.claude.com/docs/en/api/overview' },
  { id: 'claude-platform-aws', label: 'Claude Platform on AWS', messagesApi: true, managedDocumented: true, installedManagedClientVerified: false, managedRouteEnabled: false,
    authShape: 'AWS SigV4 or Claude Platform on AWS API key; workspace and regional endpoint',
    prerequisites: ['Workspace ID', 'Regional endpoint', 'IAM authorization', 'Managed agent and environment', 'Installed Managed AWS client verification'],
    limitations: ['Outcomes and multi-agent sessions unavailable per current AWS feature support', 'Autonomous sessions require credential refresh within six hours'],
    documentation: 'https://docs.aws.amazon.com/claude-platform/latest/userguide/feature-support.html' },
  { id: 'bedrock', label: 'Amazon Bedrock', messagesApi: true, managedDocumented: false, installedManagedClientVerified: false, managedRouteEnabled: false,
    authShape: 'AWS Bedrock credentials and endpoint', prerequisites: ['Bedrock model access and region'],
    limitations: ['Messages client is not evidence of Managed session support'], documentation: 'https://platform.claude.com/docs/en/api/overview' },
  { id: 'vertex', label: 'Google Cloud Vertex AI', messagesApi: true, managedDocumented: false, installedManagedClientVerified: false, managedRouteEnabled: false,
    authShape: 'Google Cloud credentials, project and region', prerequisites: ['Vertex model access and region'],
    limitations: ['Messages client is not evidence of Managed session support'], documentation: 'https://platform.claude.com/docs/en/api/overview' },
  { id: 'foundry', label: 'Microsoft Foundry', messagesApi: true, managedDocumented: false, installedManagedClientVerified: false, managedRouteEnabled: false,
    authShape: 'Foundry API key or Entra identity and resource', prerequisites: ['Foundry resource and model deployment'],
    limitations: ['Messages client is not evidence of Managed session support'], documentation: 'https://platform.claude.com/docs/en/api/overview' },
].map(item => lab45CapabilitySchema.parse(item));
const synthetic = 'synthetic-local-token';
export class Lab45Providers {
  private closed = false; private active = 0;
  facts() { const ready = managedSettings(); return { source: 'host-only', catalogChecked: '2026-10-15',
    firstParty: { configured: ready.configured, liveReady: ready.liveReady, missing: ready.missing, sdkCompatible: ready.sdkCompatible },
    providerCalls: 0, noAutoProvisioning: true, documentation: ['https://platform.claude.com/docs/en/api/overview',
      'https://docs.aws.amazon.com/claude-platform/latest/userguide/feature-support.html',
      'https://docs.aws.amazon.com/claude-platform/latest/userguide/authentication.html'] }; }
  catalog() { return { source: 'official-docs-and-installed-sdk', checkedAt: '2026-10-15', targets: catalog, providerCalls: 0 }; }
  same(target: Lab45Target) { const item = catalog.find(row => row.id === target)!;
    return { target, messagesApi: item.messagesApi, managedDocumented: item.managedDocumented,
      managedRouteEnabled: item.managedRouteEnabled, distinction: item.managedRouteEnabled ? 'Installed first-party Managed session types verified.' :
        item.managedDocumented ? 'Documented Managed platform, but this installed TypeScript client path is not verified.' :
          'Messages support does not imply Managed sessions.', providerCalls: 0 }; }
  async emulate(target: Lab45Target, scenario: Lab45Scenario) {
    if (this.closed || this.active >= 4) throw new Lab45Error(429, 'Provider emulator capacity reached.');
    this.active++;
    const item = catalog.find(row => row.id === target)!;
    const server = createServer((request, response) => { response.setHeader('Content-Type', 'application/json');
      if (request.method !== 'POST' || request.url !== '/emulate') { response.statusCode = 404; response.end('{}'); return; }
      if (request.headers.authorization !== `Bearer ${synthetic}`) { response.statusCode = 401; response.end(JSON.stringify({ error: 'synthetic authentication mismatch' })); return; }
      if (request.headers['x-model'] !== 'claude-synthetic') { response.statusCode = 400; response.end(JSON.stringify({ error: 'synthetic model mismatch' })); return; }
      if (request.headers['x-config'] !== 'fixture-ready') { response.statusCode = 422; response.end(JSON.stringify({ error: 'synthetic configuration missing' })); return; }
      response.end(JSON.stringify({ ready: true })); });
    try { await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      const address = server.address(); if (!address || typeof address === 'string') throw new Lab45Error(500, 'No loopback port.');
      const response = await fetch(`http://127.0.0.1:${address.port}/emulate`, { method: 'POST', headers: {
        Authorization: `Bearer ${scenario === 'bad-auth' ? 'synthetic-wrong' : synthetic}`,
        'X-Model': scenario === 'model-mismatch' ? 'synthetic-wrong-model' : 'claude-synthetic',
        'X-Config': scenario === 'missing-config' ? 'fixture-missing' : 'fixture-ready',
      }, signal: AbortSignal.timeout(2000) });
      const status = !item.managedRouteEnabled || scenario === 'missing-feature' ? 'refused' : response.ok ? 'ready' : 'refused';
      const reason = !item.managedRouteEnabled ? item.managedDocumented ?
        'Managed documented, but installed client/endpoint path is unverified; route remains unavailable.' :
        'Messages provider path does not establish Managed session support.' : scenario === 'missing-feature' ?
          'Required Managed feature missing from selected target.' : response.ok ? 'Synthetic loopback preflight passed.' :
          `Synthetic preflight refused with HTTP ${response.status}.`;
      return lab45SnapshotSchema.parse({ source: 'loopback-provider-emulator', target, scenario, endpoint: 'loopback', syntheticCredential: 'redacted',
        managedRouteEnabled: item.managedRouteEnabled, status, reason, httpStatus: response.status, model: 'claude-synthetic', sessionCreated: false,
        providerCalls: 0, evidence: ['Loopback request used a synthetic credential; no cloud account or provider request.',
          `Capability catalog: Managed documented ${item.managedDocumented}; installed client verified ${item.installedManagedClientVerified}.`,
          `HTTP ${response.status} is emulator evidence only.`] });
    } finally { this.active--; server.closeAllConnections(); if (server.listening) await new Promise<void>(resolve => server.close(() => resolve())); }
  }
  close() { this.closed = true; }
}
