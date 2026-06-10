import { createParcel } from '@/domain/parcels/parcel';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import { DEFAULT_BUILDING_REQUEST } from '@/domain/buildings/buildingRequest';
import { parcelFromPromptHints } from '@/services/lot-analysis/lotAnalysis';
import { buildingRequestSchema } from '@/ai/building-designer/prompts/outputSchema';

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

export async function extractRequirements(
  prompt: string,
  parcelOverride?: Partial<BuildingRequest['parcel']>
): Promise<BuildingRequest> {
  try {
    const res = await fetch('/api/ai/extract-requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, parcelOverride }),
    });

    if (res.ok) {
      const body = await res.json();
      const parsed = buildingRequestSchema.safeParse(body.request ?? body);
      if (parsed.success) {
        return parsed.data;
      }
    }
  } catch {
    // fall through to local parser
  }

  return parseRequirementsFallback(prompt, parcelOverride);
}

export function normalizeBuildingRequest(raw: BuildingRequest): BuildingRequest {
  const parcel = createParcel(raw.parcel);
  return {
    ...raw,
    parcel,
    bedrooms: Math.min(8, Math.max(1, Math.round(raw.bedrooms))),
    bathrooms: Math.min(6, Math.max(1, Math.round(raw.bathrooms))),
    garageSpaces: Math.min(4, Math.max(0, Math.round(raw.garageSpaces))),
    levels: Math.min(3, Math.max(1, Math.round(raw.levels))),
  };
}
