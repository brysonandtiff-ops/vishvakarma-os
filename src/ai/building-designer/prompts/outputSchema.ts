import { z } from 'zod';

export const parcelSchema = z.object({
  width: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  area: z.number().positive().optional(),
  slope: z.number().min(0).max(45).optional(),
  orientation: z.string().optional(),
  cornerLot: z.boolean().optional(),
});

export const buildingRequestSchema = z.object({
  style: z.string().min(1),
  bedrooms: z.number().int().min(1).max(8),
  bathrooms: z.number().int().min(1).max(6),
  garageSpaces: z.number().int().min(0).max(4),
  levels: z.number().int().min(1).max(3),
  parcel: z.object({
    width: z.number().positive(),
    depth: z.number().positive(),
    area: z.number().positive(),
    slope: z.number().min(0).max(45),
    orientation: z.string(),
    cornerLot: z.boolean().optional(),
  }),
  extras: z.array(z.string()).optional(),
});

export type BuildingRequestPayload = z.infer<typeof buildingRequestSchema>;
