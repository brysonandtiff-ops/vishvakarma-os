export type CanvasInputMode = 'mouse' | 'touch' | 'pen';

export function getInputModeFromPointerType(pointerType: string): CanvasInputMode {
  if (pointerType === 'pen') return 'pen';
  if (pointerType === 'touch') return 'touch';
  return 'mouse';
}

export function getHitAreaForMode(mode: CanvasInputMode, base = 10): number {
  if (mode === 'pen') return base + 8;
  if (mode === 'touch') return base + 16;
  return base;
}

/** Standard eraser end on pen / USB tablet styluses (Pointer Events button 5). */
export function isEraserPointerButton(button: number): boolean {
  return button === 5;
}
