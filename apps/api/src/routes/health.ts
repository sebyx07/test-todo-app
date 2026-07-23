// Liveness probe. Routes stay thin: parse → service → render.
import type { Hono } from 'hono';

export function registerHealthRoutes(app: Hono): void {
  app.get('/healthz', (c) => c.json({ ok: true }));
}
