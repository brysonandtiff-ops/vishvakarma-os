import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('firebaseClient configuration', () => {
  it('documents Firebase env requirements and local-only fallback', () => {
    const source = read('src/backend/firebase/firebaseClient.ts');

    expect(source).toContain('VITE_FIREBASE_API_KEY');
    expect(source).toContain('VITE_FIREBASE_AUTH_DOMAIN');
    expect(source).toContain('VITE_FIREBASE_PROJECT_ID');
    expect(source).toContain('VITE_FIREBASE_APP_ID');
    expect(source).toContain('isFirebaseConfigured');
    expect(source).toContain('local-only mode');
  });
});
