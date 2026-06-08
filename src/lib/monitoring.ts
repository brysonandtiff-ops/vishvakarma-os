import { logger } from '@/lib/logger';

let sentryInitialized = false;

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || sentryInitialized) return;

  logger.info('Monitoring configured (Sentry DSN present — wire @sentry/react when adding dependency)');
  sentryInitialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  logger.error('Captured exception', {
    error: error instanceof Error ? error.message : String(error),
    ...context,
  });
}
