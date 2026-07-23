import { describe, expect, it } from 'bun:test';
import { createDb, migrate, mapTodoRow } from '@todo/db';
import { todoSchema } from '@todo/domain';

describe('db layer', () => {
  it('maps a raw sqlite row to a schema-valid Todo', () => {
    const db = createDb(':memory:');

    // migrate is idempotent — running it on a fresh db, then again, must not error.
    migrate(db);
    migrate(db);

    const createdAt = '2024-01-02T03:04:05.000Z';
    const updatedAt = '2024-01-02T03:04:06.000Z';

    // Insert a raw sqlite row directly: snake_case columns, completed stored as 0/1.
    db.run(
      'INSERT INTO todos (id, title, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      ['todo-1', 'Write tests', 1, createdAt, updatedAt],
    );

    const raw = db
      .prepare('SELECT id, title, completed, created_at, updated_at FROM todos WHERE id = ?')
      .get('todo-1');

    const todo = mapTodoRow(raw as Parameters<typeof mapTodoRow>[0]);

    const parsed = todoSchema.parse(todo);
    expect(parsed).toEqual({
      id: 'todo-1',
      title: 'Write tests',
      completed: true,
      createdAt,
      updatedAt,
    });
  });
});
