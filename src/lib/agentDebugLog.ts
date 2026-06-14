const DEBUG_SESSION_ID = '2e495c';
const DEBUG_STORAGE_KEY = 'vish-debug-2e495c';
const INGEST_URL = 'http://127.0.0.1:7686/ingest/cdb0a854-0724-4d15-96cb-d25c2ef763fe';

type AgentDebugPayload = {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
  runId?: string;
};

/** Debug-mode logger: persists to sessionStorage (production-safe) and POSTs to local ingest when available. */
export function agentDebugLog(payload: AgentDebugPayload) {
  const entry = {
    sessionId: DEBUG_SESSION_ID,
    timestamp: Date.now(),
    ...payload,
  };

  try {
    const prev = JSON.parse(sessionStorage.getItem(DEBUG_STORAGE_KEY) ?? '[]') as unknown[];
    if (Array.isArray(prev)) {
      prev.push(entry);
      sessionStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(prev.slice(-40)));
    }
  } catch {
    // ignore storage failures
  }

  // #region agent log
  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
    body: JSON.stringify(entry),
  }).catch(() => {});
  // #endregion
}
