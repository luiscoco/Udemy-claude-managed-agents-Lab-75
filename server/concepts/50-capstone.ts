import { Router, json } from 'express';
import { lab50ChatSchema, lab50CloseSchema, lab50CustomerSchema, lab50DecisionSchema } from '../../shared/lab50-capstone.js';
import { CapstoneDesk } from '../capstone/desk.js';
import { runCapstoneEvals } from '../capstone/evals.js';
import { CapstoneError } from '../capstone/store.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab50Router(desk = new CapstoneDesk()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const ownerOf = (request: import('express').Request) => request.headers['x-lab-owner'] as string;
  const reply = async (response: import('express').Response, action: () => Promise<unknown> | unknown) => {
    try { response.json(await action()); } catch (error) { response.status(error instanceof CapstoneError ? error.statusCode : 500)
      .json(apiError('INVALID_REQUEST', error instanceof CapstoneError ? error.message : 'Support desk operation failed.')); } };
  router.get('/facts', (_request, response) => response.json(desk.facts()));
  router.get('/code', (_request, response) => response.json({ files: [
    'shared/lab50-capstone.ts', 'server/capstone/store.ts', 'server/capstone/tools.ts', 'server/capstone/agent.ts',
    'server/capstone/desk.ts', 'server/capstone/evals.ts', 'server/concepts/50-capstone.ts'],
    note: 'Policy files are read-only host resources; live agent provisioning is separate.' }));
  router.get('/state', (request, response) => { const customer = lab50CustomerSchema.safeParse(request.query.customerId);
    if (!customer.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Select a customer.')); return; }
    response.json(desk.state(ownerOf(request), customer.data)); });
  router.get('/conversation/:id', (request, response) => { const customer = lab50CustomerSchema.safeParse(request.query.customerId);
    if (!customer.success || typeof request.params.id !== 'string') { response.status(400).json(apiError('INVALID_REQUEST', 'Select a conversation and customer.')); return; }
    void reply(response, () => desk.conversation(ownerOf(request), customer.data, request.params.id as string)); });
  router.post('/reset', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Reset takes no fields.')); return; }
    void reply(response, () => desk.reset(ownerOf(request))); });
  router.post('/chat', (request, response) => { const parsed = lab50ChatSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid chat request.')); return; }
    void reply(response, () => desk.chat(ownerOf(request), parsed.data.customerId, parsed.data.mode,
      parsed.data.conversationId, parsed.data.message, request.signal)); });
  router.post('/approve', (request, response) => { const parsed = lab50DecisionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid approval decision.')); return; }
    void reply(response, () => desk.decide(ownerOf(request), parsed.data.customerId, parsed.data.conversationId,
      parsed.data.approvalId, parsed.data.decision, request.signal)); });
  router.post('/close', (request, response) => { const parsed = lab50CloseSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid close request.')); return; }
    void reply(response, () => desk.closeConversation(ownerOf(request), parsed.data.customerId, parsed.data.conversationId)); });
  router.post('/evals', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Evals take no fields.')); return; }
    response.json(runCapstoneEvals()); });
  router.use(apiErrorHandler); return { router, close: () => desk.close() };
}
