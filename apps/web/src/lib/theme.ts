// Theme choice: pure helpers + one persistence point. UI reads/writes via ThemeToggle.
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'todo:theme';

export function nextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}

export function systemTheme(): Theme {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function storedTheme(): Theme | null {
  const value = globalThis.localStorage?.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

export function initialTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme;
  globalThis.localStorage?.setItem(STORAGE_KEY, theme);
}
