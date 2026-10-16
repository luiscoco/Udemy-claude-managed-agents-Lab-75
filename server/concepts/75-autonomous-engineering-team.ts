import { Router, json, type Request } from 'express';
import { z } from 'zod';
import { teamRunSchema } from '../../shared/lab75-autonomous-engineering-team.js';
import { TeamWorkshop } from '../team/orchestrator.js';
import { issue } from '../team/fixture.js';
import { validatePlan, planPreset, reportSchemas, goodPlan } from '../team/team.js';
import { decide, Board } from '../team/policy.js';
import { liveTeam, liveTeamReadiness, liveInventory } from '../team/live.js';
import { apiError } from '../lib/errors.js';
export function createLab75Router(store = new TeamWorkshop(), env = process.env) {
  const router = Router(); router.use(json({ strict: true, limit: '32kb' }));
  router.use((request, response, next) => { const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` || typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) { response.status(403).json(apiError('INVALID_REQUEST', 'Local team owner required.')); return; }
    response.set('Cache-Control', 'no-store'); next(); });
  const owner = (request: Request) => request.headers['x-lab-owner'] as string;
  router.get('/facts', (_request, response) => response.json({ issue, source: 'host-orchestrator', live: liveTeamReadiness(env), plan: goodPlan,
    reports: reportSchemas, roleTools: { planner: liveInventory('planner'), developer: liveInventory('developer'), reviewer: liveInventory('reviewer') },
    limits: { parallel: 3, calls: 12, retainedRuns: 8, expiryHours: 24, deadlineMinutes: 15, liveSessionCents: 30, liveTotalCents: 300 }, holdouts: 'Host-only acceptance probes; labels and outcomes appear after execution.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab75-autonomous-engineering-team.ts', 'server/team/team.ts', 'server/team/policy.ts', 'server/team/orchestrator.ts', 'server/team/scripted.ts', 'server/team/live.ts', 'server/team/journal.ts', 'server/concepts/75-autonomous-engineering-team.ts'] }));
  router.post('/plan/validate', (request, response, next) => { try { const input = z.union([z.strictObject({ plan: z.unknown() }), z.strictObject({ preset: z.enum(['good', 'sequential', 'protected-deletion', 'duplicate-owner', 'cycle', 'existing-test', 'malformed']) })]).parse(request.body);
    response.json(validatePlan('plan' in input ? input.plan : planPreset(input.preset))); } catch (error) { next(error); } });
  router.post('/policy', (request, response, next) => { try { const input = z.strictObject({ role: z.enum(['planner', 'reviewer', 'developer']), tool: z.string().max(50), path: z.string().max(120), taskId: z.enum(['T1', 'T2', 'T3']) }).parse(request.body);
    response.json({ ...decide(input.role, input.tool, { path: input.path }, goodPlan.tasks.find(task => task.id === input.taskId)), localIdentitySimulation: true, executed: false }); } catch (error) { next(error); } });
  router.post('/messages/probe', (request, response, next) => { try { const input = z.strictObject({ sender: z.enum(['T1', 'T2', 'T3']), to: z.string().max(20), text: z.string().min(1).max(600) }).parse(request.body); const board = new Board(['T1', 'T2', 'T3']);
    response.json({ envelope: board.send(input.sender, { id: 'probe', to: input.to, text: input.text }), localIdentitySimulation: true, persisted: false }); } catch (error) { next(error); } });
  router.post('/runs', async (request, response, next) => { try { const input = teamRunSchema.parse(request.body); const team = input.mode === 'live' ? liveTeam(env) : undefined;
    const created = await store.create(owner(request), input); void store.start(owner(request), created.id, team).catch(() => {}); response.status(202).json(created); } catch (error) { next(error); } });
  router.get('/runs/:id', (request, response, next) => { try { response.json(store.get(owner(request), request.params.id as string)); } catch (error) { next(error); } });
  router.get('/runs/:id/journal', async (request, response, next) => { try { response.json({ entries: await store.journal(owner(request), request.params.id as string) }); } catch (error) { next(error); } });
  router.get('/runs/:id/journal/download', async (request, response, next) => { try { const entries = await store.journal(owner(request), request.params.id as string); response.set({ 'Content-Type': 'application/x-ndjson', 'Content-Disposition': 'attachment; filename="team-journal.jsonl"', 'X-Content-Type-Options': 'nosniff' }).send(entries.map(entry => JSON.stringify(entry)).join('\n') + '\n'); } catch (error) { next(error); } });
  router.post('/runs/:id/resume', async (request, response, next) => { try { const input = z.strictObject({ mode: z.enum(['scripted', 'live']) }).parse(request.body); const team = input.mode === 'live' ? liveTeam(env) : undefined;
    response.json(await store.resume(owner(request), request.params.id as string, team)); } catch (error) { next(error); } });
  router.post('/runs/:id/cancel', (request, response, next) => { try { z.strictObject({}).parse(request.body); response.json(store.cancel(owner(request), request.params.id as string)); } catch (error) { next(error); } });
  router.use((error: unknown, _request: Request, response: import('express').Response, _next: import('express').NextFunction) => { const missing = error instanceof Error && /not found|ownership/.test(error.message); response.status(missing ? 404 : 400).json(apiError('INVALID_REQUEST', missing ? 'Team resource not found.' : 'Team request rejected; check setup, ownership, plan and journal consistency.')); });
  return { router, close: async () => store.close() };
}
