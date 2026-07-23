// Unit tests for the PURE optimistic-patch helper in lib/todos. The hooks
// themselves need a reactive root + QueryClient context and are covered
// elsewhere; only the deterministic, side-effect-free patcher is tested here.
import { describe, expect, it } from 'bun:test';
import type { Todo } from '@todo/domain';
import { applyTodoPatch, computeTodoCounts, selectVisibleTodos } from '../../src/lib/todos';

/** Build a fresh Todo so tests can never share object references by accident. */
function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'todo-1',
    title: 'Write tests',
    completed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('applyTodoPatch', () => {
  it('flips completed false → true for the matched todo', () => {
    const todos = [makeTodo({ id: '1', completed: false })];

    const result = applyTodoPatch(todos, '1', { completed: true });

    expect(result.find((t) => t.id === '1')?.completed).toBe(true);
  });

  it('flips completed true → false for the matched todo', () => {
    const todos = [makeTodo({ id: '1', completed: true })];

    const result = applyTodoPatch(todos, '1', { completed: false });

    expect(result.find((t) => t.id === '1')?.completed).toBe(false);
  });

  it('updates the title and preserves the completed flag', () => {
    const todos = [makeTodo({ id: '1', title: 'Old', completed: true })];

    const result = applyTodoPatch(todos, '1', { title: 'New title' });

    const patched = result.find((t) => t.id === '1');
    expect(patched?.title).toBe('New title');
    expect(patched?.completed).toBe(true);
  });

  it('applies title and completed together in a single patch', () => {
    const todos = [makeTodo({ id: '1', title: 'Old', completed: false })];

    const result = applyTodoPatch(todos, '1', { title: 'New', completed: true });

    expect(result.find((t) => t.id === '1')).toEqual(
      makeTodo({ id: '1', title: 'New', completed: true }),
    );
  });

  it('preserves id, createdAt and updatedAt (only patch fields change)', () => {
    const todos = [
      makeTodo({
        id: '1',
        title: 'Old',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
      }),
    ];

    const result = applyTodoPatch(todos, '1', { completed: true });

    const patched = result.find((t) => t.id === '1');
    expect(patched?.id).toBe('1');
    expect(patched?.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(patched?.updatedAt).toBe('2024-02-02T00:00:00.000Z');
  });

  it('does not mutate the input array or its todo objects', () => {
    const original = makeTodo({ id: '1', completed: false });
    const todos = [original];

    const result = applyTodoPatch(todos, '1', { completed: true });

    // the source objects and array are left untouched
    expect(original.completed).toBe(false);
    expect(todos[0]?.completed).toBe(false);
    // a brand-new array is returned, not the same reference
    expect(result).not.toBe(todos);
    // the matched todo is a new object, not the mutated original
    expect(result[0]).not.toBe(original);
  });

  it('leaves sibling todos untouched', () => {
    const sibling = makeTodo({ id: '2', title: 'Other', completed: false });
    const todos = [makeTodo({ id: '1', completed: false }), sibling];

    const result = applyTodoPatch(todos, '1', { completed: true });

    expect(result.find((t) => t.id === '2')).toEqual(sibling);
    // the sibling object itself was not mutated
    expect(sibling.completed).toBe(false);
  });

  it('leaves the list unchanged when no todo matches the id', () => {
    const todos = [makeTodo({ id: '1' }), makeTodo({ id: '2' })];

    const result = applyTodoPatch(todos, 'missing', { completed: true });

    expect(result).toEqual(todos);
    expect(result).toHaveLength(2);
  });
});

describe('selectVisibleTodos', () => {
  it('returns every todo (a new array) under the "all" filter', () => {
    const todos = [makeTodo({ id: '1', completed: false }), makeTodo({ id: '2', completed: true })];

    const result = selectVisibleTodos(todos, 'all');

    expect(result).toEqual(todos);
    expect(result).not.toBe(todos);
  });

  it('keeps only incomplete todos under the "active" filter', () => {
    const todos = [
      makeTodo({ id: '1', completed: false }),
      makeTodo({ id: '2', completed: true }),
      makeTodo({ id: '3', completed: false }),
    ];

    const result = selectVisibleTodos(todos, 'active');

    expect(result.map((t) => t.id)).toEqual(['1', '3']);
  });

  it('keeps only completed todos under the "completed" filter', () => {
    const todos = [
      makeTodo({ id: '1', completed: false }),
      makeTodo({ id: '2', completed: true }),
      makeTodo({ id: '3', completed: true }),
    ];

    const result = selectVisibleTodos(todos, 'completed');

    expect(result.map((t) => t.id)).toEqual(['2', '3']);
  });

  it('returns an empty array for an empty input regardless of filter', () => {
    expect(selectVisibleTodos([], 'all')).toEqual([]);
    expect(selectVisibleTodos([], 'active')).toEqual([]);
    expect(selectVisibleTodos([], 'completed')).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const todos = [makeTodo({ id: '1', completed: false })];

    selectVisibleTodos(todos, 'completed');

    expect(todos).toHaveLength(1);
  });
});

describe('computeTodoCounts', () => {
  it('counts total/active/done for a mixed list', () => {
    const todos = [
      makeTodo({ id: '1', completed: false }),
      makeTodo({ id: '2', completed: true }),
      makeTodo({ id: '3', completed: true }),
    ];

    expect(computeTodoCounts(todos)).toEqual({ total: 3, active: 1, done: 2 });
  });

  it('reports all active for a list with nothing done', () => {
    const todos = [makeTodo({ completed: false }), makeTodo({ completed: false })];

    expect(computeTodoCounts(todos)).toEqual({ total: 2, active: 2, done: 0 });
  });

  it('reports all done for a fully completed list', () => {
    const todos = [makeTodo({ completed: true }), makeTodo({ completed: true })];

    expect(computeTodoCounts(todos)).toEqual({ total: 2, active: 0, done: 2 });
  });

  it('returns zeroes for an empty list', () => {
    expect(computeTodoCounts([])).toEqual({ total: 0, active: 0, done: 0 });
  });
});
