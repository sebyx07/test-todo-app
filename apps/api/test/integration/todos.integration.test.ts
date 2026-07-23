// Integration: boot the real server over a real SQLite db, drive the full todo
// lifecycle over HTTP. No mocks — exercises routes → services → repository → bun:sqlite.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createDb, migrate } from '@todo/db';
import type { Todo } from '@todo/domain';
import { createApp } from '../../src/app';

let server: ReturnType<typeof Bun.serve>;

// One shared in-memory db for the suite so create→toggle→rename→delete chains hold state.
const db = createDb(':memory:');

beforeAll(() => {
  migrate(db);
  server = Bun.serve({ port: 0, fetch: createApp(db).fetch });
});

afterAll(async () => {
  await server.stop(true);
});

const base = () => `${server.url}`;

describe('todos over HTTP', () => {
  it('round-trips the full lifecycle: create → list → toggle → rename → delete', async () => {
    // start empty
    let listRes = await fetch(`${base()}todos`);
    expect(listRes.status).toBe(200);
    expect(await listRes.json()).toEqual([]);

    // create
    const createdRes = await fetch(`${base()}todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '  Write tests  ' }),
    });
    expect(createdRes.status).toBe(201);
    const created = (await createdRes.json()) as Todo;
    expect(created.title).toBe('Write tests'); // trimmed at the boundary
    expect(created.completed).toBe(false);
    expect(created.id).toMatch(/.+/);

    // list now contains it
    listRes = await fetch(`${base()}todos`);
    const list1 = (await listRes.json()) as Todo[];
    expect(list1).toHaveLength(1);
    expect(list1[0]?.id).toBe(created.id);

    // toggle completed
    const toggledRes = await fetch(`${base()}todos/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    expect(toggledRes.status).toBe(200);
    const toggled = (await toggledRes.json()) as Todo;
    expect(toggled.completed).toBe(true);
    expect(toggled.title).toBe('Write tests'); // untouched by the toggle

    // rename
    const renamedRes = await fetch(`${base()}todos/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Ship it' }),
    });
    expect(renamedRes.status).toBe(200);
    const renamed = (await renamedRes.json()) as Todo;
    expect(renamed.title).toBe('Ship it');
    expect(renamed.completed).toBe(true); // toggle persisted across the rename

    // delete
    const deleteRes = await fetch(`${base()}todos/${created.id}`, { method: 'DELETE' });
    expect(deleteRes.status).toBe(204);
    expect(await deleteRes.text()).toBe('');

    // gone
    listRes = await fetch(`${base()}todos`);
    expect((await listRes.json()) as Todo[]).toEqual([]);
  });

  it('returns 404 for a missing todo on PATCH and DELETE', async () => {
    const patchRes = await fetch(`${base()}todos/missing`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    expect(patchRes.status).toBe(404);
    expect(((await patchRes.json()) as { error: { code: string } }).error.code).toBe('not_found');

    const deleteRes = await fetch(`${base()}todos/missing`, { method: 'DELETE' });
    expect(deleteRes.status).toBe(404);
  });

  it('returns 422 for an empty title on create', async () => {
    const res = await fetch(`${base()}todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    expect(res.status).toBe(422);
    // Empty/whitespace titles are caught by the Zod schema (createTodoSchema),
    // so the errorHandler maps the ZodError to a 'validation_error' code.
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('validation_error');
  });
});
