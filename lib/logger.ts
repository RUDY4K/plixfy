type Level = 'debug' | 'info' | 'warn' | 'error';

const ENABLED = process.env.NODE_ENV !== 'production';

function emit(level: Level, args: unknown[]): void {
  if (!ENABLED && level !== 'error' && level !== 'warn') return;
  const fn =
    level === 'error'
      ? // eslint-disable-next-line no-console
        console.error
      : level === 'warn'
        ? // eslint-disable-next-line no-console
          console.warn
        : // eslint-disable-next-line no-console
          console.log;
  fn(`[playhub:${level}]`, ...args);
}

export const log = {
  debug: (...args: unknown[]) => emit('debug', args),
  info: (...args: unknown[]) => emit('info', args),
  warn: (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args),
};
