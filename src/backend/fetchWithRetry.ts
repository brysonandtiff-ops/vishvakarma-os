// P3: Extended fetchWithRetry with AbortController signal support and a
// per-attempt timeout. Callers can pass an external signal (e.g. from a
// useEffect cleanup) to cancel in-flight requests when a component unmounts.
// AbortErrors are never retried — they propagate immediately.

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Optional external AbortSignal. If aborted, the current attempt is
   *  cancelled immediately and no further retries are made. */
  signal?: AbortSignal;
  /** Per-attempt timeout in milliseconds. Defaults to 30 000 ms.
   *  If an attempt exceeds this, it is aborted and retried (up to maxAttempts). */
  timeoutMs?: number;
}

export async function fetchWithRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 300;
  const maxDelayMs = options.maxDelayMs ?? 4000;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const externalSignal = options.signal;

  // Throw immediately if the caller already aborted before we even start.
  if (externalSignal?.aborted) {
    throw new DOMException('Aborted before first attempt', 'AbortError');
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Bail out if the external signal was aborted between retries.
    if (externalSignal?.aborted) {
      throw new DOMException('Request aborted by caller', 'AbortError');
    }

    // Compose a per-attempt controller that merges the external signal with
    // the per-attempt timeout. This ensures:
    //   1. The operation is cancelled if the caller aborts (navigation away).
    //   2. The operation is cancelled if it exceeds timeoutMs.
    const attemptController = new AbortController();
    const timeoutId = setTimeout(() => attemptController.abort(), timeoutMs);

    // Forward the external abort signal into the per-attempt controller.
    const onExternalAbort = () => attemptController.abort();
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const result = await operation(attemptController.signal);
      return result;
    } catch (error) {
      lastError = error;

      // Never retry an intentional abort from the caller.
      if (
        error instanceof DOMException &&
        error.name === 'AbortError' &&
        externalSignal?.aborted
      ) {
        throw error;
      }

      if (attempt === maxAttempts) break;

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Operation failed after retries');
}

/**
 * Convenience wrapper: creates an AbortController and returns both the
 * controller and a pre-bound cleanup function for use in useEffect.
 *
 * @example
 * useEffect(() => {
 *   const { signal, cleanup } = createAbortCleanup();
 *   fetchWithRetry((s) => fetch('/api/ai/extract', { signal: s }), { signal });
 *   return cleanup;
 * }, []);
 */
export function createAbortCleanup(): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cleanup: () => controller.abort(),
  };
}
