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

  it('detects eraser via button or buttons bitmask', () => {
    expect(isEraserPointerActive({ button: 5, buttons: 32 })).toBe(true);
    expect(isEraserPointerActive({ button: 0, buttons: 32 })).toBe(true);
    expect(isEraserPointerActive({ button: 0, buttons: 1 })).toBe(false);
    expect(isEraserPointerActive({ button: 0, buttons: 0 })).toBe(false);
  });
});
