// SQLite db factory + migration + row→domain mapper for @todo/db.
import { Database } from 'bun:sqlite';
import type { Session, Todo, User } from '@todo/domain';
import { CREATE_SESSIONS_SQL, CREATE_TODOS_SQL, CREATE_USERS_SQL } from './schema';

/** Raw SQLite row shape (snake_case columns, completed stored as 0/1 integer). */
export interface TodoRow {
  id: string;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

/** Raw SQLite users row shape — password_hash lives ONLY here, never on User. */
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

/** Raw SQLite sessions row shape. token is the PRIMARY KEY. */
export interface SessionRow {
  token: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

/**
 * Open a SQLite database. Defaults to an in-memory DB so callers (tests, ephemeral
 * runs) don't touch disk unless they ask for it via `path`.
 */
export function createDb(path: string = ':memory:'): Database {
  return new Database(path);
}

/** Run migrations. Idempotent — safe to call repeatedly. */
export function migrate(db: Database): void {
  db.run(CREATE_TODOS_SQL);
  db.run(CREATE_USERS_SQL);
  db.run(CREATE_SESSIONS_SQL);
}

/** Map a raw snake_case SQLite row into a schema-valid Todo domain object. */
export function mapTodoRow(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed !== 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a raw snake_case users row into a safe User (password_hash stripped). */
export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role as User['role'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a raw snake_case sessions row into a schema-valid Session domain object. */
export function mapSessionRow(row: SessionRow): Session {
  return {
    token: row.token,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
