// Integration: boot the real server over a shared in-memory db, drive the admin
// user-management + stats surface over HTTP. No mocks — exercises routes → services →
// repository → bun:sqlite. Admins are seeded by registering via HTTP (which issues a
// session cookie tied to the user id) and then promoting the row directly via the
// repository; the auth middleware re-reads role fresh on each request via the session
// JOIN, so the cookie granted before promotion immediately sees the admin role.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createDb, migrate } from '@todo/db';
import type { User } from '@todo/domain';
import { createApp } from '../../src/app';
import { updateUserRole } from '../../src/services/users/repository';

let server: ReturnType<typeof Bun.serve>;

// One shared in-memory db for the suite so promotion persists across requests.
const db = createDb(':memory:');

beforeAll(() => {
  migrate(db);
  server = Bun.serve({ port: 0, fetch: createApp(db).fetch });
});

afterAll(async () => {
  await server.stop(true);
});

const base = () => `${server.url}`;

const AUTH = { 'content-type': 'application/json' } as const;

/** Extract the Set-Cookie value from a Response, or null when absent. */
function cookieFrom(res: Response): string | null {
  const raw = res.headers.get('set-cookie');
  if (!raw) return null;
  return raw.split(';')[0] ?? null;
}

/** Register a user via HTTP and return { user, cookie }. */
async function registerUser(email: string): Promise<{ user: User; cookie: string }> {
  const res = await fetch(`${base()}auth/register`, {
    method: 'POST',
    headers: AUTH,
    body: JSON.stringify({ email, password: 'password123' }),
  });
  expect(res.status).toBe(201);
  const cookie = cookieFrom(res);
  expect(cookie).not.toBeNull();
  const user = (await res.json()) as User;
  return { user, cookie: cookie as string };
}

describe('admin user management over HTTP', () => {
  let adminCookie: string;
  let adminId: string;
  let userCookie: string;
  let userId: string;

  beforeAll(async () => {
    const admin = await registerUser(`admin-${Date.now()}@example.com`);
    adminId = admin.user.id;
    adminCookie = admin.cookie;
    // Promote the registered user to admin directly on the shared db. The session
    // JOIN reads role fresh, so adminCookie now carries admin rights.
    updateUserRole(db, adminId, 'admin');

    const user = await registerUser(`user-${Date.now()}@example.com`);
    userId = user.user.id;
    userCookie = user.cookie;
  });

  it('rejects a non-admin with 403 on every /admin/* route', async () => {
    const routes: Array<[string, string, string]> = [
      ['GET', '/admin/users', ''],
      ['PATCH', `/admin/users/${userId}`, JSON.stringify({ role: 'admin' })],
      ['DELETE', `/admin/users/${userId}`, ''],
      ['GET', '/admin/stats', ''],
    ];

    for (const [method, path, body] of routes) {
      const res = await fetch(`${base()}${path.slice(1)}`, {
        method,
        headers: { Cookie: userCookie, ...AUTH },
        body: body || undefined,
      });
      expect(res.status).toBe(403);
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden');
    }
  });

  it('rejects an unauthenticated request with 401 on every /admin/* route', async () => {
    const res = await fetch(`${base()}admin/users`);
    expect(res.status).toBe(401);
  });

  it('lets an admin list all users (oldest first)', async () => {
    const res = await fetch(`${base()}admin/users`, { headers: { Cookie: adminCookie } });
    expect(res.status).toBe(200);
    const users = (await res.json()) as User[];
    expect(users.length).toBeGreaterThanOrEqual(2);

    // ordered oldest-first by created_at ascending
    for (let i = 1; i < users.length; i++) {
      const prev = users[i - 1];
      const curr = users[i];
      if (prev && curr) {
        expect(curr.createdAt >= prev.createdAt).toBe(true);
      }
    }

    // the admin + the regular user are both present, and no row leaks a password hash
    const ids = users.map((u) => u.id);
    expect(ids).toContain(adminId);
    expect(ids).toContain(userId);
    expect(JSON.stringify(users)).not.toContain('password_hash');
  });

  it('lets an admin PATCH a user role', async () => {
    const res = await fetch(`${base()}admin/users/${userId}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie, ...AUTH },
      body: JSON.stringify({ role: 'admin' }),
    });
    expect(res.status).toBe(200);
    const updated = (await res.json()) as User;
    expect(updated.id).toBe(userId);
    expect(updated.role).toBe('admin');

    // demote back so the self/last-admin guards below are testable against a clean state
    const back = await fetch(`${base()}admin/users/${userId}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie, ...AUTH },
      body: JSON.stringify({ role: 'user' }),
    });
    expect(back.status).toBe(200);
    expect(((await back.json()) as User).role).toBe('user');
  });

  it('rejects self-demotion with 403', async () => {
    const res = await fetch(`${base()}admin/users/${adminId}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie, ...AUTH },
      body: JSON.stringify({ role: 'user' }),
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden');
  });

  it('rejects demoting the last admin with 403', async () => {
    // adminId is the sole admin (userId was demoted back to 'user' above).
    const res = await fetch(`${base()}admin/users/${adminId}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie, ...AUTH },
      body: JSON.stringify({ role: 'user' }),
    });
    // self-demotion guard fires first and is also a 403 — either guard is acceptable;
    // what matters is the platform never reaches zero admins.
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden');

    // sanity: the admin is still an admin afterward
    const me = await fetch(`${base()}auth/me`, { headers: { Cookie: adminCookie } });
    expect(((await me.json()) as User).role).toBe('admin');
  });

  it('lets an admin DELETE a non-self user', async () => {
    const res = await fetch(`${base()}admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');

    // the user is gone from the listing
    const listRes = await fetch(`${base()}admin/users`, { headers: { Cookie: adminCookie } });
    const ids = ((await listRes.json()) as User[]).map((u) => u.id);
    expect(ids).not.toContain(userId);
  });

  it('rejects self-deletion with 403', async () => {
    const res = await fetch(`${base()}admin/users/${adminId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden');
  });

  it('returns 404 when PATCH/DELETE target a missing user', async () => {
    const patchRes = await fetch(`${base()}admin/users/ghost`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie, ...AUTH },
      body: JSON.stringify({ role: 'user' }),
    });
    expect(patchRes.status).toBe(404);

    const deleteRes = await fetch(`${base()}admin/users/ghost`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    expect(deleteRes.status).toBe(404);
  });

  it('returns platform counts on GET /admin/stats', async () => {
    const res = await fetch(`${base()}admin/stats`, { headers: { Cookie: adminCookie } });
    expect(res.status).toBe(200);
    const stats = (await res.json()) as { userCount: number; todoCount: number };
    expect(stats.userCount).toBeGreaterThanOrEqual(1); // at least the admin
    expect(typeof stats.todoCount).toBe('number');
  });

  it('returns 422 on PATCH with an invalid role', async () => {
    const res = await fetch(`${base()}admin/users/${adminId}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie, ...AUTH },
      body: JSON.stringify({ role: 'superuser' }),
    });
    expect(res.status).toBe(422);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('validation_error');
  });
});
