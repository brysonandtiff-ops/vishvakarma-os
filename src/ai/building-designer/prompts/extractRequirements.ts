export const EXTRACT_REQUIREMENTS_SYSTEM = `You extract structured residential building requirements from natural language.
Return ONLY valid JSON matching this shape:
{
  "style": string,
  "bedrooms": number,
  "bathrooms": number,
  "garageSpaces": number,
  "levels": number,
  "parcel": { "width": number, "depth": number, "area": number, "slope": number, "orientation": string, "cornerLot": boolean },
  "extras": string[]
}
Use meters for parcel dimensions. Infer reasonable defaults when omitted.`;

export function buildExtractUserPrompt(prompt: string) {
  return `User brief:\n${prompt}\n\nExample: "4-bedroom modern home on 600m² corner block with double garage" → bedrooms:4, style:modern, parcel.area:600, cornerLot:true, garageSpaces:2`;
}
