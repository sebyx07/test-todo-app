// Single SQL surface for users. Mirrors services/todos/repository.ts: every
// bun:sqlite query lives here, the db client is injected into each function, and
// functions return @todo/domain User types via the @todo/db row mapper. The
// password_hash column is selected only to satisfy the row shape; it never appears
// in a returned User domain object (mapUserRow strips it).
import type { Database } from 'bun:sqlite';
import { mapUserRow, type UserRow } from '@todo/db';
import type { User } from '@todo/domain';
import { NotFoundError } from '../../errors';

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

/** Select a single users row by id, throwing NotFoundError when it does not exist. */
function requireUserRow(db: Database, id: string): UserRow {
  const row = selectUserRowById(db, id);
  if (!row) {
    throw new NotFoundError('User');
  }
  return row;
}

/** Return all users, oldest first (password_hash is stripped by the mapper). */
export function listUsers(db: Database): User[] {
  const rows = db
    .prepare(
      'SELECT id, email, password_hash, role, created_at, updated_at FROM users ORDER BY created_at ASC',
    )
    .all() as UserRow[];
  return rows.map((row) => mapUserRow(row));
}

/** Count the users whose role is 'admin'. Guards last-admin demotion in update-role. */
export function countAdmins(db: Database): number {
  const row = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get() as {
    count: number;
  };
  return row.count;
}

/** Count all users. Used by the stats service. */
export function countUsers(db: Database): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  return row.count;
}

/** Update a user's role, returning the refreshed domain object. Throws NotFoundError when missing. */
export function updateUserRole(db: Database, id: string, role: User['role']): User {
  requireUserRow(db, id);
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, now, id);
  return mapUserRow(requireUserRow(db, id));
}

/** Delete a user by id. Throws NotFoundError when it does not exist. */
export function deleteUser(db: Database, id: string): void {
  requireUserRow(db, id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}
