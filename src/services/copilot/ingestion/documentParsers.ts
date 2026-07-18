import {
  createCouncilRequirements,
  DEFAULT_COUNCIL_REQUIREMENTS,
  type CouncilRequirements,
} from '../../../domain/copilot/councilRequirements';
import type {
  BoundaryPlanExtraction,
  CopilotIngestionResult,
  CopilotUploadedDocument,
  SiteSurveyExtraction,
} from '../../../domain/copilot/copilotSession';
import { boundaryMetricsFromPolygon, parseDxfBoundary } from './dxfBoundaryParser';

function parseSiteSurveyText(text: string): SiteSurveyExtraction {
  const slopeMatch = text.match(/slope[:\s]+(\d+(?:\.\d+)?)\s*(?:%|deg)?/i);
  const orientMatch = text.match(/(?:orientation|bearing|facing)[:\s]+([NSEW]+(?:\s*-\s*[NSEW]+)?)/i);
  const easements = [...text.matchAll(/easement[:\s]+([^\n.]+)/gi)].map((m) => m[1].trim());

  return {
    slope: slopeMatch ? Number(slopeMatch[1]) : 0,
    orientation: orientMatch?.[1]?.toUpperCase() ?? 'N',
    easements,
    surveyNotes: text.slice(0, 500).trim(),
  };
}

function parseCouncilText(text: string): CouncilRequirements {
  const frontMatch = text.match(/front\s+setback[:\s]+(\d+(?:\.\d+)?)\s*m/i);
  const sideMatch = text.match(/side\s+setback[:\s]+(\d+(?:\.\d+)?)\s*m/i);
  const rearMatch = text.match(/rear\s+setback[:\s]+(\d+(?:\.\d+)?)\s*m/i);
  const coverageMatch = text.match(/(?:max(?:imum)?\s+)?coverage[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  const heightMatch = text.match(/(?:max(?:imum)?\s+)?height[:\s]+(\d+(?:\.\d+)?)\s*m/i);
  const councilMatch = text.match(/council[:\s]+([^\n]+)/i);
  const zoneMatch = text.match(/zone[:\s]+([A-Z0-9-]+)/i);

  const conditions = [...text.matchAll(/(?:condition|requirement)[:\s]+([^\n.]+)/gi)].map((m) =>
    m[1].trim(),
  );

  return createCouncilRequirements({
    councilName: councilMatch?.[1]?.trim(),
    zone: zoneMatch?.[1],
    setbacks: {
      front: frontMatch ? Number(frontMatch[1]) : DEFAULT_COUNCIL_REQUIREMENTS.setbacks.front,
      side: sideMatch ? Number(sideMatch[1]) : DEFAULT_COUNCIL_REQUIREMENTS.setbacks.side,
      rear: rearMatch ? Number(rearMatch[1]) : DEFAULT_COUNCIL_REQUIREMENTS.setbacks.rear,
    },
    maxCoverageRatio: coverageMatch
      ? Number(coverageMatch[1]) / 100
      : DEFAULT_COUNCIL_REQUIREMENTS.maxCoverageRatio,
    maxHeightM: heightMatch ? Number(heightMatch[1]) : DEFAULT_COUNCIL_REQUIREMENTS.maxHeightM,
    heritageOverlay: /heritage/i.test(text),
    specialConditions: conditions.length ? conditions : [],
    rawText: text.slice(0, 2000),
  });
}

function parseBoundaryDxf(content: string): BoundaryPlanExtraction {
  const boundaryPolygon = parseDxfBoundary(content);
  const metrics = boundaryMetricsFromPolygon(boundaryPolygon);
  return { boundaryPolygon, ...metrics };
}

async function readFileAsText(file: File): Promise<string> {
  return file.text();
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function parseDocumentLocally(
  doc: CopilotUploadedDocument,
  file: File,
): Promise<Partial<CopilotIngestionResult>> {
  if (doc.kind === 'siteSurvey') {
    const text = await readFileAsText(file);
    return { siteSurvey: parseSiteSurveyText(text) };
  }

  if (doc.kind === 'boundaryPlan') {
    if (file.name.toLowerCase().endsWith('.dxf') || file.type === 'application/dxf') {
      const content = await readFileAsText(file);
      return { boundary: parseBoundaryDxf(content) };
    }
    return {};
  }

  if (doc.kind === 'councilRequirements') {
    const text = await readFileAsText(file);
    return { council: parseCouncilText(text) };
  }

  return {};
}

// P3: parseCopilotDocumentsViaApi now accepts an optional AbortSignal so
// callers can cancel the in-flight AI document parse when the component
// unmounts. Uses fetchWithRetry for automatic retry + per-attempt timeout.
export async function parseCopilotDocumentsViaApi(
  input: {
    designBrief: string;
    documents: Array<{
      kind: CopilotUploadedDocument['kind'];
      fileName: string;
      mimeType: string;
      contentBase64?: string;
      textContent?: string;
    }>;
  },
  signal?: AbortSignal,
): Promise<CopilotIngestionResult | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      // Dynamic import keeps this client-only module out of the serverless bundle that
      // also imports the local-parser exports from this file.
      const { getSupabaseAccessToken } = await import(
        '../../../backend/supabase/supabaseAccessToken'
      );
      const token = await getSupabaseAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // proceed unauthenticated; the server returns 401 and we fall back to local parsing
    }

    const { fetchWithRetry } = await import('../../../backend/fetchWithRetry');
    const res = await fetchWithRetry(
      (attemptSignal) =>
        fetch('/api/ai/parse-site-documents', {
          method: 'POST',
          headers,
          body: JSON.stringify(input),
          signal: attemptSignal,
        }),
      { signal, timeoutMs: 30_000, maxAttempts: 2 },
    );
    if (!res.ok) return null;
    return (await res.json()) as CopilotIngestionResult;
  } catch (err) {
    // Re-throw intentional aborts; swallow all other errors (fall back to local parse).
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return null;
  }
}

export async function ingestCopilotDocuments(
  documents: CopilotUploadedDocument[],
  filesById: Map<string, File>,
  designBrief: string,
): Promise<CopilotIngestionResult> {
  const merged: CopilotIngestionResult = { mergedPrompt: designBrief };

  for (const doc of documents) {
    const file = filesById.get(doc.id);
    if (!file) continue;
    const partial = await parseDocumentLocally(doc, file);
    if (partial.siteSurvey) merged.siteSurvey = partial.siteSurvey;
    if (partial.boundary) merged.boundary = partial.boundary;
    if (partial.council) merged.council = partial.council;
  }

  const apiPayload = await Promise.all(
    documents.map(async (doc) => {
      const file = filesById.get(doc.id);
      if (!file) return null;
      const isText =
        file.type.startsWith('text/') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.dxf') ||
        file.name.endsWith('.csv');
      if (isText) {
        return {
          kind: doc.kind,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          textContent: await file.text(),
        };
      }
      const dataUrl = await readFileAsDataUrl(file);
      const contentBase64 = dataUrl.split(',')[1];
      return {
        kind: doc.kind,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        contentBase64,
      };
    }),
  );

  const fromApi = await parseCopilotDocumentsViaApi({
    designBrief,
    documents: apiPayload.filter(Boolean) as NonNullable<(typeof apiPayload)[number]>[],
  });

  if (fromApi) {
    return {
      mergedPrompt: designBrief,
      siteSurvey: fromApi.siteSurvey ?? merged.siteSurvey,
      boundary: fromApi.boundary ?? merged.boundary,
      council: fromApi.council ?? merged.council,
    };
  }

  return merged;
}

export { parseCouncilText, parseSiteSurveyText, parseBoundaryDxf };
