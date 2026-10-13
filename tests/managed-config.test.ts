import assert from 'node:assert/strict';
import { test } from 'node:test';
import { managedSettings, managedResourceIds, managedErrorMessage } from '../server/lib/managed-config.js';
import { createManagedPort } from '../server/lib/managed-port.js';

const valid = { ANTHROPIC_API_KEY: 'fixture-secret', CLAUDE_MANAGED_AGENT_ID: 'agent_fixture', CLAUDE_MANAGED_ENVIRONMENT_ID: 'env_fixture' };
test('offline readiness has no credential dependency and never claims provider verification', () => {
  const settings = managedSettings({});
  assert.equal(settings.offlineAvailable, true); assert.equal(settings.liveReady, false);
  assert.equal(settings.providerVerified, false); assert.equal(settings.sdkCompatible, true);
});
test('live gate defaults disabled even with complete credentials', () => {
  assert.equal(managedSettings(valid).configured, true);
  assert.equal(managedSettings(valid).liveReady, false);
  assert.throws(() => createManagedPort(undefined, valid), /disabled/);
  assert.equal(managedSettings({ ...valid, MANAGED_LIVE_ENABLED: 'true' }).liveReady, true);
});
test('invalid limits and nonliteral gates reject live execution without exposing values', () => {
  for (const [key, value] of Object.entries({ MANAGED_BUDGET_CENTS: '0', MANAGED_DEADLINE_MS: '999999', MANAGED_MAX_CONCURRENT: 'NaN', MANAGED_LIVE_ENABLED: 'yes' })) {
    const settings = managedSettings({ ...valid, MANAGED_LIVE_ENABLED: 'true', [key]: value });
    assert.equal(settings.liveReady, false); assert(settings.invalid.includes(key));
    assert.doesNotMatch(JSON.stringify(settings), /fixture-secret|agent_fixture|env_fixture/);
  }
  assert.doesNotMatch(managedErrorMessage(new Error('fixture-secret')), /fixture-secret/);
});
test('canonical IDs override backward compatible aliases', () => {
  assert.deepEqual(managedResourceIds({ ...valid, MANAGED_AGENT_ID: 'old', MANAGED_ENVIRONMENT_ID: 'old' }),
    { agentId: 'agent_fixture', environmentId: 'env_fixture' });
});
