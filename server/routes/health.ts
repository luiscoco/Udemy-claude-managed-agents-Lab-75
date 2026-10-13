import { Router } from 'express';
import { healthSchema } from '../../shared/health.js';
import packageJson from '../../package.json' with { type: 'json' };

export function createHealthRouter() {
  const router = Router();
  router.get('/health', (_request, response) => {
    response.set('Cache-Control', 'no-store').json(healthSchema.parse({
      version: packageJson.version,
      readiness: 'ready',
      features: { scriptedLessons: false, liveAgentExecution: false },
    }));
  });
  return router;
}
