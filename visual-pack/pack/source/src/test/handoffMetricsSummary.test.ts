import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

const summary = read('docs/handoff/HANDOFF_METRICS_SUMMARY.md');
const operatorTemplate = read('docs/handoff/templates/OPERATOR_ANNEX.template.md');

describe('handoff metrics summary', () => {
  it('keeps due-diligence metrics, safety wording, and operator version aligned', () => {
    const expectedMetricRows = [
      '| Client routes | 17 |',
      '| Serverless API handlers | 9 |',
      '| npm scripts | 112 |',
      '| Public database tables | 13 |',
      '| Vitest unit/integration files | 150 |',
      '| Playwright E2E specs | 28 |',
      '| Production dependencies | 69 |',
      '| Development dependencies | 27 |',
    ];

    for (const row of expectedMetricRows) {
      expect(summary).toContain(row);
    }

    expect(summary).toContain('Decision-support only');
    expect(summary).toContain('not certified approval');
    expect(summary).toContain('fixed construction quoting');
    expect(summary).toContain('Firebase | Legacy migration/operator tooling only, not production runtime.');
    expect(summary).toContain('handoff appendices → demo screenshots → investor screenshot pack → operator annex → metrics summary');
    expect(summary).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(summary).toContain('STRIPE_WEBHOOK_SECRET');
    expect(summary).toContain('GEMINI_API_KEY');

    expect(operatorTemplate).toContain('| Version | 1.5.0 |');
    expect(operatorTemplate).not.toContain('| Version | 1.2.0 |');
  });
});
