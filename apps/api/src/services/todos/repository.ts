// Single SQL surface for todos. Every bun:sqlite query lives here — no other file
// writes SQL. The db client is injected into each function; there is no module-level
// singleton. Functions return @todo/domain types via the @todo/db row mapper and throw
// NotFoundError/ValidationError on bad lookups or empty titles.
import type { Database } from 'bun:sqlite';
import { mapTodoRow, type TodoRow } from '@todo/db';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@todo/domain';
import { NotFoundError, ValidationError } from '../../errors';

/** Select a single todos row by id, or null when it does not exist. */
function selectTodoRow(db: Database, id: string): TodoRow | null {
  return db
    .prepare('SELECT id, title, completed, created_at, updated_at FROM todos WHERE id = ?')
    .get(id) as TodoRow | null;
}

/** Select a single todos row by id, throwing NotFoundError when it does not exist. */
function requireTodoRow(db: Database, id: string): TodoRow {
  const row = selectTodoRow(db, id);
  if (!row) {
    throw new NotFoundError('Todo');
  }
  return row;
}

/** Return all todos, oldest first. */
export function listTodos(db: Database): Todo[] {
  const rows = db
    .prepare(
      'SELECT id, title, completed, created_at, updated_at FROM todos ORDER BY created_at ASC',
    )
    .all() as TodoRow[];
  return rows.map((row) => mapTodoRow(row));
}

/** Insert a new todo and return the schema-valid domain object. */
export function insertTodo(db: Database, input: CreateTodoInput): Todo {
  const title = input.title.trim();
  if (title === '') {
    throw new ValidationError('title must not be empty');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO todos (id, title, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, title, 0, now, now);

  return { id, title, completed: false, createdAt: now, updatedAt: now };
}

/** Fetch a single todo by id. Throws NotFoundError when it does not exist. */
export function getTodo(db: Database, id: string): Todo {
  return mapTodoRow(requireTodoRow(db, id));
}

/** Update the mutable fields of a todo, returning the refreshed domain object. */
export function updateTodo(db: Database, id: string, input: UpdateTodoInput): Todo {
  requireTodoRow(db, id);

  const sets: string[] = [];
  const params: (string | number)[] = [];

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title === '') {
      throw new ValidationError('title must not be empty');
    }
    sets.push('title = ?');
    params.push(title);
  }
  if (input.completed !== undefined) {
    sets.push('completed = ?');
    params.push(input.completed ? 1 : 0);
  }

  // Always bump updated_at so a persisted change is observable.
  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);

  db.prepare(`UPDATE todos SET ${sets.join(', ')} WHERE id = ?`).run(...params);

  return mapTodoRow(requireTodoRow(db, id));
}

/** Delete a todo by id. Throws NotFoundError when it does not exist. */
export function deleteTodo(db: Database, id: string): void {
  requireTodoRow(db, id);
  db.prepare('DELETE FROM todos WHERE id = ?').run(id);
}

/** Count all todos. Used by the stats service. */
export function countTodos(db: Database): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM todos').get() as { count: number };
  return row.count;
}
