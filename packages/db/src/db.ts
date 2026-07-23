// SQLite db factory + migration + row→domain mapper for @todo/db.
import { Database } from 'bun:sqlite';
import type { Todo } from '@todo/domain';
import { CREATE_TODOS_SQL } from './schema';

/** Raw SQLite row shape (snake_case columns, completed stored as 0/1 integer). */
export interface TodoRow {
  id: string;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
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
