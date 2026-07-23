---
description: Ship a feature end to end — explore, build with tests, green gate, PR, merge
argument-hint: <what to build> [+ reference URL(s) | plan dir]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch
---

# /feature

Read `CLAUDE.md` first. Stack: Bun + Hono + TypeScript strict.

## Request
$ARGUMENTS

Read autonomy from the prompt: "just ship it" → run start to finish, decide, surface decisions in the PR body. Tentative ask → clarify the genuinely ambiguous, stop before merge. Always stop for: irreversible prod action, data-integrity or auth risk, a claim you can't source.

## No worktrees
Never `git worktree add` or `isolation: worktree`. Parallel agents share this checkout.

| Rule | Why |
|---|---|
| One branch per feature; all agents commit into it | no cross-tree merges |
| One file owner per agent, disjoint paths | two agents never edit one file |
| Re-read a file before editing | a sibling may have touched it |
| Shared index/registry files edited **last**, by one agent | choke points |
| Never `git checkout` / `git stash` under a sibling | moves the tree out from under them |

## Flow
1. **Restate** the goal in one line + the done-condition as a command that must pass.
2. **Explore in parallel** — read-only `Task` agents map affected surfaces → worklist in PR-sized batches. A plan dir under `docs/plans/` was given → execute its slices, update `status.yml`.
3. **Branch** — `git checkout -b <type>/<slug>` off `main`.
4. **Build** — tests first where the task allows (bug → reproducing test; validation → invalid-input tests). SRP: one file one job, ≤500 LOC, logic in services, routes thin, custom errors only, Zod at every boundary.
5. **Verify** — `bin/check` green. Never claim done on an unrun command.
6. **PR** — Conventional Commit subject, `gh pr create` with Summary · Changes · How verified · `Fixes #NNN`.
7. **Merge sequentially** — one at a time; rebase on `main` between merges. Confirm CI green first.

## Output
```
Branch:  <name>
Changed: <files>
Gate:    lint <ok>  typecheck <ok>  test <ok>
PR:      <url>
```
