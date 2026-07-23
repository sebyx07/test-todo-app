// Create todo — the validation boundary for inserts. The raw input is parsed with
// the Zod schema (createTodoSchema trims and enforces min length 1) before the
// repository persists it.
import type { Database } from 'bun:sqlite';
import { type CreateTodoInput, createTodoSchema, type Todo } from '@todo/domain';
import { insertTodo } from './repository';

/** Validate the input, then insert and return the new todo. */
export function create(db: Database, input: CreateTodoInput): Todo {
  const parsed = createTodoSchema.parse(input);
  return insertTodo(db, parsed);
}
