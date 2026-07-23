// App factory — wiring only. No business logic here; register routes and middleware.
import type { Database } from 'bun:sqlite';
import { createDb, migrate } from '@todo/db';
import { Hono } from 'hono';
import { env } from './env';
import { errorHandler } from './middleware/error';
import { registerHealthRoutes } from './routes/health';
import { registerTodoRoutes } from './routes/todos';

/**
 * Build the Hono app. The db is built from `env.DB_PATH` and migrated once (idempotent)
 * unless a caller injects one (tests). `:memory:` is the default, so ephemeral runs and
 * the test suite never touch disk unless they opt in.
 */
export function createApp(db: Database = createDb(env.DB_PATH)): Hono {
  migrate(db);

  const app = new Hono();

  app.onError(errorHandler);
  registerHealthRoutes(app);
  registerTodoRoutes(app, db);

  return app;
}
