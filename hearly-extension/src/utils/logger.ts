const isDev =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
    ? false
    : true;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[Hearly]', ...args);
  },
  log: (...args: unknown[]) => {
    if (isDev) console.log('[Hearly]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info('[Hearly]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[Hearly]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[Hearly]', ...args);
  },
};
