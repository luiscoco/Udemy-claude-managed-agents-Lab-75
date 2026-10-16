import { Router, json, type Request } from 'express';
import { z } from 'zod';
import { defenseSchema, simulationSchema, attackIdSchema } from '../../shared/lab74-prompt-injection-redteam.js';
import { attacks, runTrial, runMatrix, detect, adaptive, pinnedMetadataHash, deskToolDefinitions } from '../lib/lab74-redteam.js';
import { apiError } from '../lib/errors.js';
export function createLab74Router() {
  const router = Router(); router.use(json({ strict: true, limit: '24kb' }));
  router.use((request, response, next) => { const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` || typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) { response.status(403).json(apiError('INVALID_REQUEST', 'Local red-team owner required.')); return; }
    response.set('Cache-Control', 'no-store'); next(); });
  router.get('/facts', (_request, response) => response.json({ attacks, defenses: defenseSchema.options, pinnedMetadataHash, toolDefinitions: deskToolDefinitions,
    source: 'offline-worst-case-scripted-model', liveReady: false, providerCalls: 0, rules: 'Five cumulative layers plus no-defense baseline. All outgoing effects are fictional; no network, refunds or mail.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab74-prompt-injection-redteam.ts', 'server/redteam/corpus.ts', 'server/lib/lab74-redteam.ts', 'server/concepts/74-prompt-injection-redteam.ts'] }));
  router.post('/simulate', (request, response, next) => { try { const input = simulationSchema.parse(request.body), attack = attacks.find(item => item.id === input.attackId)!;
    response.json({ results: Array.from({ length: input.trials }, () => runTrial(attack, input.defense)) }); } catch (error) { next(error); } });
  router.get('/matrix', (_request, response) => response.json(runMatrix()));
  router.get('/bench', (_request, response) => { const result = runMatrix(); response.json({ safetyFloor: result.safetyFloor, cleanUtility: result.cleanUtility, passed: result.safetyFloor && result.cleanUtility, source: result.source, providerCalls: 0 }); });
  router.post('/detect', (request, response, next) => { try { const input = z.strictObject({ payload: z.string().max(12000) }).parse(request.body); response.json(detect(input.payload)); } catch (error) { next(error); } });
  router.post('/policy', (request, response, next) => { try { const input = z.strictObject({ defense: defenseSchema, attackId: attackIdSchema }).parse(request.body); const result = runTrial(attacks.find(item => item.id === input.attackId)!, input.defense); response.json({ effects: result.effects, oracle: result.oracle, source: result.source }); } catch (error) { next(error); } });
  router.post('/live', (request, response) => { const input = z.strictObject({ trials: z.number().int().min(1).max(5) }).safeParse(request.body);
    response.status(input.success ? 422 : 400).json(apiError(input.success ? 'UNSUPPORTED_MODE' : 'INVALID_REQUEST', 'Live red-team adapter is not configured. No provider call started. Use explicit offline observations.')); });
  router.post('/adaptive', (request, response, next) => { try { const input = z.strictObject({ attackId: attackIdSchema, defense: defenseSchema, iterations: z.number().int().min(1).max(8), budgetCents: z.number().int().min(1).max(20) }).parse(request.body);
    response.json(adaptive(attacks.find(item => item.id === input.attackId)!, input.defense, input.iterations, input.budgetCents)); } catch (error) { next(error); } });
  router.get('/report', (_request, response) => { const matrix = runMatrix(); response.set({ 'Content-Disposition': 'attachment; filename="fictional-redteam-report.json"', 'X-Content-Type-Options': 'nosniff' }).json({ ...matrix, note: 'Sanitized aggregate; no raw canaries or user material. Offline observations do not establish model immunity.' }); });
  router.use((_error: unknown, _request: Request, response: import('express').Response, _next: import('express').NextFunction) => response.status(400).json(apiError('INVALID_REQUEST', 'Closed red-team request rejected.')));
  return { router, close: async () => {} };
}
