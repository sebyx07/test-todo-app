# @todo/api

Hono HTTP API on Bun. Serves `/healthz` plus todo CRUD (`GET/POST /todos`, `PATCH/DELETE /todos/:id`) backed by SQLite (`@todo/db`). `createApp()` opens the db from `env.DB_PATH` and runs the idempotent migration at boot. The todo services (`src/services/todos/`) are unit-tested and the routes are integration-tested over real HTTP. See `docs/spec.md` for the endpoint contract.

## Run
```bash
bin/dev api                  # hot reload on :3000 (API_PORT)
curl localhost:3000/healthz  # {"ok":true}
bun run --filter @todo/api test               # unit
bun run --filter @todo/api test:integration   # real server over real HTTP
```

## Layout
| Path | Job |
|---|---|
| `src/main.ts` | boot only — port + fetch handler |
| `src/app.ts` | app factory: wiring, nothing else |
| `src/env.ts` | Zod-validated env; fails at boot, never mid-request |
| `src/errors.ts` | `AppError` hierarchy → stable HTTP status + code |
| `src/routes/` | thin: parse → validate → call service → render |
| `src/middleware/` | cross-cutting: error mapping, later auth/logging |
| `src/services/` | all business logic, one verb per file (create when the first feature lands) |
| `test/unit/` · `test/integration/` | `bun:test`; integration boots a real server |

## Rules
- Routes hold zero logic. Logic → `src/services/<domain>/<verb>.ts`.
- Throw `AppError` subclasses only — never bare `Error`. Unknown errors return a generic 500 body.
- Zod at every external boundary: request bodies, query params, env, webhooks.
- New route → register it in `src/routes/<name>.ts` and call the registrar from `src/app.ts`.
- DB work arrives as `packages/db` (Drizzle schema only) — don't inline SQL here.
