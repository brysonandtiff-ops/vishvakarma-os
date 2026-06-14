const DEBUG_SESSION_ID = '2e495c';
const TRACE_STORAGE_KEY = 'vish-auth-flow-trace';
const INGEST_URL = 'http://127.0.0.1:7686/ingest/cdb0a854-0724-4d15-96cb-d25c2ef763fe';

type AuthFlowTracePayload = {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
};

/** Session-scoped auth flow trace (survives OAuth redirect on production devices). */
export function authFlowTrace(payload: AuthFlowTracePayload) {
  const entry = {
    sessionId: DEBUG_SESSION_ID,
    timestamp: Date.now(),
    ...payload,
  };

  try {
    const prev = JSON.parse(sessionStorage.getItem(TRACE_STORAGE_KEY) ?? '[]') as unknown[];
    if (Array.isArray(prev)) {
      prev.push(entry);
      sessionStorage.setItem(TRACE_STORAGE_KEY, JSON.stringify(prev.slice(-50)));
    }
  } catch {
    // ignore storage failures
  }

  if (import.meta.env.DEV) {
    // #region agent log
    fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
      body: JSON.stringify(entry),
    }).catch(() => {});
    // #endregion
  }
}
