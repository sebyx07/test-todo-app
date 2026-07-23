# test-todo-app

Bun monorepo scaffold, set up AI-first. Test app — **never deployed**. No todo features yet: this is the base.

## Quickstart
```bash
bin/setup       # deps + .env.development.local + docker services
bin/dev         # api :3000 · web :5180
bin/check       # lint + typecheck + unit + integration
```

## Stack
| Layer | Choice |
|---|---|
| Runtime | Bun 1.3 |
| Language | TypeScript strict — no `any`, no implicit index access |
| API | Hono + Zod |
| Web | SolidJS SPA + Vite + `@solidjs/router` + TanStack Solid Query |
| Styling | SCSS — token maps → CSS custom properties, auto dark mode |
| Lint + format | Biome (one binary, replaces ESLint + Prettier) |
| Tests | `bun:test` everywhere, incl. Solid components (happy-dom + babel-preset-solid) |
| Local data | Postgres 18 + Dragonfly via `docker/docker-compose.yml` |
| CI | GitHub Actions, free runners — lint · typecheck · unit · integration in parallel, cached |

## Layout
```
apps/api/       Hono API — health route only          → apps/api/README.md
apps/web/       SolidJS shell — header, theme, cards  → apps/web/README.md
packages/       shared SRP packages (empty)
bin/            setup · dev · check · fmt
scripts/        Bun TS automation; scripts/lib/ is the shared, tested brain
docker/         local postgres + dragonfly
docs/           spec, plans, ADRs                     → docs/README.md
.claude/        settings, hooks, slash commands
```

## AI-first bits
- `CLAUDE.md` — the contract every agent reads: response rules, coding rules, architecture, exact commands. `AGENTS.md` symlinks to it.
- `.claude/commands/` — `/initial-idea` (spec) → `/planx` (multi-file plan on disk) → `/feature` (build → gate → PR).
- `.claude/settings.json` — broad allow-list so the agent runs `bin/*`, `bun`, `git`, `gh` without prompts.
- `.claude/hooks/pre-commit.ts` — lint-fixes and re-stages before any `git commit`. Unlinted code can't land.
- Per-app `README.md` — rules live next to the code they govern.
- `tmp/` — gitignored scratch space for agents.

Conventions come from [gold-standards-in-ai](../../developerz-ai/gold-standards-in-ai) and [claude-code-bible](../claude-code-bible).
