import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configure, repository } from './configure-github-live.mjs';

const configuration = { secrets: { ANTHROPIC_API_KEY: 'fictional-private-value' }, variables: { CLAUDE_MANAGED_AGENT_ID: 'fictional-agent' } };
function fixture(initial = null, variables = [], secrets = [], policies = [{ name: 'main', type: 'branch' }]) {
  const calls = [];
  let environment = initial;
  const call = (args, input) => {
    calls.push({ args, input });
    const reply = value => ({ status: 0, stdout: JSON.stringify(value), stderr: '' });
    if (args[0] === 'auth') return reply({});
    if (args[0] === 'secret') { secrets.push({ name: args[2] }); return reply({}); }
    if (args[0] === 'variable') { variables.push({ name: args[2], value: input }); return reply({}); }
    if (args.includes('PUT')) { environment = JSON.parse(input); return reply(environment); }
    if (args.includes('POST')) { policies.push(JSON.parse(input)); return reply({}); }
    const path = args.find(value => value.startsWith('repos/'));
    if (path === `repos/${repository}`) return reply({ permissions: { admin: true } });
    if (path.endsWith('/variables')) return reply([{ variables }]);
    if (path.endsWith('/secrets')) return reply([{ secrets }]);
    if (path.endsWith('/deployment-branch-policies')) return reply([{ branch_policies: policies }]);
    return environment ? reply(environment) : { status: 1, stdout: '', stderr: 'HTTP 404' };
  };
  return { call, calls };
}
test('new environment is main-only before secrets are sent, and values use stdin', () => {
  const fake = fixture(); const result = configure(configuration, fake.call);
  assert.equal(result.configured, true);
  const branch = fake.calls.findIndex(c => c.args.includes('POST'));
  const secret = fake.calls.findIndex(c => c.args[0] === 'secret');
  assert.ok(branch >= 0 && secret > branch);
  assert.equal(fake.calls[secret].input, configuration.secrets.ANTHROPIC_API_KEY);
  assert.ok(fake.calls.every(c => !c.args.some(arg => arg.includes(configuration.secrets.ANTHROPIC_API_KEY))));
  assert.doesNotMatch(JSON.stringify(result), /fictional-private-value/);
});
test('existing reviewers and secrets are preserved without updating protections', () => {
  const fake = fixture({ deployment_branch_policy: { custom_branch_policies: true }, protection_rules: [{ type: 'required_reviewers' }] }, [], [{ name: 'ANTHROPIC_API_KEY' }]);
  const result = configure(configuration, fake.call);
  assert.deepEqual(result.preservedExistingSecrets, ['ANTHROPIC_API_KEY']);
  assert.ok(!fake.calls.some(c => c.args.includes('PUT') || c.args.includes('POST') || c.args[0] === 'secret'));
});
test('conflicting variables or unrestricted environments stop before any write', () => {
  for (const fake of [fixture({ deployment_branch_policy: null }), fixture({ deployment_branch_policy: { custom_branch_policies: true } }, [{ name: 'CLAUDE_MANAGED_AGENT_ID', value: 'different' }])]) {
    assert.throws(() => configure(configuration, fake.call));
    assert.ok(!fake.calls.some(c => c.args.includes('PUT') || c.args.includes('POST') || ['secret', 'variable'].includes(c.args[0])));
  }
});
test('authentication failure stops before repository access or secret transmission', () => {
  let calls = 0;
  assert.throws(() => configure(configuration, () => { calls++; return { status: 1, stdout: '', stderr: 'not signed in' }; }), /Sign in first/);
  assert.equal(calls, 1);
});
