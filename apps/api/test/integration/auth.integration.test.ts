// Integration: boot the real server over a real SQLite db, drive the full auth
// lifecycle over HTTP. No mocks — exercises routes → services → repository → bun:sqlite.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createDb, migrate } from '@todo/db';
import type { User } from '@todo/domain';
import { createApp } from '../../src/app';

let server: ReturnType<typeof Bun.serve>;

// One shared in-memory db for the suite so the session created at register/login is
// readable by /auth/me on the next request.
const db = createDb(':memory:');

beforeAll(() => {
  migrate(db);
  server = Bun.serve({ port: 0, fetch: createApp(db).fetch });
});

afterAll(async () => {
  await server.stop(true);
});

const base = () => `${server.url}`;

/** Extract the Set-Cookie value from a Response, or null when absent. */
function cookieFrom(res: Response): string | null {
  const raw = res.headers.get('set-cookie');
  if (!raw) return null;
  // "name=value; Path=/; ..." → "name=value"
  return raw.split(';')[0] ?? null;
}

const AUTH = { 'content-type': 'application/json' } as const;

describe('auth over HTTP', () => {
  it('round-trips register → login → /auth/me → logout → 401', async () => {
    const email = `flow-${Date.now()}@example.com`;
    const password = 'password123';

    // register → 201 + user + Set-Cookie
    const regRes = await fetch(`${base()}auth/register`, {
      method: 'POST',
      headers: AUTH,
      body: JSON.stringify({ email, password }),
    });
    expect(regRes.status).toBe(201);
    const regCookie = cookieFrom(regRes);
    expect(regCookie).not.toBeNull();
    const regUser = (await regRes.json()) as User;
    expect(regUser.email).toBe(email);
    expect(regUser.role).toBe('user');

    // the cookie works for /auth/me immediately after register
    const meAfterReg = await fetch(`${base()}auth/me`, {
      headers: { Cookie: regCookie as string },
    });
    expect(meAfterReg.status).toBe(200);
    expect(((await meAfterReg.json()) as User).id).toBe(regUser.id);

    // logout clears the session
    const logoutRes = await fetch(`${base()}auth/logout`, {
      method: 'POST',
      headers: { Cookie: regCookie as string },
    });
    expect(logoutRes.status).toBe(204);
    expect(await logoutRes.text()).toBe('');

    // login → 200 + user + Set-Cookie
    const loginRes = await fetch(`${base()}auth/login`, {
      method: 'POST',
      headers: AUTH,
      body: JSON.stringify({ email, password }),
    });
    expect(loginRes.status).toBe(200);
    const loginCookie = cookieFrom(loginRes);
    expect(loginCookie).not.toBeNull();
    expect(((await loginRes.json()) as User).email).toBe(email);

    // /auth/me with the login cookie returns the user
    const meRes = await fetch(`${base()}auth/me`, {
      headers: { Cookie: loginCookie as string },
    });
    expect(meRes.status).toBe(200);
    expect(((await meRes.json()) as User).email).toBe(email);

    // logout invalidates the session
    await fetch(`${base()}auth/logout`, {
      method: 'POST',
      headers: { Cookie: loginCookie as string },
    });

    // /auth/me now 401 (session destroyed server-side)
    const meAfterLogout = await fetch(`${base()}auth/me`, {
      headers: { Cookie: loginCookie as string },
    });
    expect(meAfterLogout.status).toBe(401);
  });

  it('returns 401 for /auth/me with no cookie', async () => {
    const res = await fetch(`${base()}auth/me`);

    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('unauthorized');
  });

  it('returns 409 on duplicate email at register', async () => {
    const email = `dup-${Date.now()}@example.com`;
    const body = JSON.stringify({ email, password: 'password123' });

    const first = await fetch(`${base()}auth/register`, { method: 'POST', headers: AUTH, body });
    expect(first.status).toBe(201);

    const second = await fetch(`${base()}auth/register`, { method: 'POST', headers: AUTH, body });
    expect(second.status).toBe(409);
    expect(((await second.json()) as { error: { code: string } }).error.code).toBe('conflict');
  });

  it('returns 401 on login with the wrong password', async () => {
    const email = `wrongpw-${Date.now()}@example.com`;
    await fetch(`${base()}auth/register`, {
      method: 'POST',
      headers: AUTH,
      body: JSON.stringify({ email, password: 'password123' }),
    });

    const res = await fetch(`${base()}auth/login`, {
      method: 'POST',
      headers: AUTH,
      body: JSON.stringify({ email, password: 'totally-wrong' }),
    });

    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('unauthorized');
  });

  it('returns 401 on login for an unknown email', async () => {
    const res = await fetch(`${base()}auth/login`, {
      method: 'POST',
      headers: AUTH,
      body: JSON.stringify({ email: 'ghost@example.com', password: 'password123' }),
    });

    expect(res.status).toBe(401);
  });

  it('returns 422 on register with a malformed email', async () => {
    const res = await fetch(`${base()}auth/register`, {
      method: 'POST',
      headers: AUTH,
      body: JSON.stringify({ email: 'not-an-email', password: 'password123' }),
    });

    expect(res.status).toBe(422);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('validation_error');
  });

  it('returns 422 on register with a short password', async () => {
    const res = await fetch(`${base()}auth/register`, {
      method: 'POST',
      headers: AUTH,
      body: JSON.stringify({ email: `short-${Date.now()}@example.com`, password: 'short' }),
    });

    expect(res.status).toBe(422);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('validation_error');
  });
});
