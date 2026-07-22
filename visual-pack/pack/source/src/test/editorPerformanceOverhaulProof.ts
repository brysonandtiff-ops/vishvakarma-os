import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type ProofStatus = 'PASS' | 'FAIL' | 'WARN';

export interface ProofCheck {
  id: string;
  phase: string;
  name: string;
  status: ProofStatus;
  detail: string;
}

export interface ProofMetrics {
  spatialIndexMs?: number;
  linearScanMs?: number;
  canvasSchedulerCoalesced?: boolean;
}

export interface EditorPerformanceOverhaulProof {
  suite: 'editor-performance-overhaul';
  generatedAt: string;
  commitSha: string;
  summary: {
    pass: number;
    fail: number;
    warn: number;
    total: number;
  };
  metrics: ProofMetrics;
  checks: ProofCheck[];
}

const repoRoot = resolve(process.cwd());
const evidenceDir = join(repoRoot, 'docs', 'release', 'evidence');

export const proofReport: EditorPerformanceOverhaulProof = {
  suite: 'editor-performance-overhaul',
  generatedAt: new Date().toISOString(),
  commitSha: resolveCommitSha(),
  summary: { pass: 0, fail: 0, warn: 0, total: 0 },
  metrics: {},
  checks: [],
};

function resolveCommitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unknown';
  }
}

export function recordCheck(
  id: string,
  phase: string,
  name: string,
  status: ProofStatus,
  detail = '',
): void {
  proofReport.checks.push({ id, phase, name, status, detail });
}

export function finalizeProofReport(): void {
  const pass = proofReport.checks.filter((c) => c.status === 'PASS').length;
  const fail = proofReport.checks.filter((c) => c.status === 'FAIL').length;
  const warn = proofReport.checks.filter((c) => c.status === 'WARN').length;
  proofReport.generatedAt = new Date().toISOString();
  proofReport.commitSha = resolveCommitSha();
  proofReport.summary = { pass, fail, warn, total: proofReport.checks.length };

  mkdirSync(evidenceDir, { recursive: true });

  const jsonPath = join(evidenceDir, 'editor-performance-overhaul-proof.json');
  writeFileSync(jsonPath, `${JSON.stringify(proofReport, null, 2)}\n`, 'utf8');

  const mdPath = join(evidenceDir, 'editor-performance-overhaul-proof.md');
  writeFileSync(mdPath, renderMarkdown(proofReport), 'utf8');
}

function renderMarkdown(report: EditorPerformanceOverhaulProof): string {
  const lines = [
    '# Editor Performance Overhaul — Proof Matrix',
    '',
    `Generated at: ${report.generatedAt}`,
    `Commit: \`${report.commitSha}\``,
    '',
    '## Summary',
    '',
    '| Pass | Fail | Warn | Total |',
    '|------|------|------|-------|',
    `| ${report.summary.pass} | ${report.summary.fail} | ${report.summary.warn} | ${report.summary.total} |`,
    '',
  ];

  if (Object.keys(report.metrics).length > 0) {
    lines.push('## Mock metrics', '', '| Metric | Value |', '|--------|-------|');
    if (report.metrics.spatialIndexMs != null) {
      lines.push(`| Spatial index (300 lookups) | ${report.metrics.spatialIndexMs.toFixed(2)} ms |`);
    }
    if (report.metrics.linearScanMs != null) {
      lines.push(`| Linear scan (300 lookups) | ${report.metrics.linearScanMs.toFixed(2)} ms |`);
    }
    if (report.metrics.canvasSchedulerCoalesced != null) {
      lines.push(`| Canvas rAF coalesced | ${report.metrics.canvasSchedulerCoalesced ? 'yes' : 'no'} |`);
    }
    lines.push('');
  }

  lines.push('## Checklist', '', '| Phase | ID | Check | Status | Detail |', '|-------|-----|-------|--------|--------|');
  for (const check of report.checks) {
    const detail = check.detail.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(`| ${check.phase} | ${check.id} | ${check.name} | **${check.status}** | ${detail || '—'} |`);
  }

  lines.push('', '## Run', '', '```bash', 'pnpm run test:perf-overhaul', '```', '');
  return `${lines.join('\n')}\n`;
}

export function readRepoFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}
