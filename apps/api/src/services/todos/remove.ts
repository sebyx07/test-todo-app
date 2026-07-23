// Service layer for deleting a todo. Thin wrapper over the repository — the
// repository throws NotFoundError for a missing id, which the errorHandler
// middleware maps to a 404. No business rules apply to deletion.
import type { Database } from 'bun:sqlite';
import { deleteTodo } from './repository';

/** Delete a todo by id. Throws NotFoundError when it does not exist. */
export function remove(db: Database, id: string): void {
  deleteTodo(db, id);
}
