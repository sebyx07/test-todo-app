import { describe, expect, it } from 'bun:test';
import { createDb, migrate } from '@todo/db';
import { ZodError } from 'zod';
import { ConflictError } from '../../src/errors';
import { register } from '../../src/services/users/register';

/** Fresh migrated in-memory db per test — keeps each test hermetic. */
function freshDb() {
  const db = createDb(':memory:');
  migrate(db);
  return db;
}

describe('register', () => {
  it('creates a user with role user and the given email', async () => {
    const db = freshDb();

    const user = await register(db, { email: 'new@example.com', password: 'password123' });

    expect(user.email).toBe('new@example.com');
    expect(user.role).toBe('user');
    expect(user.id).toMatch(/.+/);
  });

  it('does not store the plaintext password', async () => {
    const db = freshDb();

    await register(db, { email: 'new@example.com', password: 'password123' });

    // The plaintext must not appear anywhere in the db's users table.
    const raw = db
      .prepare('SELECT password_hash FROM users WHERE email = ?')
      .get('new@example.com') as { password_hash: string };
    expect(raw.password_hash).not.toBe('password123');
    expect(raw.password_hash.length).toBeGreaterThan(0);
  });

  it('throws ConflictError on a duplicate email', async () => {
    const db = freshDb();
    await register(db, { email: 'dup@example.com', password: 'password123' });

    await expect(
      register(db, { email: 'dup@example.com', password: 'password123' }),
    ).rejects.toThrow(ConflictError);
  });

  it('rejects a malformed email (Zod, before persistence)', async () => {
    const db = freshDb();

    await expect(
      register(db, { email: 'not-an-email', password: 'password123' }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('rejects a short password (Zod, before persistence)', async () => {
    const db = freshDb();

    await expect(
      register(db, { email: 'a@example.com', password: 'short' }),
    ).rejects.toBeInstanceOf(ZodError);
  });
});
