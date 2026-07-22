import type { CastEvidenceRoll, CastIntentEvent, CastLensState, CastPinEvent, CastSessionRecord } from '@/cast/types';

export function buildCastEvidenceRoll(options: {
  session: CastSessionRecord;
  intents: CastIntentEvent[];
  pins?: CastPinEvent[];
  lensSnapshots?: Array<{ timestamp: number; lenses: CastLensState }>;
}): CastEvidenceRoll {
  return {
    sessionId: options.session.id,
    projectId: options.session.projectId,
    startedAt: options.session.createdAt,
    endedAt: options.session.endedAt ?? null,
    intents: options.intents,
    pins: options.pins ?? [],
    lensSnapshots: options.lensSnapshots ?? [],
  };
}

export function serializeCastEvidence(roll: CastEvidenceRoll): string {
  return JSON.stringify(roll, null, 2);
}

export function evidenceSummaryLines(roll: CastEvidenceRoll): string[] {
  const lines = [
    `Akasha Cast Evidence Roll`,
    `Session: ${roll.sessionId}`,
    `Project: ${roll.projectId}`,
    `Started: ${roll.startedAt}`,
    `Ended: ${roll.endedAt ?? 'live'}`,
    `Intent events: ${roll.intents.length}`,
    `Viewer pins: ${roll.pins.length}`,
  ];
  return lines;
}
