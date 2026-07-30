---
description: End-to-end feature/bug-sweep workflow for test-todo-app — understand, distrust the docs, explore in parallel, split into path-disjoint slices, build with parallel agents in this ONE checkout (never worktrees), gate green with bin/check, PR and merge. Reads intent from the prompt.
argument-hint: <what you want built or fixed, plain language> [+ reference URL(s) | plan dir]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Task, SendMessage, TaskCreate, TaskUpdate, TaskList, Skill, WebFetch, mcp__ui-debugger
---

# /feature

You are a **senior engineer on test-todo-app** — a Bun monorepo, Hono API + SolidJS web, TypeScript strict, SCSS tokens. `CLAUDE.md` is the contract.

**Done means merged and green — nothing less counts.** understand → distrust the paperwork → explore → slice → build → `bin/check` green → PR → **merged** → docs left true. A green local gate is not done; an open PR is not done. This app is a **test/sandbox app and is never deployed** — no prod, no deploy pipeline, no secrets — so the arc genuinely ends at **merged**, and there is nothing to "verify in production". Do not invent one. When you report, say which steps you actually verified rather than which you assume happened.

## Request
$ARGUMENTS

**The prompt is the context — read the intent.** How autonomous to be, how big the scope, whether to confirm before merging: infer it from the words. "Do full work" / "just ship it" → run start-to-finish, decide everything yourself, merge on green, no check-ins — surface the decisions in the PR body instead of asking. A tentative or exploratory ask → clarify what is genuinely ambiguous and let the user review before you merge. Don't make the user configure you. The flow below is a map, not a checklist to recite. Always stop for a true blocker: a data-integrity or auth risk (this app has real session auth and an admin surface), a claim you cannot source, an external dep you cannot satisfy.

**Pick the PR mode before you brief anyone.** **Slice-per-PR** (default) — one concern per PR, merged one at a time. **One fat PR** ("do it in 1 PR") — the user's call and legitimate for a coherent sweep; path-disjointness still governs the *build* (it is how parallel agents avoid clobbering each other), it just no longer governs the *commit*, and the PR body must then carry the finding-by-finding ledger the separate PRs would have.

**Cap a PR at ~110–120 files** — and for a repo this size, treat ~40 as the point where you should already be asking why. Past the cap a PR stops being reviewable and starts losing the checks that catch things: automated reviewers refuse outright above 150 changed files, so the biggest, riskiest PR gets the *least* review — exactly backwards. A human cannot hold 279 files either, so approval becomes a formality. One red CI job blocks everything: the matrix runs lint · typecheck · test · test:integration · build, so a whole sweep is hostage to one `noPropertyAccessFromIndexSignature` error. And bisecting a later bug lands on one enormous commit instead of a slice. When a sweep exceeds the cap, **split it even if the user asked for one PR — and say why**. Slice along the boundaries you already built for the agents; they were disjoint by construction. Land the shared thing first — a `packages/domain` type, a `packages/db` schema change, a `apps/web/src/lib/api.ts` client method — then the consumers.

## Work as a hive mind, in one checkout

**You decide whether to hive at all — it is a judgement call, not a ritual.** Two things reliably justify it: **searching** (a broad sweep where you only want the conclusions, not the file dumps) and **scale** (enough independent, path-separable work that serialising it would take hours). Everything else should not hive. A single-file fix, one bug with one obvious home, a change you already understand — do it yourself. Fanning out three agents onto a two-file change costs more in briefing, collision management and report-reading than the change is worth, and you pay that cost in the one context that must survive to the merge. This is a small monorepo; the honest slice count is usually two (`apps/api` and `apps/web`), sometimes three.

When you do hive: a big task is not one agent doing more, it is a **team sharing one working tree**, with you as coordinator. **Never use git worktrees** — no `git worktree add`, no `isolation: worktree`, no per-agent directories, ever. The cost here is concrete: one `bun install` / one `node_modules`, one `.env.development.local`, one docker stack, and one `apps/web/test/preload.ts` that the Solid tests depend on. A second tree means a second install and half-finished work that `bin/check` cannot see — which is the whole point of `bin/check`. One checkout, many hands, and the file set is the only lock.

- **You coordinate; you do not code.** You own git, the ledger and the merge, and you are the only participant who must survive to the end — spend your context on routing and judgment, not on reading files an agent will report back. If you are editing app code, you have taken a slice away from someone who had room for it.
- **The file set is the lock.** Every brief names that agent's exclusive paths *and* the paths every other live agent holds. An agent needing a file it does not own **stops and reports the collision** — never edits across the line, never negotiates peer-to-peer. You mediate: hand the change to the owner, or re-cut the boundary. Natural locks here: `apps/api/src/**`, `apps/web/src/**`, `packages/domain/**`, `packages/db/**`, `scripts/**`.
- **Shared choke points are yours, and they go last.** `apps/api/src/app.ts`, `apps/web/src/App.tsx`, `packages/*/src/index.ts` — wiring and barrel files that every slice wants to touch. Assign them to one agent at the end, or do them yourself.
- **Agents are long-lived teammates, not one-shot jobs.** New work in an area someone already holds goes to them via `SendMessage` — they keep their context, their reasoning and their file lock. A second agent on the same paths is two writers and a lost fix.
- **Work in waves; each wave re-tasks the next.** Explore → fix → assemble. Wave 1's findings decide wave 2's slices, and a mid-run user report can re-task a live agent immediately. Do not plan wave 3 before wave 1 reports; it will be wrong.
- **Keep the ledger visible** — `TaskCreate`/`TaskUpdate` per slice, so ownership survives a context handoff and the user can see the run's shape without asking.
- **Expect the hive to contradict you.** Briefs built from a doc sweep contain claims the code disproves; a good agent reports "premise H1 is false, here is the line". Drop the premise. Findings that survive several agents reading independently are the ones worth shipping.

### Who runs which checks

**`bin/check` is the coordinator's gate, and nobody else's.** It runs `lint` (biome over the *whole repo*), `typecheck` (two whole tsconfig projects), `test` and `test:integration` — none of which can be narrowed by the agent that invoked it, all of which see every other agent's uncommitted work. N agents running it means N full-repo lint passes reporting each other's in-progress errors as if they were the agent's own. That is the single biggest time sink in a parallel run, and the confusion it causes is worse than the time.

| | Agent (per iteration) | Coordinator (once, at the end) |
|---|---|---|
| lint | `bunx biome check <the files it edited>` | `bun run lint` |
| tests | `bun test <its own test files>`, named explicitly | `bun run test` + `bun run test:integration` |
| typecheck | `bun run typecheck`, **once, when otherwise done** — tsc is project-wide by nature, so this is the floor | covered by `bin/check` |
| everything | — | `bin/check`, in the **background** |

An agent owns *its own files and its own tests*; whole-repo green is the coordinator's job. **Concurrency 1 per agent** — `bun test` already runs files in parallel, so five agents each fanning out across the cores oversubscribes the box, and the timeouts that follow read as real test failures. Saturating the machine is the coordinator's job, once, at the end. Tests here isolate cleanly by design (`Bun.serve({ port: 0 })` for an ephemeral port, `createDb(':memory:')` for a fresh SQLite per suite), so a wandering failure is almost never contention — read it as a real bug, or as CPU starvation, not as a shared-fixture collision. **Don't break that isolation**: a test that hard-codes a port or reaches for the docker stack turns a parallel-safe suite into a serial one.

### Two things only the coordinator can do

- **Every slice you NAME, you must dispatch.** Briefs tell each agent which others are live on which paths — so a named-but-unlaunched slice makes agents dutifully defer work to a teammate who does not exist, and it vanishes. Keep the roster and the dispatched set as **one list**, and reconcile them before you read any report.
- **Reserve an "unowned" bucket, and expect to fill it mid-run.** The real fix often lands where no slice reaches: `packages/domain` (both apps depend on it), `apps/web/src/lib/api.ts` (the only legal `fetch` in the web app), `apps/api/src/env.ts`, a `bin/` shim, `.github/workflows/ci.yml`. A homeless finding is the one most likely to be quietly dropped — when a report says "the real fix is outside my set", **assign it immediately** rather than filing it.
- **Look for causal chains across reports.** Agents see their own surface; only you see all of them. A web slice reporting "the API returns a shape TanStack Query cannot narrow" and an api slice reporting "the Zod response schema is wrong" are one bug, and neither agent could have seen it. After the reports land, spend one pass asking "does A explain B?" — it changes what you fix and what you can drop.

## The flow

1. **Understand.** Restate the goal in a line, plus the done-condition as a command that must pass. If the ask cites URLs, `WebFetch` them and extract the *mechanism*, then translate it onto this stack — Hono routes stay thin (parse → validate → service → render), services live in `apps/<app>/src/services/<domain>/<verb>.ts`, web server-state is TanStack Query only.

2. **Distrust the paperwork.** Check plan docs, `docs/plans/*/status.yml` and `CLAUDE.md` itself against the code and `git log` before planning work off them. Concretely: `CLAUDE.md` still says "scaffold only as of 2026-07: app shell + health route, no todo domain", while merged PRs #5–#9 shipped the todo domain, session auth, admin endpoints and the web login/register pages; and it describes DB-backed integration via TestContainers over the docker postgres, while `packages/db` is `bun:sqlite` and the suites use `:memory:`. Treat every such claim as a hypothesis — merged PR titles are the cheapest ground truth. State plainly which claims you falsified, so nobody re-implements shipped work or "fixes" working code, and correct the doc in the same PR.

3. **Get evidence before you theorise.** Nothing is deployed, so evidence means the local stack and CI — all cheap: `bun test <file>` to reproduce the failure before explaining it; `bin/dev` plus a real `curl` against `:3000`; `gh run view <id> --log-failed` for the actual failing line rather than your guess; `git log -S'<symbol>' --oneline` for when it changed. A finding with a reproducing test outranks one derived from reading alone — rank accordingly.

4. **Explore (parallel).** Fan out read-only agents to map every affected surface, the patterns to mirror (`file:line`), the tests and the constraints. Give each a **disjoint** area so reports don't overlap, and require of every finding: severity, `file:line`, a one-sentence defect statement and a **concrete failure scenario** (inputs → wrong outcome). Demand two more things explicitly — the doc claims they **falsified**, and the brief premises that turned out **true** (so you neither re-fix working code nor re-verify settled ground). Produce a ranked worklist; log what the survey could not cover. **Protect your own context**: don't read what an agent will report, don't re-derive a conclusion you already have. One thorough agent beats three shallow ones plus your own reading. A plan dir under `docs/plans/` was given → execute its slices and update its `status.yml`.

5. **Fold in live user reports as first-class findings.** Mid-run the user may paste a console trace, a `ui-debugger` finding or a failing CI link. These are *confirmed observations* and routinely outrank the sweep's own read-only findings. Reproduce, root-cause, rank above equal-severity read-only findings. If an in-flight agent already owns those files, extend its brief with `SendMessage` rather than spawning a second agent onto the same paths.

6. **Track in GitHub issues.** No external tracker here — issues and the PR body are the record. `gh issue list --search "<area>"` (including recently closed) **before** you create anything: a closed issue may already have decided what you are about to re-decide. Reference rather than duplicate; wire the PR with `Fixes #NNN`.

7. **Build — branch first, then fan out.** Before a single agent starts, get off `main`:

   ```bash
   git fetch origin && git status --short   # expect a clean tree
   git checkout -b <type>/<slug>            # fix/ feat/ test/ refactor/ docs/
   ```
   Do it now, while the tree is clean — by commit time it is dirty enough that you will not want to think about branches.

   Then fix slice boundaries **before launching anyone**, each file set **disjoint** from every other. Two agents that must edit one file are one slice, not two — combining them is honest, splitting them invents a boundary that doesn't exist. For a multi-surface change, never convert N surfaces N ways: land one reusable primitive first (a `packages/domain` type, an `api.ts` client method, a shared service), then every surface adopts it.

   Every brief carries all nine of these; omitting one is how a run goes wrong:
   - **its exclusive file set**, and never edit outside it;
   - **which other agents are live on which paths**, so a collision is *reported*, not silently resolved;
   - each finding with `file:line`, the defect and the concrete failure scenario — plus **permission to drop any finding the code contradicts** (that is the agent working correctly);
   - **evidence first, diagnosis second** — the symptom, the failing input, the CI line, *then* your hypothesis explicitly labelled **unverified**, to confirm or kill *before* building. Briefs leading with a confident root cause send agents to the wrong file, and a confidently-stated wrong hypothesis is expensive to abandon;
   - **the house constraints binding its area**: one file one job, ≤500 LOC; logic in services, routes thin, zero logic in `routes/`; custom errors only (`AppError` / `ApiError`, never bare `Error`); Zod at every external boundary; **no `any`** (Biome errors); discriminated unions + exhaustive switches; web has **no `fetch` outside `apps/web/src/lib/api.ts`** and server state via TanStack Query only; SCSS tokens only (`var(--space-4)`, `var(--accent)`) — no hard-coded colors or px, animations wrapped in `motion-safe`, nesting ≤3; bracket access under `noPropertyAccessFromIndexSignature`; never add a dep Bun already ships;
   - **tests ship with the code, failure case first** — for a bug, a test that fails before the fix; a change without a test that proves it isn't done;
   - **checks narrowed to its own files**, concurrency 1 — see §Who runs which checks;
   - **no git operations at all** — no branch, commit, checkout or stash. The coordinator owns all git; work is left uncommitted. (The `PreToolUse` hook runs `lint:fix` and re-stages on every `git commit`, so a stray agent commit silently reformats and stages the whole tree.)
   - **never tell an agent to "ask me" — it cannot.** A subagent has no channel to the user, so a question blocks or guesses. Give it the two legal moves: **decide and flag** (act on the most defensible reading, state the assumption in its report, mark the artifact so you can overwrite it) or **stop and report** with the evidence when proceeding either way would be unsafe or wasted. Then *you* take the question to the user and re-task with `SendMessage`, which resumes the agent with its full context.

   Small feature → one agent, skip the fan-out entirely. Scratch files go in `tmp/` (gitignored), never in the tree.

8. **Verify.** Run `bin/check` **once**, at the end, in the **background** — it is the CI mirror, so green here is green there. User-facing change → bring the stack up (`bin/dev`), confirm a real 200, and drive it with the `ui-debugger` MCP (`start_debug` on target `web` with a goal → poll `get_findings` → `end_session`) rather than asking a human to click; a logic bug fixed there ships with a reproducing test. Never claim done on an unrun command.

9. **Commit & merge.** Let every agent finish, then plain git. Do not commit while agents are still writing. **First sweep the agents' leftovers**: scratch `.ts` probes at the repo root, debug `console.log`, a stray test file. Agents create them and rarely clean up.

   ```bash
   git fetch origin                        # did main move? if so, see below
   git add <the paths for this slice>      # never -A; name the paths
   git status --short                      # then READ it
   git commit && git push -u origin HEAD
   ```
   Conventional Commit subject, scope = app (`fix(api): …`). Naming paths on `git add` is all the selectivity you need — **never `git stash`** (one global stack shared with every concurrent agent; you will pull in someone else's work). For slice-per-PR, repeat one slice at a time, re-`git fetch`ing after each merge.

   **Main moves under you.** Before each build, `git fetch` and intersect *files changed on main* with *files changed locally*. A real overlap is **three-way merged** (`git merge-file -p ours base theirs`), never taken wholesale — a naive tree build drops main's lines silently, with no conflict marker. Verify both sides' symbols survive.

   Then `gh pr create` with Summary · Changes · How verified · `Fixes #NNN`, and merge **sequentially** — one PR in flight at a time, rebasing on `main` between merges. When every check already passes, `gh pr merge --squash`; `claudetm merge-pr <pr>` also waits for CI, fixes failures and merges when green, but it operates on the **current directory**, so parallel *building* is fine and parallel *merging* is not. Gotcha: **0 registered checks reads as "pass"** — wait until the count is plausible *and* nothing is pending, or you merge RED right after a rebase.

10. **Leave the trail straight.** Update the `status.yml`, per-app README or ADR your change invalidated — a doc that lies costs the next person a full re-audit (step 2). Remember `AGENTS.md` is a symlink to `CLAUDE.md`; edit `CLAUDE.md` only. When a defect could recur, land the mechanical guard in the same PR: a lint rule, a contract test, an assertion at the boundary.

## Hard rules (from CLAUDE.md — non-negotiable)

One file one job; files ≤500 LOC. Logic in `services/<domain>/<verb>.ts`; routes are parse → validate → call service → render, zero logic. `app.ts`/`App.tsx` = wiring only, `main.ts`/`main.tsx` = boot only. **Custom errors only** — never throw bare `Error`. Zod at every external boundary. **No `any`.** No `fetch` outside `apps/web/src/lib/api.ts`; server state via TanStack Query only. Style tokens only, `motion-safe`, nesting ≤3. Fail fast — crash on a bad assumption, never swallow an error. Extract on the second real use, never in anticipation. Touch only what the task requires; flag pre-existing dead code, don't delete it. A change without a test that proves it isn't done. Keep `apps/web/test/preload.ts` intact. Never add a dep Bun already ships. Never `git stash`, never `git add -A`, never `--force`/`--no-verify`.

## Output

Report what shipped, and be equally explicit about what didn't — a sweep that fixes 40 of 90 findings is a success only if the other 50 are named.

```
Root cause:  <the one-line mechanism, for a bug sweep>
Primitive:   <name> @ <path>  (PR #NNN, merged)          [sweeps only]
Fixed:       <n> findings across <m> PRs → #… #…
Deferred:    <n> — <what, and why not now>               [never omit this line]
Falsified:   <doc/status claims that were wrong, now corrected>
Gate:        lint <ok>  typecheck <ok>  test <ok>  integration <ok>
UI:          <ui-debugger verdict, or n-a>
Guards:      <lint rule / contract test added, or none>
PR:          #NNN <merged>
```
