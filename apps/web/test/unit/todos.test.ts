// Unit tests for the PURE optimistic-patch helper in lib/todos. The hooks
// themselves need a reactive root + QueryClient context and are covered
// elsewhere; only the deterministic, side-effect-free patcher is tested here.
import { describe, expect, it } from 'bun:test';
import type { Todo } from '@todo/domain';
import { applyTodoPatch } from '../../src/lib/todos';

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
