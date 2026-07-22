import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ANCHOR_ROOT = join(process.cwd(), 'tests', 'anchors');

export function loadAnchor<T>(fileName: string): T {
  return JSON.parse(readFileSync(join(ANCHOR_ROOT, fileName), 'utf8')) as T;
}

export interface StructuralBandExpectations {
  min?: number;
  max?: number;
  equals?: number;
}

export function assertStructuralExpectations(
  output: Record<string, number>,
  expectations: Record<string, StructuralBandExpectations>,
): void {
  for (const [key, band] of Object.entries(expectations)) {
    const value = output[key];
    if (value == null) {
      throw new Error(`Structural anchor missing metric: ${key}`);
    }
    if (band.equals != null) {
      expectValue(value, band.equals, `equals ${band.equals}`, key);
    }
    if (band.min != null && value < band.min) {
      throw new Error(`Structural anchor ${key}: ${value} < min ${band.min}`);
    }
    if (band.max != null && value > band.max) {
      throw new Error(`Structural anchor ${key}: ${value} > max ${band.max}`);
    }
  }
}

function expectValue(actual: number, expected: number, label: string, key: string): void {
  if (actual !== expected) {
    throw new Error(`Structural anchor ${key}: ${actual} !== ${label}`);
  }
}
