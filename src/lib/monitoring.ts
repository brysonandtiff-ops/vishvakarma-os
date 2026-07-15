import { logger } from '@/lib/logger';

type SentryModule = typeof import('@sentry/react');

type MonitoringContext = Record<string, unknown>;

let sentryInitialized = false;
let sentryApi: SentryModule | null = null;
let initializationPromise: Promise<SentryModule | null> | null = null;

const SENSITIVE_KEY_PATTERN =
  /token|password|secret|authorization|cookie|credential|session|jwt/i;
const SENSITIVE_VALUE_PATTERN =
  /^(?:Bearer\s+)?(?:eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]{16,}|sk_(?:live|test)_[A-Za-z0-9]{16,})$/i;

export function redactMonitoringUrl(value: string): string {
  try {
    const url = new URL(value, window.location.origin);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (SENSITIVE_VALUE_PATTERN.test(value.trim())) return '[redacted]';
  return value.length > 500 ? `${value.slice(0, 500)}…` : value;
}

export function sanitizeMonitoringContext(
  context: MonitoringContext | undefined,
): MonitoringContext | undefined {
  if (!context) return undefined;

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : sanitizeValue(value),
    ]),
  );
}

function tracesSampleRate() {
  const configured = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.05);
  if (!Number.isFinite(configured)) return 0.05;
  return Math.min(Math.max(configured, 0), 0.2);
}

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || !import.meta.env.PROD || sentryInitialized || initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        enabled: true,
        sendDefaultPii: false,
        tracesSampleRate: tracesSampleRate(),
        beforeSend(event) {
          if (event.request?.url) {
            event.request.url = redactMonitoringUrl(event.request.url);
          }
          if (event.request?.headers) {
            event.request.headers = {};
          }
          if (event.user) {
            event.user = event.user.id ? { id: event.user.id } : undefined;
          }
          if (event.extra) {
            event.extra = sanitizeMonitoringContext(event.extra) ?? {};
          }
          return event;
        },
        beforeBreadcrumb(breadcrumb) {
          if (breadcrumb.data?.url && typeof breadcrumb.data.url === 'string') {
            breadcrumb.data.url = redactMonitoringUrl(breadcrumb.data.url);
          }
          if (breadcrumb.data) {
            breadcrumb.data = sanitizeMonitoringContext(breadcrumb.data) ?? {};
          }
          return breadcrumb;
        },
      });

      sentryApi = Sentry;
      sentryInitialized = true;
      logger.info('Monitoring initialized (Sentry)');
      return Sentry;
    })
    .catch((error) => {
      logger.warn('Monitoring initialization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    });

  return initializationPromise;
}

export function captureException(error: unknown, context?: MonitoringContext) {
  const safeContext = sanitizeMonitoringContext(context);

  if (sentryApi) {
    sentryApi.captureException(error, { extra: safeContext });
  } else if (initializationPromise) {
    void initializationPromise.then((Sentry) => {
      Sentry?.captureException(error, { extra: safeContext });
    });
  }

  logger.error('Captured exception', {
    error: error instanceof Error ? error.message : String(error),
    ...safeContext,
  });
}
