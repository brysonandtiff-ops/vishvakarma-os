type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = context ? { message, ...context } : { message };
  if (level === 'error') {
    console.error(`[Vishvakarma.OS] ${message}`, payload);
    return;
  }
  if (level === 'warn') {
    console.warn(`[Vishvakarma.OS] ${message}`, payload);
    return;
  }
  if (import.meta.env.DEV) {
    console[level](`[Vishvakarma.OS] ${message}`, payload);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
};
