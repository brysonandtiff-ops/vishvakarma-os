import { describe, expect, it } from 'vitest';
import {
  getHitAreaForMode,
  isEraserPointerActive,
  isEraserPointerButton,
} from '@/components/editor/blueprint/inputHandlers';

describe('inputHandlers', () => {
  it('maps pointer types to hit area scaling', () => {
    expect(getHitAreaForMode('mouse', 10)).toBe(10);
    expect(getHitAreaForMode('pen', 10)).toBe(18);
    expect(getHitAreaForMode('touch', 10)).toBe(26);
  });

  it('detects eraser pointer button', () => {
    expect(isEraserPointerButton(5)).toBe(true);
    expect(isEraserPointerButton(0)).toBe(false);
  });
});
