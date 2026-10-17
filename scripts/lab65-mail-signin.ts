import { PublicClientApplication, LogLevel } from '@azure/msal-node';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Lab65ApprovalStore } from '../server/concepts/65-human-approval.js';

if (!process.argv.includes('--interactive-personal-signin')) throw new Error('Explicit interactive sign-in flag required.');
const clientId = process.env.LAB65_GRAPH_CLIENT_ID, sender = process.env.LAB65_GRAPH_SENDER, recipient = process.env.LAB65_GRAPH_RECIPIENT;
if (!clientId || !sender || !recipient) throw new Error('Configure the dedicated client ID, sender and recipient first.');
const app = new PublicClientApplication({ auth: { clientId, authority: 'https://login.microsoftonline.com/consumers' },
  system: { loggerOptions: { piiLoggingEnabled: false, logLevel: LogLevel.Error, loggerCallback() {} } } });
try {
  const result = await app.acquireTokenByDeviceCode({ scopes: ['https://graph.microsoft.com/Mail.Send'],
    deviceCodeCallback(code) { console.log(JSON.stringify({ action: 'sign-in-required', app: 'managed-agents-lab65-mail',
      verificationUrl: code.verificationUri, userCode: code.userCode, expiresInSeconds: code.expiresIn,
      instructions: `Sign in as ${sender} and review the requested send-mail permission. Never paste your password or token into chat.` })); } });
  if (!result?.accessToken || result.account?.username.toLowerCase() !== sender.toLowerCase()) throw new Error('Signed-in mailbox differs from configured sender.');
  if (!result.scopes.some(scope => /(^|\/)Mail\.Send$/i.test(scope))) throw new Error('Mail.Send consent was not granted.');
  const values = { LAB65_GRAPH_TOKEN: result.accessToken, LAB65_GRAPH_AUTH_MODE: 'delegated',
    LAB65_GRAPH_TOKEN_EXPIRES_AT: result.expiresOn?.toISOString() ?? '', LAB65_EXTERNAL_NOTIFICATIONS: '1' };
  const existing = (await readFile('.env', 'utf8')).split(/\r?\n/).filter(line => !Object.hasOwn(values, line.split('=', 1)[0]!));
  await writeFile('.env', [...existing.filter(Boolean), ...Object.entries(values).map(([key, value]) => `${key}=${value}`), ''].join('\n'));
  console.log(JSON.stringify({ signedIn: true, delegatedMailSend: true, tokenStored: 'ignored server settings', expiresAt: values.LAB65_GRAPH_TOKEN_EXPIRES_AT, refreshTokenPersisted: false }));
  if (process.argv.includes('--send-test-email')) {
    const env = { ...process.env, ...values }, owner = `authorized-email-${crypto.randomUUID()}`;
    const store = new Lab65ApprovalStore(`artifacts/lab65/live-email-${crypto.randomUUID()}.sqlite`, Date.now, env);
    try { const proposed = store.propose(owner); await store.notify(owner, proposed.toolResult.proposalId, 'email');
      const evidence = { at: new Date().toISOString(), channel: 'email', recipient, providerAccepted: true, effectCount: store.snapshot(owner).effects.length,
        note: 'Graph transport acceptance does not prove inbox delivery and does not approve or execute the fictional archive.' };
      await mkdir('artifacts/lab65', { recursive: true }); await writeFile('artifacts/lab65/live-email.json', JSON.stringify(evidence, null, 2));
      console.log(JSON.stringify(evidence));
    } finally { store.close(); }
  }
} catch {
  console.error('Sign-in or email test did not complete. No credential was printed. Check the Microsoft sign-in result and local readiness before retrying.');
  process.exitCode = 1;
}
