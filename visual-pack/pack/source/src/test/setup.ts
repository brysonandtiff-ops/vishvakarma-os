import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver for components that use it (like Slider)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock WebSocket to prevent Node 24 / JSDOM Event class conflicts in tests
class MockWebSocket extends EventTarget {
  url: string;
  readyState = 0; // CONNECTING

  private _onopen: any = null;
  private _onclose: any = null;
  private _onmessage: any = null;
  private _onerror: any = null;

  constructor(url: string) {
    super();
    this.url = url;
    setTimeout(() => {
      this.readyState = 3; // CLOSED
      const errorEvent = new Event('error');
      this.dispatchEvent(errorEvent);
      if (this._onerror) this._onerror(errorEvent);
      const closeEvent = new Event('close');
      this.dispatchEvent(closeEvent);
      if (this._onclose) this._onclose(closeEvent);
    }, 5);
  }

  get onopen() { return this._onopen; }
  set onopen(val) { this._onopen = val; }

  get onclose() { return this._onclose; }
  set onclose(val) { this._onclose = val; }

  get onmessage() { return this._onmessage; }
  set onmessage(val) { this._onmessage = val; }

  get onerror() { return this._onerror; }
  set onerror(val) { this._onerror = val; }

  send(data: any) {
    // No-op or log
  }

  close() {
    this.readyState = 3; // CLOSED
    const closeEvent = new Event('close');
    this.dispatchEvent(closeEvent);
    if (this._onclose) this._onclose(closeEvent);
  }
}

globalThis.WebSocket = MockWebSocket as any;

