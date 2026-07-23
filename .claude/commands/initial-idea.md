---
description: Turn one paragraph into docs/spec.md plus a milestone list
argument-hint: <one paragraph describing the product>
allowed-tools: Read, Write, Glob, Bash
---

# /initial-idea

Spec only. No code, no plans.

## Idea
$ARGUMENTS

## Steps
1. Write `docs/spec.md` with exactly these sections:

| Section | Contents |
|---|---|
| Problem | one paragraph — what hurts, for whom |
| Users | who uses it + their one core job |
| Core flows | 3–5 bullets, happy path only |
| Data model sketch | entities + key fields + relations (no DDL) |
| Tech choices | defaults from `CLAUDE.md`; list **deviations only** |
| Out of scope | what we're explicitly not building yet |

2. Propose milestones (epics) as a numbered list at the end — each one `/planx`-able on its own.
3. Ask before writing if `docs/spec.md` already exists.

## Output
```
✓ docs/spec.md
Milestones: <n> — next: /planx <milestone 1>
```
