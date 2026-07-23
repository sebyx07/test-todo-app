// Leveled console logging for scripts. One job: format + gate by LOG_LEVEL.
const LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type Level = (typeof LEVELS)[number];

const threshold = (): number => {
  const configured = (process.env['LOG_LEVEL'] ?? 'info') as Level;
  const index = LEVELS.indexOf(configured);
  return index === -1 ? 1 : index;
};

const emit = (level: Level, args: unknown[]): void => {
  if (LEVELS.indexOf(level) < threshold()) return;
  const prefix = { debug: '·', info: '▸', warn: '!', error: '✖' }[level];
  console.error(prefix, ...args);
};

export const log = {
  debug: (...args: unknown[]): void => emit('debug', args),
  info: (...args: unknown[]): void => emit('info', args),
  warn: (...args: unknown[]): void => emit('warn', args),
  error: (...args: unknown[]): void => emit('error', args),
  ok: (...args: unknown[]): void => console.error('✔', ...args),
};
