#!/usr/bin/env bun
// Catalog of every runnable script. Keep this the single discovery point: `bun run help`.
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SCRIPTS_DIR = new URL('.', import.meta.url).pathname;

const BIN = [
  ['bin/setup', 'deps → env → docker services. Run once after clone.'],
  ['bin/dev [api|web|all]', 'api :3000 · web :5180, hot reload'],
  ['bin/check', 'lint + typecheck + tests — the CI gate, locally'],
  ['bin/fmt', 'auto-fix formatting + lint'],
] as const;

async function scriptFiles(): Promise<string[]> {
  const entries = await readdir(SCRIPTS_DIR, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'lib') continue;
    for (const file of await readdir(join(SCRIPTS_DIR, entry.name))) {
      if (file.endsWith('.ts')) found.push(`scripts/${entry.name}/${file}`);
    }
  }
  return found.sort();
}

console.log('Commands\n');
for (const [name, description] of BIN) console.log(`  ${name.padEnd(24)} ${description}`);

const files = await scriptFiles();
console.log('\nScripts');
if (files.length === 0) {
  console.log('  (none yet — add scripts/<resource>/<verb>.ts, shared code in scripts/lib/)');
} else {
  for (const file of files) console.log(`  bun ${file}`);
}
