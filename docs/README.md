# Docs

`CLAUDE.md` = execution (commands, conventions, read every session). `docs/` = context (read on demand).

| Path | Holds |
|---|---|
| `spec.md` | product spec — written by `/initial-idea` |
| `plans/<YYYY>/<MM>/<DD>/<1NN>-<slug>/` | multi-file execution plans — written by `/planx` |
| `decisions/` | ADRs, one per decision, `NNN-<slug>.md` |

## Plan layout
```
docs/plans/2026/07/23/101-<slug>/
├── overview.md        # index: goal, context, slice order, done-when
├── 01-<aspect>.md     # one separable area, independently executable
└── status.yml         # the ONLY tracker — no checkboxes in slices
```

## Rules
- Reference code as `path:line`, never paste it — pasted code goes stale.
- Date load-bearing claims (`As of 2026-07`).
- Delete a stale doc rather than letting it rot. A wrong doc costs more than a missing one.
- Conventions come from the standards repos → see `CLAUDE.md`.
