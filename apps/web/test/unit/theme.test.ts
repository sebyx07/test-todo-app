import { describe, expect, it } from 'bun:test';
import { nextTheme } from '../../src/lib/theme';

describe('nextTheme', () => {
  it('flips dark to light', () => {
    expect(nextTheme('dark')).toBe('light');
  });

  it('flips light to dark', () => {
    expect(nextTheme('light')).toBe('dark');
  });
});
