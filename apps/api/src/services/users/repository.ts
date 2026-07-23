// Single SQL surface for users. Mirrors services/todos/repository.ts: every
// bun:sqlite query lives here, the db client is injected into each function, and
// functions return @todo/domain User types via the @todo/db row mapper. The
// password_hash column is selected only to satisfy the row shape; it never appears
// in a returned User domain object (mapUserRow strips it).
import type { Database } from 'bun:sqlite';
import { mapUserRow, type UserRow } from '@todo/db';
import type { User } from '@todo/domain';

export interface InsertUserInput {
  email: string;
  passwordHash: string;
}

/** Select a single users row by email, or null when it does not exist. */
function selectUserRowByEmail(db: Database, email: string): UserRow | null {
  return db
    .prepare(
      'SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = ?',
    )
    .get(email) as UserRow | null;
}

/** Select a single users row by id, or null when it does not exist. */
function selectUserRowById(db: Database, id: string): UserRow | null {
  return db
    .prepare(
      'SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = ?',
    )
    .get(id) as UserRow | null;
}

/** Insert a new user (role defaults to 'user') and return the domain object. */
export function insertUser(db: Database, input: InsertUserInput): User {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, input.email, input.passwordHash, 'user', now, now);

  return { id, email: input.email, role: 'user', createdAt: now, updatedAt: now };
}

/** Fetch a user by email, or null when none exists. */
export function findUserByEmail(db: Database, email: string): User | null {
  const row = selectUserRowByEmail(db, email);
  return row ? mapUserRow(row) : null;
}

/** User + its stored password hash. Login is the only consumer; hash never leaves the service layer. */
export interface UserCredentials {
  user: User;
  passwordHash: string;
}

/** Fetch a user + its password hash by email, or null. Used by login to verify the password. */
export function findUserCredentialsByEmail(db: Database, email: string): UserCredentials | null {
  const row = selectUserRowByEmail(db, email);
  if (!row) {
    return null;
  }
  return { user: mapUserRow(row), passwordHash: row.password_hash };
}

/** Fetch a user by id, or null when none exists. */
export function findUserById(db: Database, id: string): User | null {
  const row = selectUserRowById(db, id);
  return row ? mapUserRow(row) : null;
}
