import { mkdir, writeFile } from 'node:fs/promises';
import { notificationReadiness } from '../server/concepts/65-human-approval.js';
import { Lab45Providers } from '../server/lib/lab45-providers.js';
import { remoteTelemetryReadiness } from '../server/lib/lab44-telemetry.js';
import { azureTelemetryReadiness } from '../server/lib/lab44-azure.js';
const providers = new Lab45Providers();
const report = { at: new Date().toISOString(), providerCalls: 0, keyChanged: false,
  cloud: providers.catalog().targets.map(target => ({ target: target.id, routeEnabled: target.managedRouteEnabled,
    installedClientVerified: target.installedManagedClientVerified, prerequisites: target.prerequisites,
    status: target.id === 'claude-api' ? providers.facts().firstParty.liveReady ? 'configured-not-remotely-verified' : 'setup-required'
      : target.managedDocumented ? target.installedManagedClientVerified ? 'requires-cloud-account-configuration' : 'requires-cloud-account-and-verified-adapter' : 'managed-session-route-unsupported' })),
  notifications: notificationReadiness(),
  azureTelemetry: azureTelemetryReadiness(),
  awsSetup: providers.facts().awsSetup,
  telemetry: { remoteAdapterImplemented: true, ...remoteTelemetryReadiness(), requirement: 'Configure a reviewed HTTPS collector destination; export is explicit and excludes recorded content and provider event fixtures.' },
  editor: { command: 'node --import tsx scripts/lab69-real-editor.ts', isolatedProfile: true, providerCalls: 0 },
};
providers.close(); await mkdir('artifacts/course', { recursive: true });
await writeFile('artifacts/course/integration-readiness.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
