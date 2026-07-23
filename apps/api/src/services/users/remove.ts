// Remove a user — the deletion boundary for admins. Rejects self-deletion so an admin
// cannot erase their own account mid-session. The repository throws NotFoundError for a
// missing id; no other business rules apply to deletion.
import type { Database } from 'bun:sqlite';
import { ForbiddenError } from '../../errors';
import { deleteUser } from './repository';

/** Delete a user by id, refusing self-deletion. Throws NotFoundError when the id is missing. */
export function remove(db: Database, actorId: string, targetId: string): void {
  if (actorId === targetId) {
    throw new ForbiddenError('You cannot delete your own account');
  }
  deleteUser(db, targetId);
}
