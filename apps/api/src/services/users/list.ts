// List users — thin service passthrough to the repository. No business rules apply to
// listing; ordering (oldest first) and password_hash stripping live in the repository.
import type { Database } from 'bun:sqlite';
import type { User } from '@todo/domain';
import { listUsers } from './repository';

/** Return all users, oldest first. */
export function list(db: Database): User[] {
  return listUsers(db);
}
