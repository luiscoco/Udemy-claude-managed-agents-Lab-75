// Lab 23 live demo: what a Managed session really receives versus the host-side capability bundle.
// Run from the repository root as a copy named _live23.ts:
//   node --env-file=.env --import tsx _live23.ts
// Read-only except one session that is created WITHOUT any user message (no model turn) and archived in finally.
import Anthropic from '@anthropic-ai/sdk';
import { readLab23Bundle } from './server/lib/lab23-bundles.js';

const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
const agentId = (process.env.CLAUDE_MANAGED_AGENT_ID ?? process.env.MANAGED_AGENT_ID)?.trim();
const environmentId = (process.env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? process.env.MANAGED_ENVIRONMENT_ID)?.trim();
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID in .env.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 15000 });
const deadline = setTimeout(() => { console.log('Deadline reached (120 s): stopping.'); process.exit(1); }, 120_000);

type Caps = { tools: Anthropic.Beta.BetaManagedAgentsAgent['tools']; skills: Anthropic.Beta.BetaManagedAgentsAgent['skills'];
  mcp_servers: Anthropic.Beta.BetaManagedAgentsAgent['mcp_servers'] };
function toolNames(caps: Caps) {
  return caps.tools.flatMap(tool => tool.type === 'agent_toolset_20260401'
    ? tool.configs.filter(config => config.enabled).map(config => config.name)
    : tool.type === 'custom' ? [`custom:${tool.name}`] : [`mcp:${tool.mcp_server_name}`]);
}
const skillNames = (caps: Caps) => caps.skills.map(skill => `${skill.type}:${skill.skill_id}@${skill.version}`);
const mcpNames = (caps: Caps) => caps.mcp_servers.map(server => server.name);
const list = (items: string[]) => items.length ? items.join(', ') : 'none';
const fingerprint = (caps: Caps) => JSON.stringify([toolNames(caps), skillNames(caps), mcpNames(caps)]);

let sessionId: string | null = null;
try {
  // 1. The host bundle: checked locally, never sent anywhere.
  const bundle = await readLab23Bundle('valid');
  console.log(`Host bundle ${bundle.manifest.namespace} v${bundle.manifest.version} · ${bundle.manifest.contributions.length} contributions hash-checked`
    + ` · manifest ${bundle.manifestHash.slice(0, 12)}…`);

  // 2. The configured agent: the only capability source a session uses.
  const agent = await client.beta.agents.retrieve(agentId);
  console.log(`Agent ${agent.id} retrieved · version ${agent.version} · model ${agent.model.id}`);
  console.log(`Agent tools (enabled): ${list(toolNames(agent))}`);
  console.log(`Agent skills: ${list(skillNames(agent))} · MCP servers: ${list(mcpNames(agent))}`);

  // 3. Workspace skills are separate, versioned API resources.
  const skills: Anthropic.Beta.BetaSkill[] = [];
  for await (const skill of client.beta.skills.list({ source: 'custom' })) { skills.push(skill); if (skills.length >= 20) break; }
  console.log(`Workspace custom skills: ${skills.length}`);
  for (const skill of skills.slice(0, 3)) console.log(`  ${skill.display_name} · latest ${skill.latest_version_id}`);

  // 4. Are the bundle's names anywhere on the agent?
  const bundleNames = ['bird.list_sightings', 'bird.format_observation', 'bird.catalog'];
  const agentText = fingerprint(agent);
  const found = bundleNames.filter(name => agentText.includes(name));
  console.log(`Bundle names on the agent: ${found.length ? found.join(', ') : 'none'} (checked ${bundleNames.join(', ')})`);

  // 5. A session pinned to that agent version: created, inspected, archived. No user message is sent.
  const session = await client.beta.sessions.create({ agent: { type: 'agent', id: agent.id, version: agent.version },
    environment_id: environmentId, title: 'Lab 23 capability snapshot (no turn)' });
  sessionId = session.id;
  console.log(`Session ${session.id} created · status ${session.status} · no message sent`);
  const snapshot = (await client.beta.sessions.retrieve(session.id)).agent;
  console.log(`Session snapshot: agent version ${snapshot.version} · tools ${toolNames(snapshot).length}`
    + ` · skills ${snapshot.skills.length} · MCP servers ${snapshot.mcp_servers.length}`);
  console.log(`Snapshot equals the agent's capabilities: ${fingerprint(snapshot) === agentText ? 'yes' : 'NO'}`);
} finally {
  if (sessionId) {
    try {
      const archived = await client.beta.sessions.archive(sessionId);
      console.log(`Archived: ${archived.archived_at ? 'yes' : 'no'}`);
    } catch (error) { console.log(`Archive failed: ${(error as Error).message}`); }
  }
  clearTimeout(deadline);
}
