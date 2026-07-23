#!/usr/bin/env bun
// PreToolUse(Bash) gate: lint-fix + restage before any `git commit`. Unlinted code cannot be committed.
// Exit 0 = allow, exit 2 = block the tool call.
interface HookInput {
  tool_input?: { command?: string };
}

const input = (await Bun.stdin.json().catch(() => ({}))) as HookInput;
const command = input.tool_input?.command ?? '';

if (!/\bgit\s+(-\S+\s+)*commit\b/.test(command)) process.exit(0);

const lint = Bun.spawnSync(['bun', 'run', 'lint:fix'], { stdout: 'inherit', stderr: 'inherit' });
if (lint.exitCode !== 0) {
  console.error('lint:fix failed — fix the reported errors, then commit again.');
  process.exit(2);
}

Bun.spawnSync(['git', 'add', '-u'], { stdout: 'inherit', stderr: 'inherit' });
process.exit(0);
