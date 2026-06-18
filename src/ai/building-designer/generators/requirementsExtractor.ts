import { createParcel } from '@/domain/parcels/parcel';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import { DEFAULT_BUILDING_REQUEST } from '@/domain/buildings/buildingRequest';
import { parcelFromPromptHints } from '@/services/lot-analysis/lotAnalysis';
import {
  buildingRequestSchema,
  type BuildingRequestPayload,
} from '@/ai/building-designer/prompts/outputSchema';
import { fetchWithRetry } from '@/backend/fetchWithRetry';

export function parseRequirementsFallback(prompt: string, parcelOverride?: Partial<BuildingRequest['parcel']>): BuildingRequest {
  const bedroomsMatch = prompt.match(/(\d+)\s*[- ]?bed/i);
  const bathroomsMatch = prompt.match(/(\d+)\s*[- ]?bath/i);
  const garageMatch = prompt.match(/(\d+)\s*[- ]?(?:car\s*)?garage/i) ?? prompt.match(/double\s+garage/i);
  const styleMatch = prompt.match(/\b(modern|contemporary|traditional|craftsman|minimal)\b/i);

  let garageSpaces = 0;
  if (/double\s+garage/i.test(prompt)) garageSpaces = 2;
  else if (garageMatch && garageMatch[1]) garageSpaces = Number(garageMatch[1]);

  const parcel = parcelFromPromptHints(prompt, parcelOverride);
  const extras: string[] = [];
  if (/mudroom/i.test(prompt)) extras.push('mudroom');
  if (/study|office/i.test(prompt)) extras.push('study');

  return {
    style: styleMatch?.[1]?.toLowerCase() ?? 'modern',
    bedrooms: bedroomsMatch ? Number(bedroomsMatch[1]) : DEFAULT_BUILDING_REQUEST.bedrooms,
    bathrooms: bathroomsMatch ? Number(bathroomsMatch[1]) : Math.max(2, Math.ceil((bedroomsMatch ? Number(bedroomsMatch[1]) : 3) / 2)),
    garageSpaces,
    levels: /two\s*storey|2\s*level/i.test(prompt) ? 2 : 1,
    parcel,
    extras: extras.length ? extras : undefined,
  };
}

// P3: extractRequirements now accepts an optional AbortSignal so callers can
// cancel the in-flight AI request when the component unmounts or the user
// navigates away. Uses fetchWithRetry for automatic retry + per-attempt timeout.
export async function extractRequirements(
  prompt: string,
  parcelOverride?: Partial<BuildingRequest['parcel']>,
  signal?: AbortSignal,
): Promise<BuildingRequest> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      // Dynamic import keeps this client-only module out of the serverless bundle that
      // also imports the local-parser exports from this file.
      const { getSupabaseAccessToken } = await import('@/backend/supabase/supabaseAccessToken');
      const token = await getSupabaseAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // proceed unauthenticated; the server returns 401 and we fall back to local parsing
    }

    const res = await fetchWithRetry(
      (attemptSignal) =>
        fetch('/api/ai/extract-requirements', {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt, parcelOverride }),
          signal: attemptSignal,
        }),
      { signal, timeoutMs: 20_000, maxAttempts: 2 },
    );

    if (res.ok) {
      const body = (await res.json()) as { request?: unknown };
      const parsed = buildingRequestSchema.safeParse(body.request ?? body);
      if (parsed.success) {
        return normalizeBuildingRequest(parsed.data);
      }
    }
  } catch (err) {
    // Re-throw intentional aborts so callers can distinguish cancellation from errors.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    // All other errors fall through to the local parser fallback.
  }

  return parseRequirementsFallback(prompt, parcelOverride);
}

export function normalizeBuildingRequest(raw: BuildingRequestPayload): BuildingRequest {
  const parcel = createParcel(raw.parcel);
  return {
    style: raw.style,
    extras: raw.extras,
    parcel,
    bedrooms: Math.min(8, Math.max(1, Math.round(raw.bedrooms))),
    bathrooms: Math.min(6, Math.max(1, Math.round(raw.bathrooms))),
    garageSpaces: Math.min(4, Math.max(0, Math.round(raw.garageSpaces))),
    levels: Math.min(3, Math.max(1, Math.round(raw.levels))),
  };
}
