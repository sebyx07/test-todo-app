// List todos — thin service passthrough to the repository. No business rules apply
// to listing; the ordering and mapping live in the repository (and @todo/db).
import type { Database } from 'bun:sqlite';
import type { Todo } from '@todo/domain';
import { listTodos } from './repository';

/** Return all todos, oldest first. */
export function list(db: Database): Todo[] {
  return listTodos(db);
}
