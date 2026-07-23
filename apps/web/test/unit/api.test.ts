import { afterEach, describe, expect, it, mock } from 'bun:test';
import type { Todo } from '@todo/domain';
import {
  ApiError,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
} from '../../src/lib/api';

const originalFetch = globalThis.fetch;

const sampleTodo: Todo = {
  id: 'todo-1',
  title: 'Write tests',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/** Swap globalThis.fetch for a controllable mock; returns it for call assertions. */
function mockFetch(opts: {
  ok?: boolean;
  status?: number;
  json?: () => Promise<unknown>;
}) {
  const fn = mock(() =>
    Promise.resolve({
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      json: opts.json ?? (() => Promise.resolve({})),
    }),
  );
  globalThis.fetch = fn as unknown as typeof globalThis.fetch;
  return fn;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('apiGet', () => {
  it('GETs from BASE_URL and returns parsed JSON', async () => {
    const data = { hello: 'world' };
    const fn = mockFetch({ ok: true, json: () => Promise.resolve(data) });

    const result = await apiGet<typeof data>('/ping');

    expect(result).toEqual(data);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('/api/ping', {
      headers: { accept: 'application/json' },
    });
  });

  it('throws ApiError with status + message on !ok', async () => {
    mockFetch({ ok: false, status: 404 });

    const error = await apiGet('/gone').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).message).toBe('GET /gone failed');
  });
});

describe('apiPost', () => {
  it('POSTs a JSON body and returns parsed JSON', async () => {
    const fn = mockFetch({ ok: true, json: () => Promise.resolve(sampleTodo) });
    const body = { title: 'New' };

    const result = await apiPost<typeof sampleTodo>('/items', body);

    expect(result).toEqual(sampleTodo);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(
      '/api/items',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  });

  it('throws ApiError on !ok', async () => {
    mockFetch({ ok: false, status: 400 });

    const error = await apiPost('/items', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).message).toBe('POST /items failed');
  });
});

describe('apiPatch', () => {
  it('PATCHes a JSON body and returns parsed JSON', async () => {
    const fn = mockFetch({ ok: true, json: () => Promise.resolve(sampleTodo) });
    const body = { completed: true };

    const result = await apiPatch<typeof sampleTodo>('/items/1', body);

    expect(result).toEqual(sampleTodo);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  });

  it('throws ApiError on !ok', async () => {
    mockFetch({ ok: false, status: 403 });

    const error = await apiPatch('/items/1', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
    expect((error as ApiError).message).toBe('PATCH /items/1 failed');
  });
});

describe('apiDelete', () => {
  it('DELETEs and resolves void on ok', async () => {
    const fn = mockFetch({ ok: true });

    const result = await apiDelete('/items/1');

    expect(result).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('throws ApiError on !ok', async () => {
    mockFetch({ ok: false, status: 500 });

    const error = await apiDelete('/items/1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe('DELETE /items/1 failed');
  });
});

describe('fetchTodos', () => {
  it('GETs /todos and returns Todo[]', async () => {
    const fn = mockFetch({
      ok: true,
      json: () => Promise.resolve([sampleTodo]),
    });

    const result = await fetchTodos();

    expect(result).toEqual([sampleTodo]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('/api/todos', {
      headers: { accept: 'application/json' },
    });
  });
});

describe('createTodo', () => {
  it('POSTs /todos with the input body and returns the created Todo', async () => {
    const fn = mockFetch({
      ok: true,
      json: () => Promise.resolve(sampleTodo),
    });

    const result = await createTodo({ title: 'Write tests' });

    expect(result).toEqual(sampleTodo);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(
      '/api/todos',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Write tests' }),
      }),
    );
  });
});

describe('updateTodo', () => {
  it('PATCHes /todos/:id with the input body and returns the updated Todo', async () => {
    const fn = mockFetch({
      ok: true,
      json: () => Promise.resolve(sampleTodo),
    });

    const result = await updateTodo('todo-1', { completed: true });

    expect(result).toEqual(sampleTodo);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(
      '/api/todos/todo-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }),
    );
  });
});

describe('deleteTodo', () => {
  it('DELETEs /todos/:id', async () => {
    const fn = mockFetch({ ok: true });

    await deleteTodo('todo-1');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(
      '/api/todos/todo-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
