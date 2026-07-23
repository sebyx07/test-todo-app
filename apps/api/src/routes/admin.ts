// Admin routes — thin: guard → call service → render. Every route requires an admin
// (requireAdmin throws UnauthorizedError when unauthenticated, ForbiddenError when not an
// admin); the guard runs before any service work so a non-admin never reaches business logic.
import type { Database } from 'bun:sqlite';
import type { Hono } from 'hono';
import { type AppEnv, requireAdmin } from '../middleware/auth';
import { list as listStats } from '../services/stats/list';
import { list as listUsers } from '../services/users/list';
import { remove } from '../services/users/remove';
import { type UpdateRoleInput, updateRole } from '../services/users/update-role';

/** Register the admin user-management + stats routes on `app`, backed by `db`. */
export function registerAdminRoutes(app: Hono<AppEnv>, db: Database): void {
  app.get('/admin/users', (c) => {
    requireAdmin(c);
    return c.json(listUsers(db), 200);
  });

  app.patch('/admin/users/:id', async (c) => {
    const admin = requireAdmin(c);
    const id = c.req.param('id');
    const body = (await c.req.json()) as UpdateRoleInput;
    const user = updateRole(db, admin.id, id, body);
    return c.json(user, 200);
  });

  app.delete('/admin/users/:id', (c) => {
    const admin = requireAdmin(c);
    const id = c.req.param('id');
    remove(db, admin.id, id);
    return c.body(null, 204);
  });

  app.get('/admin/stats', (c) => {
    requireAdmin(c);
    return c.json(listStats(db), 200);
  });
}
