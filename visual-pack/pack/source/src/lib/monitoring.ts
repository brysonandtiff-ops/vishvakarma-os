import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

let sentryInitialized = false;

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || sentryInitialized) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.1,
  });

  sentryInitialized = true;
  logger.info('Monitoring initialized (Sentry)');
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (sentryInitialized) {
    Sentry.captureException(error, { extra: context });
  }

  logger.error('Captured exception', {
    error: error instanceof Error ? error.message : String(error),
    ...context,
  });
}
