import { buildingRequestSchema } from '../../src/ai/building-designer/prompts/outputSchema';
import {
  EXTRACT_REQUIREMENTS_SYSTEM,
  buildExtractUserPrompt,
} from '../../src/ai/building-designer/prompts/extractRequirements';
import { parseRequirementsFallback, normalizeBuildingRequest } from '../../src/ai/building-designer/generators/requirementsExtractor';

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

async function extractWithGemini(prompt: string, parcelOverride?: Record<string, unknown>) {
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

  const text = result.response.text();
  const parsed = JSON.parse(text);
  const validated = buildingRequestSchema.safeParse(parsed);
  if (!validated.success) return null;
  return normalizeBuildingRequest(validated.data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    prompt?: string;
    parcelOverride?: Record<string, unknown>;
  };

  if (!body?.prompt || typeof body.prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const fromGemini = await extractWithGemini(body.prompt, body.parcelOverride);
    const request =
      fromGemini ?? normalizeBuildingRequest(parseRequirementsFallback(body.prompt, body.parcelOverride));

    return res.status(200).json({ request, source: fromGemini ? 'gemini' : 'fallback' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction failed';
    return res.status(500).json({ error: message });
  }
}
