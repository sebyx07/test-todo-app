// Subprocess helpers. One job: run a command, return or throw on its exit code.
export class CommandError extends Error {
  constructor(
    readonly command: string[],
    readonly exitCode: number,
    readonly stderr: string,
  ) {
    super(`command failed (${exitCode}): ${command.join(' ')}`);
    this.name = 'CommandError';
  }
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function run(command: string[], cwd?: string): Promise<CommandResult> {
  const proc = Bun.spawn(command, {
    ...(cwd === undefined ? {} : { cwd }),
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  return { exitCode: await proc.exited, stdout, stderr };
}

export async function runOrThrow(command: string[], cwd?: string): Promise<string> {
  const result = await run(command, cwd);
  if (result.exitCode !== 0) throw new CommandError(command, result.exitCode, result.stderr);
  return result.stdout;
}
