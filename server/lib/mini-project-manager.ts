import { spawn, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { miniProjects, type MiniProjectStatus } from '../../shared/mini-projects.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
type Running = { children: ChildProcess[]; mode: 'learner' | 'reference'; ready: boolean; port: number; backend: number; notice: string | null };
function occupied(port: number) {
  return new Promise<boolean>(resolve => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const done = (value: boolean) => { socket.destroy(); resolve(value); };
    socket.setTimeout(500, () => done(false)); socket.once('connect', () => done(true)); socket.once('error', () => done(false));
  });
}
async function ready(url: string, child: ChildProcess, valid: (response: Response) => Promise<boolean>) {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) throw Error('Project process exited during startup.');
    try { const response = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (response.ok && await valid(response)) return; } catch { /* Wait for startup. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw Error('Project startup timed out. Try again after checking its dependencies.');
}
export class MiniProjectManager {
  private active = new Map<string, Running>();
  private starting = new Set<string>();
  constructor(private env: NodeJS.ProcessEnv = process.env) {}
  list(): MiniProjectStatus[] {
    const missing = [
      !this.env.ANTHROPIC_API_KEY?.trim() && 'ANTHROPIC_API_KEY',
      !(this.env.CLAUDE_MANAGED_AGENT_ID || this.env.MANAGED_AGENT_ID)?.trim() && 'CLAUDE_MANAGED_AGENT_ID',
      !(this.env.CLAUDE_MANAGED_ENVIRONMENT_ID || this.env.MANAGED_ENVIRONMENT_ID)?.trim() && 'CLAUDE_MANAGED_ENVIRONMENT_ID',
      this.env.MANAGED_LIVE_ENABLED !== 'true' && 'MANAGED_LIVE_ENABLED=true',
      this.env.MILESTONE_LIVE_ENABLED === 'false' && 'MILESTONE_LIVE_ENABLED=true',
    ].filter((value): value is string => Boolean(value));
    return miniProjects.map(project => {
      const item = this.active.get(project.id);
      return { ...project, liveAvailable: missing.length === 0, liveSetupRequired: missing, frontend: item?.port ?? project.frontend, backend: item?.backend ?? project.backend,
        status: item?.ready ? 'running' : this.starting.has(project.id) ? 'starting' : 'stopped',
        mode: item?.mode ?? null, url: item?.ready ? `http://127.0.0.1:${item.port}/` : null, notice: item?.notice ?? null,
        dependenciesReady: existsSync(join(root, 'mini-projects', project.id, 'node_modules', 'vite', 'bin', 'vite.js')) };
    });
  }
  async start(id: string, mode: 'learner' | 'reference') {
    const project = miniProjects.find(item => item.id === id);
    if (!project) throw Error('Unknown project.');
    if (this.starting.has(id)) throw Error('This project is already starting.');
    const existing = this.active.get(id);
    if (existing) {
      if (existing.mode !== mode) throw Error('Stop the project before changing workspace mode.');
      return this.list().find(item => item.id === id)!;
    }
    if (!this.list().find(item => item.id === id)!.dependenciesReady) throw Error('Install the project dependencies first: npm run projects:install from the course folder.');
    this.starting.add(id);
    try {
      let frontend = 0, backend = 0;
      for (let attempt = 0; attempt < 10; attempt++) {
        const front = project.frontend + attempt * 10, back = project.backend + attempt * 10;
        if (!await occupied(front) && !await occupied(back)) { frontend = front; backend = back; break; }
      }
      if (!frontend) throw Error('No free project ports. Stop an unused local instance and try again.');
      const cwd = join(root, 'mini-projects', project.id);
      // Give frontend processes only runtime variables, never provider credentials.
      const runtime: NodeJS.ProcessEnv = {};
      for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'PLAYWRIGHT_BROWSERS_PATH', 'PYTHON', 'VIRTUAL_ENV']) {
        if (this.env[key]) runtime[key] = this.env[key];
      }
      Object.assign(runtime, { PORT: String(backend), PROJECT_API_PORT: String(backend), PROJECT_MODE: mode, VITE_PROJECT_MODE: mode, PROJECT_WEB_PORT: String(frontend) });
      const localPython = join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
      if (!runtime.PYTHON && existsSync(localPython)) runtime.PYTHON = localPython;
      const backendEnv = { ...runtime, ...(this.env.MILESTONE_LIVE_ENABLED === 'false' ? {} : {
        ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY ?? '', CLAUDE_MODEL: this.env.CLAUDE_MODEL ?? 'claude-haiku-4-5',
        CLAUDE_MANAGED_AGENT_ID: this.env.CLAUDE_MANAGED_AGENT_ID || this.env.MANAGED_AGENT_ID || '',
        CLAUDE_MANAGED_ENVIRONMENT_ID: this.env.CLAUDE_MANAGED_ENVIRONMENT_ID || this.env.MANAGED_ENVIRONMENT_ID || '',
        MANAGED_LIVE_ENABLED: this.env.MANAGED_LIVE_ENABLED ?? 'false',
      }) };
      const lifecycle = new URL('./mini-project-lifecycle.mjs', import.meta.url).href;
      const api = spawn(process.execPath, ['--import', lifecycle, 'server.mjs'], { cwd, env: backendEnv, windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
      const web = spawn(process.execPath, ['--import', lifecycle, join(cwd, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(frontend), '--strictPort'],
        { cwd, env: runtime, windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
      const item: Running = { children: [api, web], mode, ready: false, port: frontend, backend,
        notice: frontend === project.frontend ? null : `The usual port was busy. Using port ${frontend}; the existing process was left running.` };
      this.active.set(id, item);
      for (const child of item.children) {
        child.once('error', () => { void this.stop(id); });
        child.once('close', () => { if (this.active.get(id) === item) void this.stop(id); });
      }
      try {
        await Promise.all([ready(`http://127.0.0.1:${backend}/api/health`, api, async response => (await response.json()).project === project.id),
          ready(`http://127.0.0.1:${frontend}/`, web, async response => (await response.text()).includes('root'))]);
        if (this.active.get(id) !== item) throw Error('Project stopped during startup.');
        item.ready = true; return this.list().find(row => row.id === id)!;
      } catch (error) { await this.stop(id); throw error; }
    } finally { this.starting.delete(id); }
  }
  async stop(id: string) {
    const item = this.active.get(id); if (!item) return;
    this.active.delete(id);
    await Promise.all(item.children.map(child => new Promise<void>(resolve => {
      if (child.exitCode !== null || child.signalCode !== null) { resolve(); return; }
      const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 15000);
      child.once('close', () => { clearTimeout(timer); resolve(); });
      if (child.connected) child.disconnect(); else child.kill();
    })));
  }
  async close() { await Promise.all([...this.active.keys()].map(id => this.stop(id))); }
}
