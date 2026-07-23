// Flag parsing for scripts. One job: argv → { flags, positionals }.
export type Flags = Record<string, string | boolean>;

export interface ParsedArgs {
  flags: Flags;
  positionals: string[];
}

/** `--key=value` · `--key value` · `--bool` · everything else positional. */
export function parseArgs(argv: string[]): ParsedArgs {
  const flags: Flags = {};
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === undefined) continue;
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const body = token.slice(2);
    const eq = body.indexOf('=');
    if (eq !== -1) {
      flags[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[body] = next;
      i++;
    } else {
      flags[body] = true;
    }
  }

  return { flags, positionals };
}
