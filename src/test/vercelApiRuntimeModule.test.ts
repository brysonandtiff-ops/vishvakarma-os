import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type TypeScriptConfig = {
  compilerOptions?: {
    module?: string;
    moduleResolution?: string;
  };
};

describe('Vercel API runtime module boundary', () => {
  it('emits standalone API functions as CommonJS for the api package runtime', () => {
    const rootConfig = JSON.parse(
      readFileSync(join(process.cwd(), 'tsconfig.json'), 'utf8'),
    ) as TypeScriptConfig;
    const apiPackage = JSON.parse(
      readFileSync(join(process.cwd(), 'api', 'package.json'), 'utf8'),
    ) as { type?: string };

    expect(rootConfig.compilerOptions?.module).toBe('CommonJS');
    expect(rootConfig.compilerOptions?.moduleResolution).toBe('Node');
    expect(apiPackage.type).toBe('commonjs');
  });

  it('keeps the browser and Vite configs on ES modules', () => {
    for (const configPath of ['tsconfig.app.json', 'tsconfig.node.json']) {
      const config = JSON.parse(
        readFileSync(join(process.cwd(), configPath), 'utf8'),
      ) as TypeScriptConfig;
      expect(config.compilerOptions?.module).toBe('ESNext');
      expect(config.compilerOptions?.moduleResolution).toBe('bundler');
    }
  });
});
