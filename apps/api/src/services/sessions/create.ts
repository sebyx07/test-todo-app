// Create session — mints the token and computes the expiry from the configured TTL,
// then persists via the repository. Returns the Session (its `token` is what the
// login route sets as the cookie value).
import type { Database } from 'bun:sqlite';
import type { Session } from '@todo/domain';
import { env } from '../../env';
import { insertSession } from './repository';

/** Mint a session token and persist it for `userId`. */
export function create(db: Database, userId: string): Session {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000).toISOString();
  return insertSession(db, { token, userId, expiresAt });
}
