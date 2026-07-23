import { describe, expect, it } from 'bun:test';
import { createDb, migrate } from '@todo/db';
import { userSchema } from '@todo/domain';
import { findUserByEmail, findUserById, insertUser } from '../../src/services/users/repository';

/** Fresh migrated in-memory db per test — keeps each test hermetic. */
function freshDb() {
  const db = createDb(':memory:');
  migrate(db);
  return db;
}

describe('users repository', () => {
  describe('insertUser', () => {
    it('inserts a user and returns a schema-valid User', () => {
      const db = freshDb();

      const user = insertUser(db, { email: 'a@example.com', passwordHash: 'hashed' });

      const parsed = userSchema.parse(user);
      expect(parsed).toEqual({
        id: user.id,
        email: 'a@example.com',
        role: 'user',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    it('generates a unique id and ISO timestamps', () => {
      const db = freshDb();

      const a = insertUser(db, { email: 'a@example.com', passwordHash: 'h' });
      const b = insertUser(db, { email: 'b@example.com', passwordHash: 'h' });

      expect(a.id).not.toBe(b.id);
      expect(typeof a.createdAt).toBe('string');
      expect(() => new Date(a.createdAt as string).toISOString()).not.toThrow();
    });

    it('never exposes the password hash on the returned User', () => {
      const db = freshDb();

      const user = insertUser(db, { email: 'a@example.com', passwordHash: 'super-secret' });

      expect('password_hash' in user).toBe(false);
      expect(JSON.stringify(user)).not.toContain('super-secret');
    });
  });

  describe('findUserByEmail', () => {
    it('returns the user for an existing email', () => {
      const db = freshDb();
      const created = insertUser(db, { email: 'a@example.com', passwordHash: 'h' });

      expect(findUserByEmail(db, 'a@example.com')).toEqual(created);
    });

    it('returns null for a missing email', () => {
      const db = freshDb();

      expect(findUserByEmail(db, 'missing@example.com')).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('returns the user for an existing id', () => {
      const db = freshDb();
      const created = insertUser(db, { email: 'a@example.com', passwordHash: 'h' });

      expect(findUserById(db, created.id)).toEqual(created);
    });

    it('returns null for a missing id', () => {
      const db = freshDb();

      expect(findUserById(db, 'does-not-exist')).toBeNull();
    });
  });
});
