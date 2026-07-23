# @todo/web

SolidJS SPA on Vite, styled with SCSS. A todo app: add, complete, rename (double-click), delete, and filter by All/Active/Completed, with a live total/active/done count.

## Run
```bash
bin/dev web                        # vite on :5180, /api/* proxied to :3000
bun run --filter @todo/web build   # production bundle → dist/
bun run --filter @todo/web test    # bun:test + happy-dom + solid testing-library
```

SPA, not SSR: this app sits behind no crawler that matters. SSR is only for public SEO pages — that would be a separate app.

## Layout
| Path | Job |
|---|---|
| `src/main.tsx` | mount only |
| `src/App.tsx` | providers + router wiring |
| `src/lib/routes.ts` | lazy route table — one entry per route file |
| `src/lib/api.ts` | the only place `fetch` is called; throws `ApiError` |
| `src/lib/query.ts` | TanStack Query client (server state) |
| `src/lib/theme.ts` | theme helpers + persistence |
| `src/routes/` | one file per route, default-exported — `Todos.tsx` (the app, `/` redirects here), `Home.tsx`, `NotFound.tsx` |
| `src/components/` | SRP components; `TodoForm`, `TodoList`, `TodoItem`, `TodoFilters`, `TodoStats` — presentational only |
| `src/styles/` | `_tokens` → `_reset` → `_base` → `_components`, entry `index.scss` |

## Rules
- No `fetch` outside `lib/api.ts`. Server state via TanStack Query — never a hand-rolled cache.
- Styling through tokens: `var(--space-4)`, `var(--accent)`. No hard-coded colors or px.
- Colors are RGB channels (`--c-accent`) so alpha variants cost nothing: `rgb(var(--c-accent) / 0.12)`.
- Dark mode is automatic (`prefers-color-scheme`); `data-theme` on `<html>` overrides it.
- Every animation/transition sits inside the `motion-safe` mixin.
- Nesting ≤3 levels. `&__element` / `&.is-state`. Shared patterns → a mixin in `_mixins.scss`.
- New route = new file in `src/routes/` + one row in `ROUTE_TABLE`.
