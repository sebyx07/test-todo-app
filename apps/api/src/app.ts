// App factory — wiring only. No business logic here; register routes and middleware.
import { Hono } from 'hono';
import { errorHandler } from './middleware/error';
import { registerHealthRoutes } from './routes/health';

export function createApp(): Hono {
  const app = new Hono();

  app.onError(errorHandler);
  registerHealthRoutes(app);

  return app;
}
