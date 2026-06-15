import { NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import type { ComplianceRulePack } from '@/modules/compliance/rulePacks/types';

export const AU_NCC_VOL2_H1_DISCLAIMER =
  'Prototype decision-support only — not a certified NCC assessment. Verify with a registered architect or certifier.';

export const AU_NCC_VOL2_H1_RULE_PACK: ComplianceRulePack = {
  id: 'au-ncc-vol2-h1',
  jurisdiction: 'au',
  version: '1.0.0',
  title: 'Australia — NCC 2022 Volume 2 Class 1 & 10 (H-class dwelling stubs)',
  disclaimer: AU_NCC_VOL2_H1_DISCLAIMER,
  entries: [
    {
      ruleId: 'ncc-bedroom-size',
      category: 'ncc',
      thresholdKey: 'minHabitableRoomAreaSqM',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'H1D3 (habitable room dimensions)',
        summary: `Minimum habitable room area ${NCC_AU_THRESHOLDS.minHabitableRoomAreaSqM} m² and bedroom width ${NCC_AU_THRESHOLDS.minBedroomWidthM} m (decision-support stub).`,
        sourceUrl: 'https://www.abcb.gov.au/',
      },
    },
    {
      ruleId: 'ncc-bedroom-egress',
      category: 'ncc',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'H1D4 (emergency egress)',
        summary: 'Bedrooms require a door or openable window to a safe egress path (stub check).',
        sourceUrl: 'https://www.abcb.gov.au/',
      },
    },
    {
      ruleId: 'ncc-habitable-height',
      category: 'ncc',
      thresholdKey: 'minWallHeightM',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'H1D3 (ceiling height)',
        summary: `Minimum ceiling height ${NCC_AU_THRESHOLDS.minWallHeightM} m for habitable rooms (stub).`,
        sourceUrl: 'https://www.abcb.gov.au/',
      },
    },
    {
      ruleId: 'access-door-width',
      category: 'accessibility',
      thresholdKey: 'minDoorWidthM',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'D3D4 (doorways — access provisions)',
        summary: `Clear door opening width target ${NCC_AU_THRESHOLDS.minDoorWidthM} m (stub).`,
      },
    },
    {
      ruleId: 'access-circulation',
      category: 'accessibility',
      thresholdKey: 'minHallwayWidthM',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'D3D3 (circulation spaces)',
        summary: `Circulation path width guidance ${NCC_AU_THRESHOLDS.minHallwayWidthM} m (stub).`,
      },
    },
    {
      ruleId: 'energy-thermal',
      category: 'energy',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'H6D2 (thermal comfort — simplified)',
        summary: 'Thermal comfort score heuristic for glazing and envelope (decision-support).',
      },
    },
    {
      ruleId: 'energy-glazing',
      category: 'energy',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'H6D3 (glazing)',
        summary: `Glazing ratio band ${NCC_AU_THRESHOLDS.minGlazingRatio * 100}–${NCC_AU_THRESHOLDS.maxGlazingRatio * 100}% of floor area (stub).`,
      },
    },
    {
      ruleId: 'zoning-setback',
      category: 'zoning',
      citation: {
        code: 'Local planning scheme',
        summary: 'Building footprint must respect parcel setbacks when site plan is present (stub).',
      },
    },
    {
      ruleId: 'zoning-coverage',
      category: 'zoning',
      citation: {
        code: 'Local planning scheme',
        summary: 'Site coverage ratio check against parcel area (stub).',
      },
    },
    {
      ruleId: 'fire-egress-path',
      category: 'fire',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'H1D4 / smoke alarm provisions',
        summary: 'Egress path from habitable rooms to exterior door (graph stub).',
      },
    },
    {
      ruleId: 'fire-smoke-zone',
      category: 'fire',
      citation: {
        code: 'NCC 2022 Vol 2',
        clause: 'Part 3.7.5 (smoke alarms)',
        summary: 'Smoke alarm zoning per labelled bedroom (stub).',
      },
    },
    {
      ruleId: 'zoning-council-conditions',
      category: 'zoning',
      citation: {
        code: 'Council conditions',
        summary: 'Council intelligence conditions overlay when present on manifest (decision-support).',
      },
    },
  ],
};
