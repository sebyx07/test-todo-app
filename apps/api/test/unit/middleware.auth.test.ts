import { describe, expect, it } from 'bun:test';
import { createDb, migrate } from '@todo/db';
import type { User } from '@todo/domain';
import { createApp } from '../../src/app';
import { requireAdmin, requireAuth } from '../../src/middleware/auth';
import { create as createSession } from '../../src/services/sessions/create';
import { insertUser } from '../../src/services/users/repository';

/** Boot a real (in-memory) app so the global auth middleware runs on each request. */
function freshApp() {
  const db = createDb(':memory:');
  migrate(db);
  return { app: createApp(db), db };
}

/** Insert a user with the given role and mint a valid session token. */
function seed(db: ReturnType<typeof freshApp>['db'], role: 'user' | 'admin') {
  const user = insertUser(db, { email: `${role}@example.com`, passwordHash: 'h' });
  // Force the role directly (insertUser always writes 'user') so we can test admin.
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
  const token = createSession(db, user.id).token;
  return { userId: user.id, token };
}

describe('auth middleware (integration over a real app)', () => {
  it('sets user to null when there is no cookie', async () => {
    const { app } = freshApp();
    app.get('/__probe', (c) => c.json({ user: c.get('user') }));

    const res = await app.request('/__probe', { method: 'GET' });

    expect(res.status).toBe(200);
    expect(((await res.json()) as { user: User | null }).user).toBeNull();
  });

  it('loads the user when a valid session cookie is present', async () => {
    const { app, db } = freshApp();
    const { userId, token } = seed(db, 'user');
    app.get('/__probe', (c) => c.json({ user: c.get('user') }));

    const res = await app.request('/__probe', {
      method: 'GET',
      headers: { Cookie: `session=${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: User | null };
    expect(body.user?.id).toBe(userId);
  });

  it('sets user to null for an unknown session cookie', async () => {
    const { app } = freshApp();
    app.get('/__probe', (c) => c.json({ user: c.get('user') }));

    const res = await app.request('/__probe', {
      method: 'GET',
      headers: { Cookie: 'session=does-not-exist' },
    });

    expect(res.status).toBe(200);
    expect(((await res.json()) as { user: User | null }).user).toBeNull();
  });
});

describe('requireAuth / requireAdmin', () => {
  it('requireAuth throws UnauthorizedError when user is null', async () => {
    const { app } = freshApp();
    app.get('/__probe', (c) => {
      requireAuth(c);
      return c.json({ ok: true });
    });

    const res = await app.request('/__probe', { method: 'GET' });

    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('unauthorized');
  });

  it('requireAuth returns the user when authenticated', async () => {
    const { app, db } = freshApp();
    const { userId, token } = seed(db, 'user');
    app.get('/__probe', (c) => c.json({ user: requireAuth(c) }));

    const res = await app.request('/__probe', {
      method: 'GET',
      headers: { Cookie: `session=${token}` },
    });

    expect(res.status).toBe(200);
    expect(((await res.json()) as { user: User }).user.id).toBe(userId);
  });

  it('requireAdmin throws ForbiddenError for a non-admin user', async () => {
    const { app, db } = freshApp();
    const { token } = seed(db, 'user');
    app.get('/__probe', (c) => {
      requireAdmin(c);
      return c.json({ ok: true });
    });

    const res = await app.request('/__probe', {
      method: 'GET',
      headers: { Cookie: `session=${token}` },
    });

    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden');
  });

  it('requireAdmin returns the admin user when authenticated as admin', async () => {
    const { app, db } = freshApp();
    const { userId, token } = seed(db, 'admin');
    app.get('/__probe', (c) => c.json({ user: requireAdmin(c) }));

    const res = await app.request('/__probe', {
      method: 'GET',
      headers: { Cookie: `session=${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: User };
    expect(body.user.id).toBe(userId);
    expect(body.user.role).toBe('admin');
  });
});
