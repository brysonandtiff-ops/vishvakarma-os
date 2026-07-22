import type { PlanTier } from './billingPlans';

/**
 * Daily Gemini-call ceilings per billing tier. This is the cost/abuse guard for the
 * `/api/ai/*` serverless routes: each authenticated Gemini call consumes one unit, and
 * requests past the tier's ceiling are rejected (callers fall back to local parsers).
 */
export const DAILY_AI_LIMITS: Record<PlanTier, number> = {
  starter: 10,
  studio: 200,
  enterprise: 2000,
};

export function dailyAiLimit(tier: PlanTier): number {
  return DAILY_AI_LIMITS[tier] ?? DAILY_AI_LIMITS.starter;
}

/**
 * Max base64 payload accepted per uploaded document on `/api/ai/parse-site-documents`.
 * ~8 MB encoded ≈ 6 MB raw file — generous for survey/boundary PDFs while bounding the
 * request body and Gemini token cost.
 */
export const MAX_AI_UPLOAD_BASE64_LENGTH = 8 * 1024 * 1024;

/** True if any provided base64 string exceeds the per-document upload cap. */
export function exceedsUploadCap(
  base64Values: Array<string | undefined>,
  maxLength: number = MAX_AI_UPLOAD_BASE64_LENGTH,
): boolean {
  return base64Values.some((value) => typeof value === 'string' && value.length > maxLength);
}
