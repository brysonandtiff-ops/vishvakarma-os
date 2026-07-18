import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type TypeScriptConfig = {
  compilerOptions?: {
    module?: string;
    moduleResolution?: string;
  };
};

function readText(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Vercel API runtime module boundary', () => {
  it('emits standalone API functions as CommonJS for the api package runtime', () => {
    const rootConfig = JSON.parse(readText('tsconfig.json')) as TypeScriptConfig;
    const apiPackage = JSON.parse(readText('api/package.json')) as { type?: string };

    expect(rootConfig.compilerOptions?.module).toBe('CommonJS');
    expect(rootConfig.compilerOptions?.moduleResolution).toBe('Node');
    expect(apiPackage.type).toBe('commonjs');
  });

  it('keeps the browser and Vite configs on ES modules', () => {
    for (const configPath of ['tsconfig.app.json', 'tsconfig.node.json']) {
      const source = readText(configPath);
      expect(source).toMatch(/"module"\s*:\s*"ESNext"/);
      expect(source).toMatch(/"moduleResolution"\s*:\s*"bundler"/);
    }
  });
});
