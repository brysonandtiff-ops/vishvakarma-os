import type { IncomingMessage } from 'node:http';
import { z } from 'zod';
import {
  parseBoundaryDxf,
  parseCouncilText,
  parseSiteSurveyText,
} from '../../src/services/copilot/ingestion/documentParsers';
import { boundaryMetricsFromPolygon } from '../../src/services/copilot/ingestion/dxfBoundaryParser';
import { exceedsUploadCap } from '../../src/config/aiUsage';
import type { PlanTier } from '../../src/config/billingPlans';
import { verifySupabaseTokenFromRequest } from '../_lib/verifySupabaseToken';
import { resolveUserPlanTier } from '../_lib/castBackend';
import { consumeAiQuota } from '../_lib/aiUsage';

type VercelRequest = IncomingMessage & {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

const documentSchema = z.object({
  kind: z.enum(['siteSurvey', 'boundaryPlan', 'councilRequirements']),
  fileName: z.string(),
  mimeType: z.string(),
  contentBase64: z.string().optional(),
  textContent: z.string().optional(),
});

const requestSchema = z.object({
  designBrief: z.string().optional(),
  documents: z.array(documentSchema),
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

  return JSON.parse(result.response.text());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticated users only — anonymous callers fall back to in-browser parsing.
  const user = await verifySupabaseTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required for document parsing' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Bound the request body / Gemini token cost before doing any work.
  if (exceedsUploadCap(parsed.data.documents.map((doc) => doc.contentBase64))) {
    return res.status(413).json({ error: 'Uploaded document exceeds size limit' });
  }

  // One quota unit per request that will actually call Gemini (any base64 document).
  const willUseGemini =
    Boolean(process.env.GEMINI_API_KEY) && parsed.data.documents.some((doc) => doc.contentBase64);
  if (willUseGemini) {
    let tier: PlanTier = 'starter';
    try {
      tier = await resolveUserPlanTier(user.uid, user.email);
    } catch {
      // default to the starter ceiling if tier lookup fails
    }
    const quota = await consumeAiQuota(user.uid, tier);
    if (!quota.allowed) {
      return res
        .status(429)
        .json({ error: 'Daily AI limit reached', used: quota.used, limit: quota.limit });
    }
  }

  const output: Record<string, unknown> = { mergedPrompt: parsed.data.designBrief ?? '' };

  for (const doc of parsed.data.documents) {
    if (doc.textContent) {
      if (doc.kind === 'siteSurvey') {
        output.siteSurvey = parseSiteSurveyText(doc.textContent);
      } else if (doc.kind === 'boundaryPlan') {
        if (doc.fileName.toLowerCase().endsWith('.dxf')) {
          output.boundary = parseBoundaryDxf(doc.textContent);
        }
      } else if (doc.kind === 'councilRequirements') {
        output.council = parseCouncilText(doc.textContent);
      }
      continue;
    }

    if (doc.contentBase64) {
      try {
        const gemini = await parseWithGemini(doc.kind, doc.fileName, doc.mimeType, doc.contentBase64);
        if (gemini) {
          if (doc.kind === 'siteSurvey') output.siteSurvey = gemini;
          if (doc.kind === 'boundaryPlan') {
            const polygon = gemini.boundaryPolygon ?? [];
            output.boundary = {
              boundaryPolygon: polygon,
              ...boundaryMetricsFromPolygon(polygon),
              ...gemini,
            };
          }
          if (doc.kind === 'councilRequirements') output.council = gemini;
        }
      } catch {
        // fall through — local parsers may have already populated output
      }
    }
  }

  return res.status(200).json(output);
}
