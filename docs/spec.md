# Todo — product spec

Single-user todo list. A small, full-stack CRUD app to exercise the monorepo stack end to end. **Test app — never deployed.**

## Entity

A `Todo` (defined in `packages/domain/src/todo.ts`, validated by Zod):

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID v4, server-generated |
| `title` | `string` | Non-empty after trim; trimmed before persist |
| `completed` | `boolean` | Defaults `false` on create |
| `createdAt` | `string \| number` | ISO timestamp, set once on create |
| `updatedAt` | `string \| number` | ISO timestamp, bumped on every mutation |

Inputs: `CreateTodoInput { title }`; `UpdateTodoInput { title?, completed? }` — partial, only supplied keys are persisted (see `exactOptionalPropertyTypes`).

## Persistence

SQLite, single `todos` table. Schema, DDL, and the row→domain mapper live in `packages/db` (`src/schema.ts`, `src/db.ts`): `completed` is stored as an integer `0`/`1`; `createDb(path)` opens the DB (default `:memory:`), `migrate(db)` is idempotent. The API injects the `db` client from `env.DB_PATH`.

## HTTP endpoints (intended contract)

The web client (`apps/web/src/lib/api.ts`) already targets these paths.

| Method | Path | Body | Success | Error |
|---|---|---|---|---|
| `GET` | `/todos` | — | `200` `Todo[]` (oldest first) | — |
| `POST` | `/todos` | `{ title }` | `201` `Todo` | `422` empty title |
| `PATCH` | `/todos/:id` | `{ title?, completed? }` | `200` `Todo` | `404` unknown id; `422` empty title |
| `DELETE` | `/todos/:id` | — | `204` | `404` unknown id |

Status codes: `201` on create, `200` elsewhere, `404`/`422` only via thrown `AppError` subclasses (`NotFoundError`, `ValidationError` in `apps/api/src/errors.ts`) mapped by the error middleware.

## Web UI

`/` redirects to `/todos` (`apps/web/src/routes/Home.tsx`). The Todos route composes the TanStack Query hooks (`useTodos`, `useCreateTodo`, `useUpdateTodo`, `useDeleteTodo`) and renders: an add form, the All/Active/Completed filter row, a total/active/done stats line, and the list. Toggle and rename are optimistic (snapshot → patch → roll back on error → refetch). Double-click a title to rename; Enter/blur commits, Escape cancels.

## Acceptance

- Create a todo → it appears at the bottom of the list; the form clears.
- Toggle the checkbox → the row strikes through immediately; the active/done counts update.
- Double-click the title, edit, press Enter → the title updates; Escape discards.
- Delete (✕) → the row is removed; counts update.
- Filter Active/Completed hides non-matching rows; counts always reflect the full set.
- Empty title (after trim) is rejected at the Zod boundary → `422`, never persisted.
- A `PATCH`/`DELETE` to an unknown id → `404`.

## Implementation status — as of 2026-07

- **Done:** `Todo` domain types + Zod schemas (`packages/domain`); SQLite schema, migration, and row mapper (`packages/db`); todo services `create`/`list`/`update`/`remove` over a single SQL repository (`apps/api/src/services/todos/`), unit-tested; `DB_PATH` in the env schema; the todo HTTP routes registered in `createApp()` with migration at boot (`apps/api/src/app.ts`), integration-tested over real HTTP; the full SolidJS todo UI with filters and stats.
