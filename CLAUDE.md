# test-todo-app

Bun monorepo: Hono API + SolidJS web, TypeScript strict, SCSS. **Test/sandbox app — never deployed.** No prod, no deploy pipeline, no secrets.
Scaffold only as of 2026-07: app shell + health route, no todo domain.

## Response Rules
- Execute. No preamble. No "I'll start by…". No restating the task.
- Lead with action or answer. Reasoning after, only if non-obvious.
- Parallel tool calls when independent.
- Read before speculating.
- Disagree when the user is wrong. State the correction.
- Terse. Fragments OK. Code/commands/paths stay exact.
- End summary: 1–2 sentences max.

## Coding Rules

### Think before coding
- State assumptions explicitly. Uncertain → ask, don't guess.
- Multiple interpretations → present them, don't pick silently.
- Simpler approach exists → say so.

### Simplicity first
- Minimum code that solves the stated problem. Nothing speculative.
- No abstraction for single-use code. No unrequested config/flexibility.
- No error handling for impossible cases.
- Extract on the **second** real use, never in anticipation.

### Surgical changes
- Touch only what the task requires. No drive-by refactors or reformatting.
- Match existing style.
- Remove only orphans YOUR change created. Pre-existing dead code: flag, don't delete.

### Goal-driven execution
- Convert every task to a verifiable goal before coding:
  - "Fix the bug" → reproducing test → make it pass
  - "Add validation" → tests for invalid inputs → make them pass
  - "Refactor X" → tests green before AND after
- Multi-step → plan as `step → verify: <command>`.
- Never claim done on an unrun command.

## Architecture (SOLID, SRP hardest)
- One file, one job. Files ≤500 LOC — split before that.
- Business logic → `apps/<app>/src/services/<domain>/<verb>.ts` (`creator.ts`, `updater.ts`).
- API routes thin: parse → validate → call service → render. Zero logic in `routes/`.
- `app.ts` / `App.tsx` = wiring only. `main.ts` / `main.tsx` = boot only.
- Custom errors only — `AppError` (`apps/api/src/errors.ts`), `ApiError` (`apps/web/src/lib/api.ts`). NEVER throw bare `Error`.
- Zod at every external boundary: requests, env (`apps/api/src/env.ts`), webhooks.
- No `any` (Biome errors). Discriminated unions + exhaustive switches.
- Fail fast: crash on a bad assumption, don't swallow errors.
- Duplicated logic on second use → lift to `packages/*` (cross-app) or `src/lib/` (in-app). Helpers stay SRP + unit-tested.
- Web: no `fetch` outside `apps/web/src/lib/api.ts`. Server state via TanStack Query only.
- Styles: tokens only (`var(--space-4)`, `var(--accent)`) — no hard-coded colors/px. Animations wrapped in the `motion-safe` mixin. Nesting ≤3.

## Commands
```bash
bin/setup              # deps → .env.development.local → docker services. Once, after clone.
bin/dev [api|web|all]  # api :3000 · web :5180 (strict port), /api/* proxied to the API
bin/check              # lint + typecheck + unit + integration — the gate. Before every commit.
bin/fmt                # auto-fix lint + format
bun run test                   # unit (api + web + scripts)
bun run test:integration       # api over real HTTP
bun test path/to/file.test.ts  # one file
bun run lint | typecheck | build
bun run help                   # script catalog
```

## Layout
```
apps/api/    Hono API — src/{main,app,env,errors}.ts · routes/ · middleware/ · services/   → apps/api/README.md
apps/web/    SolidJS SPA — src/{main,App}.tsx · lib/ · routes/ · components/ · styles/     → apps/web/README.md
packages/*                    # shared SRP packages: domain (pure types), db (schema only)
bin/{setup,dev,check,fmt}     # thin shims — real automation is Bun TS in scripts/
scripts/<resource>/<verb>.ts  # one verb per file; shared code in scripts/lib/ (≤200 LOC, unit-tested)
docker/docker-compose.yml     # postgres + dragonfly, local only
docs/                         # spec, plans, ADRs — see docs/README.md
.claude/                      # settings, hooks, commands
tmp/                          # gitignored scratch — put junk here, never in the tree
```

## Testing
- One runner: `bun test`. Solid components work via `apps/web/test/preload.ts` (happy-dom + babel-preset-solid) — keep that preload intact.
- Unit <10s. Integration boots a real server (`apps/api/test/integration/`) — don't mock what you can run. DB-backed integration → TestContainers, never mocks.
- A change without a test that proves it isn't done.

## Workflow
- `/initial-idea` → `docs/spec.md` + milestones. `/planx` → multi-file plan on disk. `/feature` → build, gate, PR.
- **No git worktrees.** Parallel agents share this checkout, disjoint file sets, one branch per feature.
- Commit hook runs `lint:fix` and re-stages — unlinted code cannot be committed.
- CI (`.github/workflows/ci.yml`): lint · typecheck · test · integration, parallel, cached, free GitHub runners. Same commands as `bin/check`.

## UI debugging (MCP)
- `ui-debugger` MCP drives a real browser, finds functional + visual bugs, reports findings. Use it instead of asking a human to click.
- Flow: `bin/dev` first → `start_debug` (target `web`, plus a goal) → poll `get_findings` → `end_session`.
- Config `.ui-debugger-mcp.json` (committed): target `web` → `http://localhost:5180`, workspace `tmp/ui-debugger-mcp/`.
- Models: driver `deepseek/deepseek-v4-flash#uptime` (fast agentic text, drives blind, $0.10/M in) · vision `qwen/qwen3-vl-32b-instruct` (the eyes) · summary `deepseek/deepseek-v4-flash`. Driver stuck on a hard flow → swap to `z-ai/glm-5.2` (8× the cost).
- Key + base URL live in `.mcp.json` — **gitignored**. Copy `.mcp.json.example`, paste an **OpenRouter** key. NEVER commit a key.
- One provider serves all three roles (`ConfigSchema` is a `strictObject`, no per-role base URL) → it must be OpenRouter. Verified 2026-07: the z.ai **coding plan is text-only** — images → `1210 content.type must be text`, GLM-5V-Turbo → `1311 plan lacks access`; z.ai pay-go → `1113 insufficient balance`. Vision is required for `look`.
- Vision benchmarked 2026-07, 4 runs each on a real screenshot (count cards · read a specific row label · judge alignment): `qwen3-vl-32b-instruct` 4/4, ~1.4s, 963 tok, $0.10/M in — replaced `glm-5v-turbo` (correct but ~6.6s, ~1.5k reasoning tokens, overflows `max_tokens` into an empty answer, $1.20/M in). `seed-1.6-flash` 4/4 but ~2.6s. `gemini-2.5-flash-lite` and `gemma-3-12b` miscounted elements — do not use.

## Where to look (load on demand)
- Per-app rules → `apps/api/README.md` · `apps/web/README.md`
- Docs layout, plan format → `docs/README.md`
- Script catalog → `bun run help`
- House standards → `../../developerz-ai/gold-standards-in-ai/docs/` · `../claude-code-bible/docs/`

## Conventions
- Env: `.env.development` committed (non-secret defaults) · `.env.development.local` gitignored, wins.
- `AGENTS.md` is a symlink to this file — edit this one only.
- TS `noPropertyAccessFromIndexSignature` is on → index/env access uses brackets; Biome's `useLiteralKeys` is off for that reason.
- Never add a dep Bun already ships (test runner, bundler, `.env` loader, SQLite, `$` shell).
