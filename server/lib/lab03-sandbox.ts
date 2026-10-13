import { lstat, mkdtemp, mkdir, readdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { bashAllowlist, containerRoots, presets, writableRoots } from '../../shared/lab03-tools.js';
import type { Confirmation, ContainerRoot, Lab03Preset, SandboxFile } from '../../shared/lab03-tools.js';

/** Authored fixture files. The host restores them on reset; they are not agent output. */
export const fixtureFiles = {
  'notes.md': '# Lab 03 notes\n\nReviewer: the draft status should become reviewed.\nTODO: confirm tool permissions before editing.\n',
  'draft.md': '# Draft\n\nStatus: draft\n\nReviewer notes are in notes.md.\n',
} as const;
export type FixtureName = keyof typeof fixtureFiles;
const maxFileBytes = 64 * 1024;
const shownChars = 16000;

/** A path the guard refused. The message is authored here and safe to show. */
export class PathRejected extends Error {}

function rejectHostile(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.length) throw new PathRejected('Path must be a nonempty string.');
  if (raw.length > 512) throw new PathRejected('Path is too long.');
  if (raw.includes('\0')) throw new PathRejected('Path contains a NUL byte.');
  if (/^[a-zA-Z]:/.test(raw) || raw.startsWith('\\\\') || raw.startsWith('//') || raw.includes('\\'))
    throw new PathRejected('Windows drive, UNC and backslash paths are rejected.');
  // Rejected before normalisation: a traversal that happens to land inside a root is still refused.
  if (raw.split('/').includes('..')) throw new PathRejected('Path traversal (..) is rejected.');
  return raw;
}

/**
 * Container-side guard: canonicalises an agent-supplied path and accepts it only inside
 * /workspace, /mnt/session/uploads or /mnt/session/outputs. Relative paths resolve against /workspace.
 */
export function resolveContainerPath(raw: unknown): { root: ContainerRoot; relative: string; path: string } {
  const value = rejectHostile(raw);
  const absolute = path.posix.normalize(value.startsWith('/') ? value : path.posix.join(containerRoots.workspace, value));
  for (const [root, prefix] of Object.entries(containerRoots) as [ContainerRoot, string][]) {
    if (absolute === prefix || absolute.startsWith(`${prefix}/`))
      return { root, relative: absolute.slice(prefix.length + 1), path: absolute };
  }
  throw new PathRejected(`${absolute} is outside /workspace, /mnt/session/uploads and /mnt/session/outputs.`);
}

/** Exact-match bash allowlist; each path argument must also pass the container guard. */
export function checkBash(command: unknown): { allowed: true } | { allowed: false; reason: string } {
  if (typeof command !== 'string') return { allowed: false, reason: 'bash input has no command string.' };
  if (!(bashAllowlist as readonly string[]).includes(command.trim()))
    return { allowed: false, reason: `Command is not in the host allowlist: ${command.slice(0, 120)}` };
  try { for (const token of command.trim().split(/\s+/).slice(1)) resolveContainerPath(token); }
  catch (error) { return { allowed: false, reason: error instanceof PathRejected ? error.message : 'Invalid path.' }; }
  return { allowed: true };
}

export const pathOf = (input: Record<string, unknown>) => input.file_path ?? input.path;
/**
 * Whether the host could ever allow this call: the bash allowlist, the container guard and the
 * "only draft.md in a writable root" rule. Every host allow, automatic or human, goes through it.
 */
export function hostAllowCheck(name: string, input: Record<string, unknown>): { ok: boolean; reason: string } {
  const refuse = (error: unknown) => ({ ok: false, reason: error instanceof PathRejected ? error.message : 'Invalid path.' });
  if (name === 'bash') {
    const check = checkBash(input.command);
    return check.allowed ? { ok: true, reason: 'Exact command is in the host allowlist.' } : { ok: false, reason: check.reason };
  }
  if (name === 'write' || name === 'edit') {
    try {
      const target = resolveContainerPath(input.file_path);
      if (!writableRoots.includes(target.root)) return { ok: false, reason: `${target.path} is a read-only mount.` };
      if (target.relative !== 'draft.md') return { ok: false, reason: `Only draft.md may be changed; refused ${target.path}.` };
      return { ok: true, reason: `${target.path} is inside the writable fixture.` };
    } catch (error) { return refuse(error); }
  }
  if (name === 'read' || name === 'glob' || name === 'grep') {
    const target = pathOf(input);
    if (target === undefined) return { ok: true, reason: 'No path argument; the agent stays in /workspace.' };
    try { return { ok: true, reason: `${resolveContainerPath(target).path} is inside the allowed roots.` }; }
    catch (error) { return refuse(error); }
  }
  return { ok: false, reason: `The host has no approval rule for ${name}.` };
}

/**
 * The host's automatic answer to a paused call. Every allow goes through the same guards that the
 * offline fixture uses to touch disk, so a host never approves a path it would refuse.
 */
export function decideConfirmation(preset: Lab03Preset, toolUseId: string, name: string, input: Record<string, unknown>): Confirmation {
  if ((name === 'write' || name === 'edit') && presets[preset].host[name] === 'deny')
    return { toolUseId, tool: name, result: 'deny', reason: `Host policy denies ${name} in the ${preset} preset.`,
      denyMessage: `The host denied ${name}. Leave the draft unchanged and report this.` };
  const check = hostAllowCheck(name, input);
  const reason = check.reason.slice(0, 300);
  return check.ok ? { toolUseId, tool: name, result: 'allow', reason, denyMessage: null }
    : { toolUseId, tool: name, result: 'deny', reason, denyMessage: reason };
}

const hostDirs: Record<ContainerRoot, string> = { uploads: 'uploads', outputs: 'outputs', workspace: 'workspace' };
export interface Sandbox {
  readonly dir: string;
  /** Host-side guard: a sandbox-relative path whose real location stays inside the sandbox. */
  hostPath(relative: string): Promise<string>;
  /** Maps a guarded container path onto this sandbox. */
  containerToHost(containerPath: unknown): Promise<{ host: string; root: ContainerRoot; path: string }>;
  reset(): Promise<void>;
  list(): Promise<SandboxFile[]>;
  readText(relative: string): Promise<string>;
  writeText(relative: string, content: string): Promise<void>;
  dispose(): Promise<void>;
}

/** A disposable per-run directory under the OS temp dir, laid out like the container mounts. */
export async function createSandbox(base = tmpdir()): Promise<Sandbox> {
  const dir = await mkdtemp(path.join(base, 'lab03-'));
  const real = await realpath(dir);
  async function hostPath(relative: string) {
    const value = rejectHostile(relative);
    if (path.isAbsolute(value) || path.win32.isAbsolute(value)) throw new PathRejected('Absolute host paths are rejected.');
    const joined = path.resolve(real, value);
    const lexical = path.relative(real, joined);
    if (!lexical || lexical.startsWith('..') || path.isAbsolute(lexical)) throw new PathRejected('Path is outside the sandbox.');
    // Symlink escape: every existing link on the way (junctions included) must resolve inside the sandbox.
    // A dangling link is refused too, because writing through it would create its target.
    let current = real;
    for (const segment of lexical.split(path.sep)) {
      current = path.join(current, segment);
      const info = await lstat(current).catch(() => null);
      if (!info) break;
      if (info.isSymbolicLink()) {
        const target = await realpath(current).catch(() => null);
        const inside = target === null ? '..' : path.relative(real, target);
        if (inside.startsWith('..') || path.isAbsolute(inside)) throw new PathRejected('A symlink escapes the sandbox.');
      }
    }
    return joined;
  }
  const sandbox: Sandbox = {
    dir: real, hostPath,
    async containerToHost(containerPath) {
      const target = resolveContainerPath(containerPath);
      const relative = target.relative ? `${hostDirs[target.root]}/${target.relative}` : hostDirs[target.root];
      return { host: await hostPath(relative), root: target.root, path: target.path };
    },
    async reset() {
      for (const name of Object.values(hostDirs)) await rm(path.join(real, name), { recursive: true, force: true });
      for (const name of Object.values(hostDirs)) await mkdir(path.join(real, name));
      for (const [name, content] of Object.entries(fixtureFiles)) await writeFile(path.join(real, 'uploads', name), content, 'utf8');
    },
    async list() {
      const files: SandboxFile[] = [];
      for (const [root, name] of Object.entries(hostDirs) as [ContainerRoot, string][]) {
        let entries: string[] = [];
        try { entries = (await readdir(path.join(real, name))).sort(); } catch { continue; }
        for (const entry of entries.slice(0, 20)) {
          const relative = `${name}/${entry}`;
          let host: string;
          try { host = await hostPath(relative); } catch { continue; } // An escaping link is never read.
          const info = await stat(host).catch(() => null);
          if (!info?.isFile()) continue;
          const content = info.size > maxFileBytes ? '' : await readFile(host, 'utf8');
          files.push({ path: relative, containerPath: `${containerRoots[root]}/${entry}`, writable: writableRoots.includes(root),
            size: info.size, content: content.slice(0, shownChars), truncated: info.size > maxFileBytes || content.length > shownChars });
        }
      }
      return files;
    },
    async readText(relative) {
      const host = await hostPath(relative);
      const info = await stat(host);
      if (info.size > maxFileBytes) throw new PathRejected('File is larger than the lab limit.');
      return readFile(host, 'utf8');
    },
    async writeText(relative, content) {
      if (Buffer.byteLength(content) > maxFileBytes) throw new PathRejected('Content is larger than the lab limit.');
      const host = await hostPath(relative);
      await writeFile(host, content, 'utf8');
    },
    async dispose() { await rm(real, { recursive: true, force: true }); },
  };
  await sandbox.reset();
  return sandbox;
}
