#!/usr/bin/env node

export async function probeHttp(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const expectStatus = options.expectStatus ?? 200;
  const accept = options.accept ?? 'application/json,*/*';
  const started = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        Accept: accept,
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
      redirect: options.followRedirects === false ? 'manual' : 'follow',
    });

    const latencyMs = Date.now() - started;
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      bodyText = '';
    }

    let json = null;
    if (bodyText) {
      try {
        json = JSON.parse(bodyText);
      } catch {
        json = null;
      }
    }

    return {
      ok: response.status === expectStatus,
      url,
      status: response.status,
      latencyMs,
      bodyText: bodyText.slice(0, 500),
      json,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: 0,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
      bodyText: '',
      json: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeMany(targets, options = {}) {
  const results = [];
  for (const target of targets) {
    const result = await probeHttp(target.url, { ...options, ...target });
    results.push({ name: target.name, ...result });
  }
  return results;
}
