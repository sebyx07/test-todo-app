---
description: Write a multi-file implementation plan to docs/plans/<YYYY>/<MM>/<DD>/<1NN>-<slug>/ for another agent to execute
argument-hint: [what you want planned]
allowed-tools: Write, Read, Glob, Grep, Task, Bash
---

# /planx

Plan only. Zero source edits. The executor gets the plan files and the code they cite — nothing else.

## Goal
$ARGUMENTS

## Steps

1. **Resolve path.** `date +%Y/%m/%d`. `Glob docs/plans/<YYYY>/<MM>/<DD>/1*` → next = highest `1NN` + 1, else `101`. Slug kebab-case, ≤5 words.

2. **Explore (read-only).** `Task` subagent_type=Explore, thoroughness="very thorough". Return files-to-touch as `file:line`, existing patterns to mirror, shared types/contracts, current tests. Cite real locations — never guess. **No worktrees**; read this checkout.

3. **Write multiple files** — `overview.md` + one `<NN>-<aspect>.md` per separable area (data model, service, routes, ui, tests). Never one `plan.md`.

   `overview.md`: `## Goal` (1–3 sentences) · `## Context` (stack facts + reference patterns as `path:line`) · `## Plan files (execute in order)` · `## Done when` (verifiable: commands that must pass) · `## Risks / open questions`.

   Each slice: `> Part of overview.md. Depends on: <NN>` · `## Files to change` (path — new/edit, why) · `## Steps` (each with `→ verify: <command>`) · `## Tests` (exact `bun test <path>`) · `## Done when`.

4. **Write `status.yml`** — the only tracker:

```yaml
plan: <1NN>-<slug>
title: <title>
status: not_started        # not_started | in_progress | blocked | complete | superseded
created_by: <git config user.name>
worked_by: ""              # executor claims by setting their git user.name
percent: 0
current_focus: ""
slices:
  - { file: 01-<aspect>.md, status: not_started, percent: 0 }
evidence: []
last_updated: <YYYY-MM-DD>
```

## Rules
- Reference, don't paste. `path:line`, `Class#method`. Pasted code goes stale.
- Self-contained per slice. Compact English, fragments over essays.
- No checkboxes in slices. `status.yml` tracks; nothing else does.
- Assume `CLAUDE.md` conventions — never restate them.
- Slice by responsibility (SRP), so parallel executors touch disjoint files.
- Every step carries a `verify:` command.

## Output
```
✓ docs/plans/<YYYY>/<MM>/<DD>/<1NN>-<slug>/{overview.md, 01-…, status.yml}
Next: run an executor on overview.md.
```
