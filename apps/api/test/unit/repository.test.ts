import { describe, expect, it } from 'bun:test';
import { createDb, migrate } from '@todo/db';
import { todoSchema } from '@todo/domain';
import { NotFoundError, ValidationError } from '../../src/errors';
import {
  deleteTodo,
  getTodo,
  insertTodo,
  listTodos,
  updateTodo,
} from '../../src/services/todos/repository';

/** Fresh migrated in-memory db per test — keeps each test hermetic. */
function freshDb() {
  const db = createDb(':memory:');
  migrate(db);
  return db;
}

describe('todos repository', () => {
  describe('insertTodo', () => {
    it('inserts a todo and returns a schema-valid Todo', () => {
      const db = freshDb();

      const todo = insertTodo(db, { title: 'Write tests' });

      const parsed = todoSchema.parse(todo);
      expect(parsed).toEqual({
        id: todo.id,
        title: 'Write tests',
        completed: false,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
      });
      expect(parsed.id).toMatch(/.+/);
      expect(parsed.completed).toBe(false);
    });

    it('generates a unique id and ISO timestamps', () => {
      const db = freshDb();

      const a = insertTodo(db, { title: 'A' });
      const b = insertTodo(db, { title: 'B' });

      expect(a.id).not.toBe(b.id);
      expect(typeof a.createdAt).toBe('string');
      expect(typeof a.updatedAt).toBe('string');
      expect(() => new Date(a.createdAt as string).toISOString()).not.toThrow();
    });

    it('throws ValidationError on an empty title', () => {
      const db = freshDb();

      expect(() => insertTodo(db, { title: '' })).toThrow(ValidationError);
      expect(() => insertTodo(db, { title: '   ' })).toThrow(ValidationError);
      expect(listTodos(db)).toHaveLength(0);
    });
  });

  describe('getTodo', () => {
    it('returns the todo for an existing id', () => {
      const db = freshDb();
      const created = insertTodo(db, { title: 'Find me' });

      const found = getTodo(db, created.id);

      expect(found).toEqual(created);
    });

    it('throws NotFoundError for a missing id', () => {
      const db = freshDb();

      expect(() => getTodo(db, 'does-not-exist')).toThrow(NotFoundError);
    });
  });

  describe('listTodos', () => {
    it('returns an empty array when there are no todos', () => {
      const db = freshDb();

      expect(listTodos(db)).toEqual([]);
    });

    it('returns all inserted todos', () => {
      const db = freshDb();
      const a = insertTodo(db, { title: 'A' });
      const b = insertTodo(db, { title: 'B' });

      const todos = listTodos(db);

      expect(todos).toHaveLength(2);
      expect(todos).toEqual(expect.arrayContaining([a, b]));
    });
  });

  describe('updateTodo', () => {
    it('updates the title and returns the updated Todo', () => {
      const db = freshDb();
      const created = insertTodo(db, { title: 'Old title' });

      const updated = updateTodo(db, created.id, { title: 'New title' });

      expect(updated.title).toBe('New title');
      expect(updated.id).toBe(created.id);
      expect(updated.completed).toBe(false);
      // re-read to confirm it persisted
      expect(getTodo(db, created.id).title).toBe('New title');
    });

    it('updates completed and returns the updated Todo', () => {
      const db = freshDb();
      const created = insertTodo(db, { title: 'Finish it' });

      const updated = updateTodo(db, created.id, { completed: true });

      expect(updated.completed).toBe(true);
      expect(getTodo(db, created.id).completed).toBe(true);
    });

    it('updates only the provided field, leaving the rest untouched', () => {
      const db = freshDb();
      const created = insertTodo(db, { title: 'Keep me' });

      const updated = updateTodo(db, created.id, { completed: true });

      expect(updated.title).toBe('Keep me');
    });

    it('throws NotFoundError for a missing id', () => {
      const db = freshDb();

      expect(() => updateTodo(db, 'missing', { title: 'x' })).toThrow(NotFoundError);
    });

    it('throws ValidationError on an empty title', () => {
      const db = freshDb();
      const created = insertTodo(db, { title: 'Original' });

      expect(() => updateTodo(db, created.id, { title: '' })).toThrow(ValidationError);
      // nothing changed
      expect(getTodo(db, created.id).title).toBe('Original');
    });
  });

  describe('deleteTodo', () => {
    it('removes the todo', () => {
      const db = freshDb();
      const created = insertTodo(db, { title: 'Delete me' });

      deleteTodo(db, created.id);

      expect(() => getTodo(db, created.id)).toThrow(NotFoundError);
      expect(listTodos(db)).toHaveLength(0);
    });

    it('throws NotFoundError for a missing id', () => {
      const db = freshDb();

      expect(() => deleteTodo(db, 'missing')).toThrow(NotFoundError);
    });
  });
});
