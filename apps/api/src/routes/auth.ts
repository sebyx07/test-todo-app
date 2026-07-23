// Auth routes — thin: parse body → call service → set/clear cookie or return JSON.
// Zero branching logic here. Cookies are HttpOnly + SameSite=Lax always; the Secure
// flag comes from env.COOKIE_SECURE (false on localhost http).
import type { Database } from 'bun:sqlite';
import type { CreateUserInput } from '@todo/domain';
import type { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { env } from '../env';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { create as createSession } from '../services/sessions/create';
import { destroy as destroySession } from '../services/sessions/destroy';
import { login } from '../services/users/login';
import { register } from '../services/users/register';

/** Shared cookie options for the session cookie. */
function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: env.SESSION_TTL_SECONDS,
  };
}

/** Register the auth routes (register/login/logout/me) on `app`, backed by `db`. */
export function registerAuthRoutes(app: Hono<AppEnv>, db: Database): void {
  app.post('/auth/register', async (c) => {
    const body = (await c.req.json()) as CreateUserInput;
    const user = await register(db, body);
    const session = createSession(db, user.id);
    setCookie(c, env.SESSION_COOKIE_NAME, session.token, sessionCookieOptions());
    return c.json(user, 201);
  });

  app.post('/auth/login', async (c) => {
    const body = (await c.req.json()) as CreateUserInput;
    const user = await login(db, body);
    const session = createSession(db, user.id);
    setCookie(c, env.SESSION_COOKIE_NAME, session.token, sessionCookieOptions());
    return c.json(user, 200);
  });

  app.post('/auth/logout', (c) => {
    const token = getCookie(c, env.SESSION_COOKIE_NAME);
    if (token) {
      destroySession(db, token);
    }
    deleteCookie(c, env.SESSION_COOKIE_NAME, sessionCookieOptions());
    return c.body(null, 204);
  });

  app.get('/auth/me', (c) => {
    const user = requireAuth(c);
    return c.json(user, 200);
  });
}
