export interface DraftSaveWorkerRequest {
  type: 'save';
  key: string;
  json: string;
}

self.onmessage = (event: MessageEvent<DraftSaveWorkerRequest>) => {
  if (event.data.type !== 'save') return;
  try {
    self.localStorage.setItem(event.data.key, event.data.json);
    self.postMessage({ ok: true });
  } catch {
    self.postMessage({ ok: false });
  }
};
