import type { Label, ProjectManifest } from '@/types';

export type PanchatattvaElement = 'akash' | 'vayu' | 'agni' | 'jala' | 'prithvi';

export interface ElementScore {
  element: PanchatattvaElement;
  label: string;
  sanskrit: string;
  score: number;
  tip: string;
}

export interface PanchatattvaResult {
  balancePercent: number;
  elements: ElementScore[];
  tips: string[];
}

const ELEMENT_META: Record<PanchatattvaElement, { label: string; sanskrit: string }> = {
  akash: { label: 'Space', sanskrit: 'आकाश' },
  vayu: { label: 'Air', sanskrit: 'वायु' },
  agni: { label: 'Fire', sanskrit: 'अग्नि' },
  jala: { label: 'Water', sanskrit: 'जल' },
  prithvi: { label: 'Earth', sanskrit: 'पृथ्वी' },
};

/** Room label patterns mapped to dominant element presence. */
const ROOM_ELEMENT: { pattern: RegExp; element: PanchatattvaElement; boost: number }[] = [
  { pattern: /kitchen|dining/i, element: 'agni', boost: 22 },
  { pattern: /bath|toilet|wc|utility/i, element: 'jala', boost: 20 },
  { pattern: /bed|master|guest/i, element: 'prithvi', boost: 18 },
  { pattern: /living|hall|family/i, element: 'vayu', boost: 16 },
  { pattern: /courtyard|open|balcony|terrace/i, element: 'akash', boost: 20 },
  { pattern: /puja|mandir|prayer/i, element: 'akash', boost: 24 },
  { pattern: /study|office/i, element: 'vayu', boost: 14 },
  { pattern: /store|garage/i, element: 'prithvi', boost: 12 },
];

const BASE_SCORE = 52;

function scoreElements(labels: Label[]): Map<PanchatattvaElement, number> {
  const scores = new Map<PanchatattvaElement, number>(
    (Object.keys(ELEMENT_META) as PanchatattvaElement[]).map((el) => [el, BASE_SCORE]),
  );

  for (const label of labels) {
    for (const rule of ROOM_ELEMENT) {
      if (rule.pattern.test(label.text)) {
        const current = scores.get(rule.element) ?? BASE_SCORE;
        scores.set(rule.element, Math.min(100, current + rule.boost));
      }
    }
  }

  const doorCount = labels.filter((l) => /entrance|foyer|entry/i.test(l.text)).length;
  if (doorCount > 0) {
    scores.set('vayu', Math.min(100, (scores.get('vayu') ?? BASE_SCORE) + 10));
  }

  return scores;
}

function buildTips(elements: ElementScore[]): string[] {
  const tips: string[] = [];
  const weak = elements.filter((e) => e.score < 60);
  for (const el of weak) {
    switch (el.element) {
      case 'agni':
        tips.push('Label kitchen or dining to strengthen Agni (fire) balance.');
        break;
      case 'jala':
        tips.push('Mark bathroom or utility zones for Jala (water) harmony.');
        break;
      case 'prithvi':
        tips.push('Bedroom labels anchor Prithvi (earth) stability.');
        break;
      case 'vayu':
        tips.push('Living or open zones improve Vayu (air) circulation balance.');
        break;
      case 'akash':
        tips.push('Courtyard, balcony, or puja labels enhance Akash (space).');
        break;
    }
  }
  if (tips.length === 0) {
    tips.push('Five-element balance is well represented across labelled zones.');
  }
  return tips;
}

export function analyzePanchatattva(
  manifest: Pick<ProjectManifest, 'labels' | 'walls'>,
): PanchatattvaResult {
  const labels = manifest.labels ?? [];
  const scores = scoreElements(labels);

  const elements: ElementScore[] = (Object.keys(ELEMENT_META) as PanchatattvaElement[]).map(
    (element) => {
      const score = scores.get(element) ?? BASE_SCORE;
      const meta = ELEMENT_META[element];
      return {
        element,
        label: meta.label,
        sanskrit: meta.sanskrit,
        score,
        tip: score >= 70 ? `${meta.label} element well represented` : `${meta.label} needs room labels`,
      };
    },
  );

  const balancePercent = Math.round(
    elements.reduce((sum, e) => sum + e.score, 0) / elements.length,
  );

  return {
    balancePercent,
    elements,
    tips: buildTips(elements),
  };
}
