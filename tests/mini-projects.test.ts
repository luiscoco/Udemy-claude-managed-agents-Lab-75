import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createServer } from 'node:net';
import { miniProjects } from '../shared/mini-projects.js';
import projectFiles from '../shared/mini-project-files.json';
import { MiniProjectManager } from '../server/lib/mini-project-manager.js';
import { createMiniProjectsRouter, miniProjectArchive } from '../server/routes/mini-projects.js';

test('live setup identifies missing settings without exposing credentials and supports legacy IDs', () => {
  const missing = new MiniProjectManager({}).list();
  assert.ok(missing.every(project => !project.liveAvailable && project.liveSetupRequired.includes('CLAUDE_MANAGED_AGENT_ID')));
  const env = { ANTHROPIC_API_KEY: 'fixture-never-sent', CLAUDE_MANAGED_AGENT_ID: '', MANAGED_AGENT_ID: 'agent_fixture',
    CLAUDE_MANAGED_ENVIRONMENT_ID: '', MANAGED_ENVIRONMENT_ID: 'env_fixture', MANAGED_LIVE_ENABLED: 'true' };
  const available = new MiniProjectManager(env).list();
  assert.ok(available.every(project => project.liveAvailable && project.liveSetupRequired.length === 0));
  assert.ok(!JSON.stringify(available).includes(env.ANTHROPIC_API_KEY));
  assert.ok(new MiniProjectManager({ ...env, MILESTONE_LIVE_ENABLED: 'false' }).list().every(project => !project.liveAvailable));
});

test('the three starters contain only reviewed source, lockfiles, and all 22 stage prompts', async () => {
  for (const project of miniProjects) {
    const bytes = await miniProjectArchive(project.id); let offset = 0; const members = new Map<string, Buffer>();
    while (bytes.readUInt32LE(offset) === 0x04034b50) {
      const size = bytes.readUInt32LE(offset + 18), length = bytes.readUInt16LE(offset + 26), extra = bytes.readUInt16LE(offset + 28);
      const name = bytes.subarray(offset + 30, offset + 30 + length).toString(); const start = offset + 30 + length + extra;
      members.set(name, bytes.subarray(start, start + size)); offset = start + size;
    }
    assert.deepEqual([...members.keys()].sort(), projectFiles.filter(name => name.startsWith(project.id + '/')).sort());
    assert.ok(members.has(`${project.id}/package-lock.json`)); assert.ok(members.has(`${project.id}/local-requests.mjs`));
    assert.equal([...members.keys()].filter(name => /\/prompts\/m\d+/.test(name)).length, project.id === 'agent-publishing-studio' ? 8 : 7);
    assert.ok([...members.keys()].every(name => !/(node_modules|dist|artifacts)\//.test(name) && !/\/\.env$/.test(name)));
    const dependencies = JSON.parse(members.get(`${project.id}/package.json`)!.toString()).dependencies;
    assert.equal(dependencies['@anthropic-ai/sdk'], '1.7.0'); assert.equal('@anthropic-ai/claude-agent-sdk' in dependencies, false);
  }
  await assert.rejects(miniProjectArchive('../.env'), /Unknown/);
});

test('project routes reject unknown projects, foreign origins, and arbitrary launch options', async () => {
  const manager = new MiniProjectManager({ MILESTONE_LIVE_ENABLED: 'false' }), app = express();
  app.use('/projects', createMiniProjectsRouter(manager)); const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/projects`;
  try {
    assert.equal((await (await fetch(base)).json()).projects.length, 3);
    assert.equal((await fetch(base, { headers: { Origin: 'https://example.com' } })).status, 403);
    assert.equal((await fetch(base + '/missing/stages')).status, 404);
    assert.equal((await fetch(base + '/study-coach/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'learner', command: 'anything' }) })).status, 400);
    for (const project of miniProjects) {
      const body = await (await fetch(`${base}/${project.id}/stages`)).json();
      assert.equal(body.stages.filter((stage: { id: string }) => /^m\d+/.test(stage.id)).length, project.id === 'agent-publishing-studio' ? 8 : 7);
    }
  } finally { await manager.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('all three projects launch prepared workflows, preserve occupied ports, and stop owned processes', {
  skip: new MiniProjectManager({}).list().every(project => project.dependenciesReady) ? false : 'Run npm run projects:install to enable standalone process checks.',
}, async () => {
  const manager = new MiniProjectManager({ ...process.env, MILESTONE_LIVE_ENABLED: 'false' });
  const blocker = createServer(); blocker.listen(5191, '127.0.0.1');
  await new Promise<void>((resolve, reject) => { blocker.once('listening', resolve); blocker.once('error', reject); });
  try {
    for (const project of miniProjects) {
      const running = await manager.start(project.id, 'learner'); assert.equal(running.status, 'running'); assert.ok(running.url);
      const base = running.url.replace(/\/$/, '');
      const health = await (await fetch(base + '/api/health')).json(); assert.equal(health.project, project.id); assert.equal(health.liveAvailable, false);
      const post = (path: string, body: unknown) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal((await fetch(base + '/api/health', { headers: { Origin: 'https://example.com' } })).status, 403);
      if (project.id === 'study-coach') {
        assert.notEqual(running.frontend, 5191); assert.ok(running.notice); assert.ok(blocker.listening);
        const session = await (await post('/api/conversations', { mode: 'prepared' })).json();
        const turn = await (await post(`/api/conversations/${session.id}/turns`, { question: 'Explain how the SDK handles results' })).json();
        assert.equal(turn.modelCalls, 0); assert.ok(turn.answer);
      } else if (project.id === 'agent-evaluation-studio') {
        const catalog = await (await fetch(base + '/api/cases')).json(); assert.equal(catalog.cases.length, 170);
        const run = await (await post('/api/runs', { caseId: catalog.cases[0].id, variant: 'guided', runMode: 'prepared' })).json();
        assert.equal(run.modelCalls, 0); assert.equal(run.subtype, 'prepared_success');
      } else {
        const answer = await (await post('/api/answers', { prompt: 'Explain SDK tools', runMode: 'prepared', model: health.models[0].id })).json();
        assert.equal(answer.modelCalls, 0); assert.ok(answer.answer);
      }
      await assert.rejects(manager.start(project.id, 'reference'), /Stop/);
      await manager.stop(project.id); assert.equal(manager.list().find(item => item.id === project.id)!.status, 'stopped');
      await assert.rejects(fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) }));
    }
    const reference = await manager.start('study-coach', 'reference'); assert.equal(reference.mode, 'reference');
  } finally { await manager.close(); await new Promise<void>(resolve => blocker.close(() => resolve())); }
});
