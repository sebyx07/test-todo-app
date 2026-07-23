// Todo routes — thin: parse → validate → call service → render. Zero logic here.

import type { Database } from 'bun:sqlite';
import type { CreateTodoInput, UpdateTodoInput } from '@todo/domain';
import type { Hono } from 'hono';
import { create } from '../services/todos/create';
import { list } from '../services/todos/list';
import { remove } from '../services/todos/remove';
import { update } from '../services/todos/update';

/** Register the todo CRUD routes on `app`, all backed by `db`. */
export function registerTodoRoutes(app: Hono, db: Database): void {
  app.get('/todos', (c) => c.json(list(db), 200));

  app.post('/todos', async (c) => {
    const body = (await c.req.json()) as CreateTodoInput;
    const todo = create(db, body);
    return c.json(todo, 201);
  });

  app.patch('/todos/:id', async (c) => {
    const id = c.req.param('id');
    const body = (await c.req.json()) as UpdateTodoInput;
    const todo = update(db, id, body);
    return c.json(todo, 200);
  });

  app.delete('/todos/:id', (c) => {
    const id = c.req.param('id');
    remove(db, id);
    return c.body(null, 204);
  });
}
