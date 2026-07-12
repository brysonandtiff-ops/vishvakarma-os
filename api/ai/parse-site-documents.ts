import { z } from 'zod';
import {
  parseBoundaryDxf,
  parseCouncilText,
  parseSiteSurveyText,
} from '../../src/services/copilot/ingestion/documentParsers';
import { boundaryMetricsFromPolygon } from '../../src/services/copilot/ingestion/dxfBoundaryParser';
import {
  exceedsUploadCap,
  MAX_AI_UPLOAD_BASE64_LENGTH,
} from '../../src/config/aiUsage';
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

export const MAX_SITE_DOCUMENT_REQUEST_BYTES = 25 * 1024 * 1024;
const MAX_DOCUMENT_COUNT = 3;
const MAX_TEXT_DOCUMENT_LENGTH = 1_000_000;
const MAX_DESIGN_BRIEF_LENGTH = 20_000;

const documentSchema = z
  .object({
    kind: z.enum(['siteSurvey', 'boundaryPlan', 'councilRequirements']),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(128),
    contentBase64: z.string().max(MAX_AI_UPLOAD_BASE64_LENGTH).optional(),
    textContent: z.string().max(MAX_TEXT_DOCUMENT_LENGTH).optional(),
  })
  .refine((document) => Boolean(document.contentBase64 || document.textContent), {
    message: 'Each document requires contentBase64 or textContent',
  });

const requestSchema = z.object({
  designBrief: z.string().max(MAX_DESIGN_BRIEF_LENGTH).optional(),
  documents: z.array(documentSchema).min(1).max(MAX_DOCUMENT_COUNT),
});

async function parseWithGemini(
  kind: string,
  fileName: string,
  mimeType: string,
  contentBase64: string,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const client = genAI.getGenerativeModel({
    model,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const systemPrompt =
    kind === 'boundaryPlan'
      ? 'Extract lot boundary polygon as JSON { boundaryPolygon: [{x,y}], widthM, depthM, areaSqM }. Coordinates in meters.'
      : kind === 'siteSurvey'
        ? 'Extract site survey as JSON { slope, orientation, easements: string[], surveyNotes }.'
        : 'Extract Australian council requirements as JSON { councilName, zone, setbacks: {front,side,rear}, maxCoverageRatio (0-1), maxHeightM, heritageOverlay, specialConditions: string[] }.';

  const result = await client.generateContent([
    { text: systemPrompt },
    {
      inlineData: {
        mimeType: mimeType || 'application/pdf',
        data: contentBase64,
      },
    },
    { text: `File: ${fileName}` },
  ]);

  const parsed = JSON.parse(result.response.text()) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

export default async function handler(req: SecureApiRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req, res, ['POST'])) return;

  const user = await verifyAuthTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required for document parsing' });
  }

  try {
    const parsed = requestSchema.safeParse(
      parseBoundedJsonBody(req, MAX_SITE_DOCUMENT_REQUEST_BYTES),
    );
    if (!parsed.success) {
      throw new ApiRequestError(400, 'Invalid request body');
    }

    if (exceedsUploadCap(parsed.data.documents.map((doc) => doc.contentBase64))) {
      throw new ApiRequestError(413, 'Uploaded document exceeds size limit');
    }

    const willUseGemini =
      Boolean(process.env.GEMINI_API_KEY) &&
      parsed.data.documents.some((doc) => doc.contentBase64);

    if (willUseGemini) {
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
    }

    const output: Record<string, unknown> = {
      mergedPrompt: parsed.data.designBrief?.trim() ?? '',
    };

    for (const doc of parsed.data.documents) {
      if (doc.textContent) {
        if (doc.kind === 'siteSurvey') {
          output.siteSurvey = parseSiteSurveyText(doc.textContent);
        } else if (doc.kind === 'boundaryPlan') {
          if (doc.fileName.toLowerCase().endsWith('.dxf')) {
            output.boundary = parseBoundaryDxf(doc.textContent);
          }
        } else {
          output.council = parseCouncilText(doc.textContent);
        }
        continue;
      }

      if (!doc.contentBase64) continue;

      try {
        const gemini = await parseWithGemini(
          doc.kind,
          doc.fileName,
          doc.mimeType,
          doc.contentBase64,
        );
        if (!gemini) continue;

        if (doc.kind === 'siteSurvey') output.siteSurvey = gemini;
        if (doc.kind === 'boundaryPlan') {
          const polygon = Array.isArray(gemini.boundaryPolygon)
            ? gemini.boundaryPolygon
            : [];
          output.boundary = {
            boundaryPolygon: polygon,
            ...boundaryMetricsFromPolygon(polygon),
            ...gemini,
          };
        }
        if (doc.kind === 'councilRequirements') output.council = gemini;
      } catch {
        // Local text parsers may already have populated output; do not expose provider errors.
      }
    }

    return res.status(200).json(output);
  } catch (error) {
    return sendApiFailure(
      res,
      error,
      'ai/parse-site-documents',
      'Document parsing failed.',
    );
  }
}
