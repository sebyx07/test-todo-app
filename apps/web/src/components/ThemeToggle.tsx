// Owns the theme signal; all logic lives in lib/theme.ts.

import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';
import type { Theme } from '../lib/theme';
import { applyTheme, initialTheme, nextTheme } from '../lib/theme';

export const ThemeToggle: Component = () => {
  const [theme, setTheme] = createSignal<Theme>('light');

  onMount(() => {
    const current = initialTheme();
    setTheme(current);
    applyTheme(current);
  });

  const toggle = (): void => {
    const target = nextTheme(theme());
    setTheme(target);
    applyTheme(target);
  };

  return (
    <button
      type="button"
      class="btn"
      onClick={toggle}
      aria-label={`switch to ${nextTheme(theme())} theme`}
    >
      {theme() === 'dark' ? '☾' : '☀'}
      <span class="sr-only">theme</span>
    </button>
  );
};
