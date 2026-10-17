import AnthropicAws from '@anthropic-ai/aws-sdk';

export function awsReadiness(env: NodeJS.ProcessEnv = process.env) {
  const fields = ['ANTHROPIC_AWS_API_KEY', 'ANTHROPIC_AWS_WORKSPACE_ID', 'LAB45_AWS_REGION', 'LAB45_AWS_AGENT_ID', 'LAB45_AWS_ENVIRONMENT_ID'];
  const missing = fields.filter(key => !env[key]?.trim()), invalid: string[] = [];
  if (env.LAB45_AWS_REGION && !/^[a-z]{2}(?:-[a-z]+)+-\d$/.test(env.LAB45_AWS_REGION)) invalid.push('LAB45_AWS_REGION');
  for (const key of ['ANTHROPIC_AWS_WORKSPACE_ID', 'LAB45_AWS_AGENT_ID', 'LAB45_AWS_ENVIRONMENT_ID']) if (env[key] && !/^[A-Za-z0-9_-]{1,150}$/.test(env[key]!)) invalid.push(key);
  const enabled = env.LAB45_AWS_LIVE_ENABLED === '1';
  return { enabled, ready: enabled && !missing.length && !invalid.length, missing, invalid, enableSetting: 'LAB45_AWS_LIVE_ENABLED=1',
    sdk: '@anthropic-ai/aws-sdk@0.8.0', operation: 'read-only agent and environment lookup', remotelyVerified: false };
}
export function awsManagedSurface() {
  const client = new AnthropicAws({ apiKey: 'offline-probe', awsRegion: 'us-east-1', workspaceId: 'offline-workspace', baseURL: 'https://aws-external-anthropic.us-east-1.api.aws', maxRetries: 0 });
  return typeof client.beta.agents.retrieve === 'function' && typeof client.beta.environments.retrieve === 'function'
    && typeof client.beta.sessions.create === 'function' && typeof client.beta.sessions.events.stream === 'function';
}
export async function checkAwsResources(env: NodeJS.ProcessEnv = process.env, fetcher?: typeof fetch) {
  const readiness = awsReadiness(env); if (!readiness.ready) throw new Error('AWS setup missing, invalid or disabled; inspect readiness.');
  const client = new AnthropicAws({ apiKey: env.ANTHROPIC_AWS_API_KEY!, authToken: null, awsRegion: env.LAB45_AWS_REGION!, workspaceId: env.ANTHROPIC_AWS_WORKSPACE_ID!,
    baseURL: `https://aws-external-anthropic.${env.LAB45_AWS_REGION}.api.aws`, maxRetries: 0, timeout: 5000, logLevel: 'off', fetchOptions: { redirect: 'error' }, ...(fetcher ? { fetch: fetcher } : {}) });
  try { const agent = await client.beta.agents.retrieve(env.LAB45_AWS_AGENT_ID!, {}, { timeout: 5000 });
    const environment = await client.beta.environments.retrieve(env.LAB45_AWS_ENVIRONMENT_ID!, {}, { timeout: 5000 });
    if (agent.id !== env.LAB45_AWS_AGENT_ID || agent.archived_at || environment.id !== env.LAB45_AWS_ENVIRONMENT_ID || environment.archived_at) throw new Error('Resource mismatch.');
    return { source: 'claude-platform-aws', resourcesAccessible: true, lookups: 2, sessionCreated: false, modelRunVerified: false };
  } catch { throw new Error('AWS resource check failed. Check account permissions, regional workspace, resource IDs and AWS-specific key; no session was created.'); }
}
