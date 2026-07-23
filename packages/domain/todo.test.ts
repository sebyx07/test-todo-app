import { describe, expect, it } from 'bun:test';
import { createTodoSchema, todoSchema, updateTodoSchema } from './src/index';

describe('domain schemas', () => {
  it('createTodoSchema trims and accepts a valid title', () => {
    expect(createTodoSchema.parse({ title: '  buy milk  ' })).toEqual({ title: 'buy milk' });
  });

  it('createTodoSchema rejects an empty title', () => {
    expect(() => createTodoSchema.parse({ title: '' })).toThrow();
  });

  it('createTodoSchema rejects a whitespace-only title', () => {
    expect(() => createTodoSchema.parse({ title: '   ' })).toThrow();
  });

  it('updateTodoSchema accepts an empty object', () => {
    expect(updateTodoSchema.parse({})).toEqual({});
  });

  it('updateTodoSchema accepts a single field', () => {
    expect(updateTodoSchema.parse({ completed: true })).toEqual({ completed: true });
  });

  it('todoSchema validates a full todo with ISO-string timestamps', () => {
    const todo = {
      id: 'u1',
      title: 't',
      completed: false,
      createdAt: '2026-07-23T00:00:00.000Z',
      updatedAt: '2026-07-23T00:00:00.000Z',
    };

    expect(todoSchema.parse(todo)).toEqual(todo);
  });

  it('todoSchema validates a full todo with numeric timestamps', () => {
    const todo = {
      id: 'u1',
      title: 't',
      completed: false,
      createdAt: 1753238400000,
      updatedAt: 1753238400000,
    };

    expect(todoSchema.parse(todo)).toEqual(todo);
  });
});
