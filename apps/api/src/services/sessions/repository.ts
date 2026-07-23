// Single SQL surface for sessions. Mirrors services/todos/repository.ts and
// services/users/repository.ts: every bun:sqlite query lives here, the db client is
// injected into each function, and functions return @todo/domain types.
// findSessionByToken JOINs users (so the auth middleware gets the user in one query)
// and filters out expired rows (expires_at > now) via a parameterized comparison.
import type { Database } from 'bun:sqlite';
import type { Session, User } from '@todo/domain';

export interface InsertSessionInput {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface SessionWithUser {
  session: Session;
  user: User;
}

/**
 * Raw joined row. sessions.created_at is aliased (users also has created_at) so the
 * two never collide; the remaining user columns keep their snake_case names.
 */
interface SessionUserJoinRow {
  token: string;
  user_id: string;
  expires_at: string;
  session_created_at: string;
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const JOIN_COLUMNS =
  's.token, s.user_id, s.expires_at, s.created_at AS session_created_at, u.id, u.email, u.role, u.created_at, u.updated_at';

function mapJoinRow(row: SessionUserJoinRow): SessionWithUser {
  return {
    session: {
      token: row.token,
      userId: row.user_id,
      expiresAt: row.expires_at,
      createdAt: row.session_created_at,
    },
    user: {
      id: row.id,
      email: row.email,
      role: row.role as User['role'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

/** Insert a new session row and return the persisted Session domain object. */
export function insertSession(db: Database, input: InsertSessionInput): Session {
  const createdAt = new Date().toISOString();

  db.prepare(
    'INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(input.token, input.userId, input.expiresAt, createdAt);

  return {
    token: input.token,
    userId: input.userId,
    expiresAt: input.expiresAt,
    createdAt,
  };
}

/**
 * Fetch a non-expired session joined with its user by token, or null. Expired or
 * missing sessions resolve to null (treated as unauthenticated).
 */
export function findSessionByToken(db: Database, token: string): SessionWithUser | null {
  const now = new Date().toISOString();
  const row = db
    .prepare(
      `SELECT ${JOIN_COLUMNS} FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, now) as SessionUserJoinRow | null;
  return row ? mapJoinRow(row) : null;
}

/** Delete a session by token (logout). No-op when the token does not exist. */
export function deleteSessionByToken(db: Database, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
