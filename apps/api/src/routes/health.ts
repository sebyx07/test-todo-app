// Liveness probe. Routes stay thin: parse → service → render.
import type { Hono } from 'hono';
import type { AppEnv } from '../middleware/auth';

export function registerHealthRoutes(app: Hono<AppEnv>): void {
  app.get('/healthz', (c) => c.json({ ok: true }));
}
