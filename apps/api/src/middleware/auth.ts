// Global auth middleware + the requireAuth/requireAdmin guards.
//
// The middleware runs on every request: it reads the session cookie, loads a
// non-expired session + its user via the sessions repository, and sets the typed
// `user` context variable (User | null). It never blocks — guarding is the job of
// requireAuth/requireAdmin, which throw UnauthorizedError/ForbiddenError.
import type { Database } from 'bun:sqlite';
import type { User } from '@todo/domain';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { env } from '../env';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { findSessionByToken } from '../services/sessions/repository';

/** Hono env: the `user` variable set by the middleware, typed for c.get('user'). */
export type AppEnv = { Variables: { user: User | null } };

/** Build the global auth middleware backed by `db`. */
export function authMiddleware(db: Database): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const token = getCookie(c, env.SESSION_COOKIE_NAME);
    if (!token) {
      c.set('user', null);
      await next();
      return;
    }

    const found = findSessionByToken(db, token);
    c.set('user', found ? found.user : null);
    await next();
  };
}

/** Return the authenticated user or throw UnauthorizedError. */
export function requireAuth(c: Context<AppEnv>): User {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

/** Require an authenticated admin; chains requireAuth then checks the role. */
export function requireAdmin(c: Context<AppEnv>): User {
  const user = requireAuth(c);
  if (user.role !== 'admin') {
    throw new ForbiddenError();
  }
  return user;
}
