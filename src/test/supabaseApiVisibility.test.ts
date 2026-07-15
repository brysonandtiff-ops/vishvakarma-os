import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && entry.name === 'test') return [];

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    if (!/\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    return [entryPath];
  });
}

describe('Supabase API visibility', () => {
  it('exposes REST/RLS only and removes graphql_public from API schemas', () => {
    const config = readFileSync(
      path.join(process.cwd(), 'supabase', 'config.toml'),
      'utf8',
    );

    expect(config).toContain('schemas = ["public"]');
    expect(config).not.toContain('graphql_public');
  });

  it('does not ship a GraphQL client or direct GraphQL endpoint usage', () => {
    const packageJson = readFileSync(
      path.join(process.cwd(), 'package.json'),
      'utf8',
    );
    const productionSource = listSourceFiles(path.join(process.cwd(), 'src'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(packageJson).not.toMatch(/"(?:graphql|@apollo\/client|urql)"\s*:/);
    expect(productionSource).not.toContain('/graphql/v1');
    expect(productionSource).not.toContain('ApolloClient');
  });
});
