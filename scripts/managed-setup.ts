import { writeFile, readFile } from 'node:fs/promises';
import { createManagedClient, managedResourceIds, managedSettings, managedErrorMessage } from '../server/lib/managed-config.js';
import type { AgentCreateParams } from '@anthropic-ai/sdk/resources/beta/agents';
import type { EnvironmentCreateParams } from '@anthropic-ai/sdk/resources/beta/environments';

const command = process.argv[2];
const target = process.argv[3];
try {
  if (target !== undefined && !(target === 'lab05' && (command === 'provision' || command === 'verify'))) throw new Error('target');
  if (command === 'provision' && target === 'lab05') {
    // Lab 05 needs its own agent that declares the custom tools; it reuses the Lab 01 environment.
    const model = process.env.MANAGED_MODEL?.trim();
    if (!model) { console.error('Set MANAGED_MODEL to a supported model available to your account before provisioning.'); process.exit(1); }
    try { await readFile('managed/lab05-resources.local.json'); throw new Error('already provisioned'); }
    catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
    const agentTemplate = JSON.parse(await readFile('managed/lab05-agent.json', 'utf8')) as Omit<AgentCreateParams, 'model'>;
    const agent = await createManagedClient().beta.agents.create({ ...agentTemplate, model });
    await writeFile('managed/lab05-resources.local.json', JSON.stringify({ agentId: agent.id, agentVersion: agent.version }, null, 2), { flag: 'wx' });
    console.info(`CLAUDE_MANAGED_LAB05_AGENT_ID=${agent.id}`);
  } else if (command === 'verify' && target === 'lab05') {
    const { lab05AgentEnv, lab05AgentId, lab05ToolMismatch } = await import('../server/lib/lab05-port.js');
    const id = lab05AgentId();
    if (!id) { console.error(`Set ${lab05AgentEnv} first.`); process.exit(1); }
    const agent = await createManagedClient().beta.agents.retrieve(id);
    const problem = agent.archived_at ? 'it is archived' : agent.mcp_servers.length || agent.skills.length || agent.multiagent
      ? 'it has MCP servers, skills or multiagent configuration' : lab05ToolMismatch(agent.tools);
    if (problem) { console.error(`The Lab 05 agent cannot be used: ${problem}.`); process.exit(1); }
    console.info('Lab 05 agent verified: exactly list_tasks, add_task and complete_task as custom tools. No session started.');
  } else if (command === 'ready') {
    console.info(JSON.stringify(managedSettings(), null, 2));
  } else if (command === 'verify') {
    const settings = managedSettings();
    if (!settings.configured) { console.error('Missing or invalid local configuration. Run managed:ready.'); process.exit(1); }
    const client = createManagedClient();
    const ids = managedResourceIds();
    const agent = await client.beta.agents.retrieve(ids.agentId);
    await client.beta.environments.retrieve(ids.environmentId);
    if (agent.archived_at || agent.tools.length || agent.mcp_servers.length || agent.multiagent) {
      console.error('Lab 01 requires an active agent with no tools, MCP servers or multiagent configuration.'); process.exit(1);
    }
    console.info('Provider access verified; Lab 01 agent has no tools, MCP servers or multiagent configuration. No session started.');
  } else if (command === 'provision') {
    const model = process.env.MANAGED_MODEL?.trim();
    if (!model) { console.error('Set MANAGED_MODEL to a supported model available to your account before provisioning.'); process.exit(1); }
    // Refuse repeated provisioning; reuse the recorded resources instead.
    try { await readFile('managed/resources.local.json'); throw new Error('already provisioned'); }
    catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
    const agentTemplate = JSON.parse(await readFile('managed/lab01-agent.json', 'utf8')) as Omit<AgentCreateParams, 'model'>;
    const environmentTemplate = JSON.parse(await readFile('managed/lab01-environment.json', 'utf8')) as EnvironmentCreateParams;
    const client = createManagedClient();
    const agent = await client.beta.agents.create({ ...agentTemplate, model });
    // Save the agent immediately, so environment failure does not hide the created resource.
    await writeFile('managed/resources.local.json', JSON.stringify({ agentId: agent.id, agentVersion: agent.version }, null, 2), { flag: 'wx' });
    const environment = await client.beta.environments.create(environmentTemplate);
    await writeFile('managed/resources.local.json', JSON.stringify({ agentId: agent.id, agentVersion: agent.version, environmentId: environment.id }, null, 2));
    console.info(`CLAUDE_MANAGED_AGENT_ID=${agent.id}\nCLAUDE_MANAGED_ENVIRONMENT_ID=${environment.id}`);
  } else throw new Error('command');
} catch (error) {
  console.error(command === 'ready' ? 'Local readiness failed.' :
    `${managedErrorMessage(error)} Review local settings and managed/resources.local.json. Provisioning requires MANAGED_MODEL and must not be repeated after partial creation without inspecting Console.`);
  process.exitCode = 1;
}
