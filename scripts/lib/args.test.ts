import { describe, expect, it } from 'bun:test';
import { parseArgs } from './args';

describe('parseArgs', () => {
  it('parses --key=value', () => {
    expect(parseArgs(['--name=todo']).flags).toEqual({ name: 'todo' });
  });

  it('parses --key value', () => {
    expect(parseArgs(['--name', 'todo']).flags).toEqual({ name: 'todo' });
  });

  it('treats a trailing flag as boolean', () => {
    expect(parseArgs(['--force']).flags).toEqual({ force: true });
  });

  it('collects positionals', () => {
    expect(parseArgs(['list', 'extra', '--force']).positionals).toEqual(['list', 'extra']);
  });

  it('consumes the next token as a flag value', () => {
    const { flags, positionals } = parseArgs(['list', '--limit', '5']);

    expect(flags).toEqual({ limit: '5' });
    expect(positionals).toEqual(['list']);
  });
});
