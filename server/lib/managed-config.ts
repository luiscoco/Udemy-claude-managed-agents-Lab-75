import Anthropic from '@anthropic-ai/sdk';
import { VERSION } from '@anthropic-ai/sdk/version';

export function managedSettings(env: NodeJS.ProcessEnv = process.env) {
  const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
  const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
  const missing = [!env.ANTHROPIC_API_KEY?.trim() && 'ANTHROPIC_API_KEY',
    !agentId?.trim() && 'CLAUDE_MANAGED_AGENT_ID', !environmentId?.trim() && 'CLAUDE_MANAGED_ENVIRONMENT_ID'].filter((key): key is string => Boolean(key));
  const invalid: string[] = [];
  function integer(key: string, fallback: number, minimum: number, maximum: number) {
    const raw = env[key] ?? String(fallback);
    if (!/^\d+$/.test(raw) || Number(raw) < minimum || Number(raw) > maximum) invalid.push(key);
    return Number(raw);
  }
  const budgetCents = String(integer('MANAGED_BUDGET_CENTS', 50, 1, 9999));
  const deadlineMs = integer('MANAGED_DEADLINE_MS', 120000, 1000, 120000);
  const maxConcurrent = integer('MANAGED_MAX_CONCURRENT', 2, 1, 10);
  if (env.MANAGED_LIVE_ENABLED && !['true', 'false'].includes(env.MANAGED_LIVE_ENABLED)) invalid.push('MANAGED_LIVE_ENABLED');
  const liveEnabled = env.MANAGED_LIVE_ENABLED === 'true';
  const probe = new Anthropic({ apiKey: 'offline-probe', openTelemetry: { propagation: false, traces: { enabled: false } }, maxRetries: 0 });
  const sdkCompatible = typeof probe.beta.sessions?.create === 'function' && typeof probe.beta.sessions?.events.stream === 'function'
    && typeof probe.beta.agents?.retrieve === 'function' && typeof probe.beta.environments?.retrieve === 'function';
  return { configured: missing.length === 0 && invalid.length === 0, missing, invalid,
    budgetCents, deadlineMs, maxConcurrent, liveEnabled, liveReady: liveEnabled && missing.length === 0 && invalid.length === 0 && sdkCompatible,
    offlineAvailable: true, providerVerified: false, sdkCompatible, sdkVersion: VERSION };
}

export function managedResourceIds(env: NodeJS.ProcessEnv = process.env) {
  return { agentId: (env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID)!,
    environmentId: (env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID)! };
}

export function createManagedClient(env: NodeJS.ProcessEnv = process.env) {
  if (!env.ANTHROPIC_API_KEY?.trim()) throw new Error('Missing ANTHROPIC_API_KEY.');
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, openTelemetry: { propagation: false, traces: { enabled: false } }, maxRetries: 0, timeout: 15000 });
}

export function managedErrorMessage(error: unknown) {
  const status = error instanceof Anthropic.APIError ? error.status : undefined;
  if (status === 401) return 'API authentication failed. Replace the server API key.';
  if (status === 403 || status === 404) return 'Configured resources are inaccessible. Check workspace access and resource IDs.';
  if (status === 429) return 'Provider rate limit reached. Wait before manually trying again.';
  if (status === 400) return 'Provider rejected the configuration. Check model, resource IDs and supported API fields.';
  return 'Managed Agents request failed. Check connectivity and Claude Console; no automatic retry was made.';
}
