export type WorldRecordStatus =
  | 'self_verified'
  | 'witness_pending'
  | 'guinness_submitted'
  | 'guinness_verified'
  | 'proposed';

export interface WorldRecordMeasurement {
  product: string;
  claimTitle: string;
  metricGateCount: number;
  gateCount: number;
  gateNames: string[];
  testFileCount: number;
  commit: string;
  timestamp: string;
  reproduceCommand: string;
  evidenceHash: string;
  status: WorldRecordStatus;
  honestyNote: string;
  releaseGateSummary?: {
    passed: number;
    manual: number;
    failed: number;
    error?: string;
  };
}

export interface WorldRecordEntry {
  id: string;
  title: string;
  metricLabel: string;
  metricValue: string;
  status: WorldRecordStatus;
  reproduceCommand: string;
  limitations: string[];
  measuredAt?: string;
  commit?: string;
  evidenceHash?: string;
  scopeNote: string;
}

export const GWR_CERTIFICATE_PATH = '/records/gwr-certificate.pdf';

export const WORLD_RECORD_HONESTY_DISCLAIMER =
  'Self-Verified Candidate — not an official Guinness World Records title until GWR adjudication completes and a certificate is attached.';

export const WORLD_RECORD_SCOPE_NOTE =
  'Browser-native architectural floor plan editor means a SPA that runs in a browser and supports 2D floor plan editing without a native install. Governance gates must be enforced in-repo, not external CI-only.';

export function getWorldRecordStatusLabel(status: WorldRecordStatus): string {
  switch (status) {
    case 'self_verified':
      return 'Self-Verified Candidate';
    case 'witness_pending':
      return 'Witness Pending';
    case 'guinness_submitted':
      return 'Guinness Submitted';
    case 'guinness_verified':
      return 'Guinness Verified';
    case 'proposed':
      return 'Proposed — Not Yet Measured';
    default:
      return 'Unknown';
  }
}

export function isGuinnessVerified(status: WorldRecordStatus, certificateExists: boolean): boolean {
  return status === 'guinness_verified' && certificateExists;
}

export function buildWorldRecordsFromMeasurement(
  measurement: WorldRecordMeasurement | null,
  certificateExists: boolean,
): WorldRecordEntry[] {
  const primary: WorldRecordEntry = measurement
    ? {
        id: 'record-primary-gates',
        title: measurement.claimTitle,
        metricLabel: 'Pre-release compliance gates',
        metricValue: `${measurement.metricGateCount} gates (${measurement.gateCount} total incl. world-record gate)`,
        status: measurement.status,
        reproduceCommand: measurement.reproduceCommand,
        limitations: [
          'Competitor baseline is a point-in-time survey documented in docs/world-record/COMPETITOR_BASELINE.md.',
          'Gate count alone does not imply product quality or production readiness.',
          measurement.honestyNote,
        ],
        measuredAt: measurement.timestamp,
        commit: measurement.commit,
        evidenceHash: measurement.evidenceHash,
        scopeNote: WORLD_RECORD_SCOPE_NOTE,
      }
    : {
        id: 'record-primary-gates',
        title:
          'Most enforced pre-release compliance gates in a browser-native architectural floor plan editor',
        metricLabel: 'Pre-release compliance gates',
        metricValue: '12 gates (run pnpm run record:measure)',
        status: 'proposed',
        reproduceCommand: 'pnpm run record:measure',
        limitations: [WORLD_RECORD_HONESTY_DISCLAIMER, 'Measurement artifact not generated yet.'],
        scopeNote: WORLD_RECORD_SCOPE_NOTE,
      };

  const proposed: WorldRecordEntry[] = [
    {
      id: 'record-vastu',
      title: 'First browser floor-plan editor with integrated Vastu analysis',
      metricLabel: 'Feature integration',
      metricValue: 'Not measured',
      status: 'proposed',
      reproduceCommand: 'N/A — feature not shipped',
      limitations: ['Requires Vastu tool implementation before measurement.'],
      scopeNote: WORLD_RECORD_SCOPE_NOTE,
    },
    {
      id: 'record-bilingual',
      title: 'Most bilingual English + Devanagari auth surfaces in architectural SaaS',
      metricLabel: 'Localized auth surfaces',
      metricValue: 'Not measured',
      status: 'proposed',
      reproduceCommand: 'N/A — extend beyond auth gate to editor labels',
      limitations: ['Auth page Sanskrit gate exists; full editor bilingual count not measured.'],
      scopeNote: WORLD_RECORD_SCOPE_NOTE,
    },
  ];

  if (isGuinnessVerified(primary.status, certificateExists)) {
    primary.limitations = primary.limitations.filter((line) => !line.includes('not an official Guinness'));
  }

  return [primary, ...proposed];
}

export async function fetchLatestMeasurement(): Promise<WorldRecordMeasurement | null> {
  try {
    const response = await fetch('/world-record/latest-measurement.json', { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as WorldRecordMeasurement;
  } catch {
    return null;
  }
}

export async function certificateAssetExists(): Promise<boolean> {
  try {
    const response = await fetch(GWR_CERTIFICATE_PATH, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
