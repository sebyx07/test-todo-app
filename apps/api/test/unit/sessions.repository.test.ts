import { describe, expect, it } from 'bun:test';
import { createDb, migrate } from '@todo/db';
import { sessionSchema } from '@todo/domain';
import { create as createSession } from '../../src/services/sessions/create';
import { destroy } from '../../src/services/sessions/destroy';
import {
  deleteSessionByToken,
  findSessionByToken,
  insertSession,
} from '../../src/services/sessions/repository';
import { insertUser } from '../../src/services/users/repository';

/** Fresh migrated in-memory db per test — keeps each test hermetic. */
function freshDb() {
  const db = createDb(':memory:');
  migrate(db);
  return db;
}

/** Insert a user so sessions have a valid FK target, return its id. */
function seedUser(db: ReturnType<typeof freshDb>): string {
  return insertUser(db, { email: 'u@example.com', passwordHash: 'h' }).id;
}

describe('sessions repository', () => {
  describe('insertSession', () => {
    it('inserts a session and returns a schema-valid Session', () => {
      const db = freshDb();
      const userId = seedUser(db);

      const session = insertSession(db, {
        token: 'tok-1',
        userId,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });

      const parsed = sessionSchema.parse(session);
      expect(parsed.token).toBe('tok-1');
      expect(parsed.userId).toBe(userId);
    });
  });

  describe('findSessionByToken', () => {
    it('returns the session joined with its user', () => {
      const db = freshDb();
      const userId = seedUser(db);
      insertSession(db, {
        token: 'tok-2',
        userId,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });

      const found = findSessionByToken(db, 'tok-2');

      expect(found).not.toBeNull();
      expect(found?.session.token).toBe('tok-2');
      expect(found?.user.id).toBe(userId);
      expect(found?.user.email).toBe('u@example.com');
    });

    it('returns null for a missing token', () => {
      const db = freshDb();

      expect(findSessionByToken(db, 'nope')).toBeNull();
    });

    it('returns null for an expired session', () => {
      const db = freshDb();
      const userId = seedUser(db);
      insertSession(db, {
        token: 'tok-old',
        userId,
        expiresAt: new Date(Date.now() - 60_000).toISOString(), // past
      });

      expect(findSessionByToken(db, 'tok-old')).toBeNull();
    });
  });

  describe('deleteSessionByToken', () => {
    it('removes the session', () => {
      const db = freshDb();
      const userId = seedUser(db);
      insertSession(db, {
        token: 'tok-3',
        userId,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });

      deleteSessionByToken(db, 'tok-3');

      expect(findSessionByToken(db, 'tok-3')).toBeNull();
    });

    it('is a no-op for a missing token', () => {
      const db = freshDb();
      expect(() => deleteSessionByToken(db, 'missing')).not.toThrow();
    });
  });
});

describe('sessions service', () => {
  it('create mints a unique token, a future expiry, and persists the row', () => {
    const db = freshDb();
    const userId = seedUser(db);

    const session = createSession(db, userId);

    expect(session.token).toMatch(/.+/);
    expect(session.userId).toBe(userId);
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    // persisted + retrievable
    expect(findSessionByToken(db, session.token)?.session.token).toBe(session.token);
  });

  it('destroy removes a persisted session', () => {
    const db = freshDb();
    const userId = seedUser(db);
    const session = createSession(db, userId);

    destroy(db, session.token);

    expect(findSessionByToken(db, session.token)).toBeNull();
  });
});
