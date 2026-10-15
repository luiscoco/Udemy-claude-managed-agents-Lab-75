import { createHash, randomUUID } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { lab23CapabilitySchema, lab23InventorySchema, lab23ManifestSchema, lab23RunResultSchema } from '../../shared/lab23-plugins.js';
import type { Lab23Inventory, Lab23Manifest, Lab23RunResult, Lab23Selection } from '../../shared/lab23-plugins.js';

export class Lab23Error extends Error { constructor(public status: number, message: string) { super(message); } }
const rootUrl = new URL('../../fixtures/lab23/bird-notebook/', import.meta.url);
const paths = { command: 'command.json', tool: 'tool.json', 'primary-agent': 'primary.json',
  'worker-agent': 'worker.json', mcp: 'mcp.json', skill: 'skill/SKILL.md' } as const;
const hash = (text: string) => createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
const commandSchema = z.strictObject({ name: z.literal('bird.observation'), kind: z.literal('model-template'),
  template: z.literal('Format a fictional {species} observation note.'),
  arguments: z.strictObject({ species: z.tuple([z.literal('Aurora Finch'), z.literal('Forest Wren')]) }) });
const location = z.enum(['north marsh', 'pine grove']);
const toolSchema = z.strictObject({ name: z.literal('bird.list_sightings'), type: z.literal('custom'), access: z.literal('read-only'),
  input: z.strictObject({ location: z.tuple([z.literal('north marsh'), z.literal('pine grove')]) }),
  records: z.array(z.strictObject({ species: z.enum(['Aurora Finch', 'Forest Wren']), location, count: z.number().int().min(1).max(50) })).length(2) });
const primarySchema = z.strictObject({ name: z.literal('bird.reviewer'), role: z.literal('primary'),
  tools: z.tuple([z.literal('bird.list_sightings')]), skills: z.tuple([z.literal('bird.format_observation')]),
  mcpServers: z.tuple([z.literal('bird.catalog')]), dynamicDelegation: z.literal(false) });
const workerSchema = z.strictObject({ name: z.literal('bird.worker'), role: z.literal('worker'),
  tools: z.array(z.never()).max(0), skills: z.array(z.never()).max(0), mcpServers: z.array(z.never()).max(0),
  dynamicDelegation: z.literal(false) });
const mcpSchema = z.strictObject({ name: z.literal('bird.catalog'), type: z.literal('url'),
  url: z.literal('https://example.invalid/bird-mcp'), auth: z.literal('none'), enabledByDefault: z.literal(false) });
type Bundle = { manifest: Lab23Manifest; manifestHash: string; tool: z.infer<typeof toolSchema> };
async function file(path: string) {
  const root = await realpath(rootUrl), url = new URL(path, rootUrl), candidate = fileURLToPath(url);
  const stat = await lstat(candidate), actual = await realpath(candidate), inside = relative(root, actual);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8192 || !inside || isAbsolute(inside) || inside === '..' || inside.startsWith('..' + sep))
    throw new Lab23Error(422, 'Bundle file failed its fixed-path boundary or size check.');
  return (await readFile(actual, 'utf8')).replace(/\r\n/g, '\n');
}
export async function readLab23Bundle(variant: 'valid' | 'malformed' | 'missing-directory' | 'changed-hash' | 'elevated-worker' = 'valid'): Promise<Bundle> {
  const manifestText = await file('manifest.json');
  let raw: unknown = JSON.parse(manifestText);
  if (variant !== 'valid') {
    const copy = structuredClone(raw) as Record<string, any>;
    if (variant === 'malformed') copy.contributions.push({ kind: 'hook', path: 'hook.js', sha256: '0'.repeat(64) });
    if (variant === 'missing-directory') copy.contributions.find((entry: { kind: string }) => entry.kind === 'skill').path = 'missing/SKILL.md';
    if (variant === 'changed-hash') copy.contributions.find((entry: { kind: string }) => entry.kind === 'tool').sha256 = '0'.repeat(64);
    if (variant === 'elevated-worker') copy.workerOverride = { tools: ['bird.list_sightings'] };
    raw = copy;
  }
  const manifest = lab23ManifestSchema.parse(raw);
  const kinds = new Set(manifest.contributions.map(entry => entry.kind));
  if (kinds.size !== 6) throw new Lab23Error(422, 'Bundle must contain one reviewed contribution of each supported kind.');
  const loaded = new Map<string, string>();
  for (const entry of manifest.contributions) {
    if (entry.path !== paths[entry.kind]) throw new Lab23Error(422, 'Bundle contribution path is outside the reviewed allowlist.');
    const text = await file(entry.path);
    if (hash(text) !== entry.sha256) throw new Lab23Error(422, 'Bundle contribution hash differs from the reviewed manifest.');
    loaded.set(entry.kind, text);
  }
  commandSchema.parse(JSON.parse(loaded.get('command')!));
  const tool = toolSchema.parse(JSON.parse(loaded.get('tool')!));
  primarySchema.parse(JSON.parse(loaded.get('primary-agent')!));
  workerSchema.parse(JSON.parse(loaded.get('worker-agent')!));
  mcpSchema.parse(JSON.parse(loaded.get('mcp')!));
  if (!/^---\nname: bird\.format_observation\ndescription: [^\n]+\n---\n/.test(loaded.get('skill')!))
    throw new Lab23Error(422, 'Skill snapshot frontmatter or namespace is invalid.');
  return { manifest, manifestHash: hash(manifestText), tool };
}

function capabilities(selection: Lab23Selection) {
  return lab23CapabilitySchema.parse({ commands: selection.enabled ? ['bird.observation'] : [],
    tools: selection.enabled ? ['bird.list_sightings'] : [], skills: selection.enabled && selection.includeSkill ? ['bird.format_observation'] : [],
    mcpServers: selection.enabled && selection.includeMcp ? ['bird.catalog'] : [],
    primary: 'bird.reviewer', worker: 'bird.worker', workerTools: [], dynamicDelegation: false });
}
export class Lab23Bundles {
  private active: Bundle | null = null; private runs = new Map<string, Lab23RunResult[]>();
  async ensure() { if (!this.active) this.active = await readLab23Bundle(); return this.active; }
  async catalog(owner: string) { const bundle = await this.ensure(); return { source: 'reviewed-host-bundle' as const,
    namespace: bundle.manifest.namespace, hostVersion: bundle.manifest.version, manifestHash: bundle.manifestHash,
    contributions: bundle.manifest.contributions, recent: (this.runs.get(owner) ?? []).map(item => ({ runId: item.runId, enabled: item.selection.enabled, manifestHash: item.manifestHash })),
    liveReady: false, note: 'Local bundle inventory only. No Managed agent, skill, or MCP resource was provisioned or resolved.' }; }
  async reload(variant: Parameters<typeof readLab23Bundle>[0]) { const next = await readLab23Bundle(variant); this.active = next;
    return { reloaded: true, hostVersion: next.manifest.version, manifestHash: next.manifestHash,
      note: 'Local inventory refreshed. Existing remote sessions, if any, are unchanged.' }; }
  async inventory(selection: Lab23Selection): Promise<Lab23Inventory> { const bundle = await this.ensure(); const cap = capabilities(selection);
    return lab23InventorySchema.parse({ source: 'reviewed-host-bundle', hostVersion: bundle.manifest.version,
      manifestHash: bundle.manifestHash, selection, requested: cap, resolved: cap,
      resolvedSource: 'authored-fixture', remoteSessionId: null,
      note: 'Requested and resolved inventories agree in this authored fixture only. Cloud resolution requires separately provisioned pinned resources and a fresh or documented idle session update.' }); }
  async run(owner: string, selection: Lab23Selection): Promise<Lab23RunResult> {
    const bundle = await this.ensure(), inventory = await this.inventory(selection);
    const matches = selection.enabled ? bundle.tool.records.filter(row => row.location === selection.location) : [];
    const result = lab23RunResultSchema.parse({ ...inventory, runId: randomUUID(), source: 'authored-fixture', providerSends: 0,
      handlerInvocations: selection.enabled ? 1 : 0,
      effectLedger: selection.enabled ? [{ tool: 'bird.list_sightings', input: { location: selection.location }, result: matches }] : [],
      skillReadObserved: false, mcpContacted: false });
    const prior = this.runs.get(owner) ?? []; prior.push(result); if (prior.length > 8) prior.shift(); this.runs.set(owner, prior);
    return result;
  }
  reset(owner: string) { this.runs.delete(owner); return { cleared: true, note: "Only this owner's local comparison history was cleared; the reviewed bundle remains loaded." }; }
  async close() { this.runs.clear(); this.active = null; }
}
