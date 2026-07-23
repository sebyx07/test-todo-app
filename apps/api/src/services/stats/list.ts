// Platform stats — aggregates row counts across domains. Each count lives in its own
// domain repository (the single SQL surface per domain), so this service only orchestrates.
import type { Database } from 'bun:sqlite';
import { countTodos } from '../todos/repository';
import { countUsers } from '../users/repository';

export interface PlatformStats {
  userCount: number;
  todoCount: number;
}

/** Return platform-wide counts. */
export function list(db: Database): PlatformStats {
  return { userCount: countUsers(db), todoCount: countTodos(db) };
}
