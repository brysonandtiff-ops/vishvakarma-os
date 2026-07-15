import { buildingRequestSchema } from '../../src/ai/building-designer/prompts/outputSchema';
import {
  EXTRACT_REQUIREMENTS_SYSTEM,
  buildExtractUserPrompt,
} from '../../src/ai/building-designer/prompts/extractRequirements';
import {
  parseRequirementsFallback,
  normalizeBuildingRequest,
} from '../../src/ai/building-designer/generators/requirementsExtractor';
import type { PlanTier } from '../../src/config/billingPlans';
import { verifyAuthTokenFromRequest } from '../_lib/verifyAuthToken';
import { resolveUserPlanTier } from '../_lib/castBackend';
import { consumeAiQuota } from '../_lib/aiUsage';
import {
  ApiRequestError,
  applyApiSecurityHeaders,
  enforceApiMethod,
  parseBoundedJsonBody,
  sendApiFailure,
  type SecureApiRequest,
  type SecureApiResponse,
} from '../_lib/httpSecurity';

export const MAX_EXTRACT_REQUIREMENTS_BODY_BYTES = 64 * 1024;
const MAX_PROMPT_LENGTH = 20_000;

async function extractWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const client = genAI.getGenerativeModel({
    model,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const result = await client.generateContent([
    { text: EXTRACT_REQUIREMENTS_SYSTEM },
    { text: buildExtractUserPrompt(prompt) },
  ]);

  const parsed = JSON.parse(result.response.text()) as unknown;
  const validated = buildingRequestSchema.safeParse(parsed);
  if (!validated.success) return null;
  return normalizeBuildingRequest(validated.data);
}

function parseRequest(body: Record<string, unknown>) {
  if (typeof body.prompt !== 'string') {
    throw new ApiRequestError(400, 'prompt is required');
  }

  const prompt = body.prompt.trim();
  if (!prompt) throw new ApiRequestError(400, 'prompt is required');
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new ApiRequestError(413, 'prompt exceeds the allowed length');
  }

  const parcelOverride = body.parcelOverride;
  if (
    parcelOverride !== undefined &&
    (!parcelOverride || typeof parcelOverride !== 'object' || Array.isArray(parcelOverride))
  ) {
    throw new ApiRequestError(400, 'parcelOverride must be a JSON object');
  }

  return {
    prompt,
    parcelOverride: parcelOverride as Record<string, unknown> | undefined,
  };
}

export default async function handler(req: SecureApiRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req, res, ['POST'])) return;

  const user = await verifyAuthTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required for AI extraction' });
  }

  try {
    const { prompt, parcelOverride } = parseRequest(
      parseBoundedJsonBody(req, MAX_EXTRACT_REQUIREMENTS_BODY_BYTES),
    );
    let fromGemini: Awaited<ReturnType<typeof extractWithGemini>> = null;

    if (process.env.GEMINI_API_KEY) {
      let tier: PlanTier = 'starter';
      try {
        tier = await resolveUserPlanTier(user.uid, user.email);
      } catch {
        // Fail closed to the starter quota when billing lookup is unavailable.
      }

      const quota = await consumeAiQuota(user.uid, tier);
      if (!quota.allowed) {
        return res
          .status(429)
          .json({ error: 'Daily AI limit reached', used: quota.used, limit: quota.limit });
      }
      fromGemini = await extractWithGemini(prompt);
    }

    const request =
      fromGemini ??
      normalizeBuildingRequest(parseRequirementsFallback(prompt, parcelOverride));

    return res.status(200).json({
      request,
      source: fromGemini ? 'gemini' : 'fallback',
    });
  } catch (error) {
    return sendApiFailure(
      res,
      error,
      'ai/extract-requirements',
      'Requirement extraction failed.',
    );
  }
}
