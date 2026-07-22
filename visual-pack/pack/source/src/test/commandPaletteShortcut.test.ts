import { describe, expect, it } from 'vitest';
import { getCommandPaletteShortcutLabel } from '@/utils/commandPaletteShortcut';

describe('command palette shortcut label', () => {
  it('shows Ctrl+K on Windows-style platforms', () => {
    const original = navigator.platform;
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });
    expect(getCommandPaletteShortcutLabel()).toBe('Ctrl+K');
    Object.defineProperty(navigator, 'platform', {
      value: original,
      configurable: true,
    });
  });

  it('shows ⌘K on Mac platforms', () => {
    const original = navigator.platform;
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });
    expect(getCommandPaletteShortcutLabel()).toBe('⌘K');
    Object.defineProperty(navigator, 'platform', {
      value: original,
      configurable: true,
    });
  });
});
