import { describe, expect, it } from 'vitest';
import { shouldIgnoreKeyboardShortcuts } from '@/utils/keyboardShortcuts';

function makeKeyEvent(target: EventTarget, key = 'w'): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

describe('shouldIgnoreKeyboardShortcuts', () => {
  it('ignores events from text inputs', () => {
    const input = document.createElement('input');
    expect(shouldIgnoreKeyboardShortcuts(makeKeyEvent(input))).toBe(true);
  });

  it('ignores events from contenteditable elements', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    expect(shouldIgnoreKeyboardShortcuts(makeKeyEvent(div))).toBe(true);
  });

  it('ignores events inside dialogs', () => {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const inner = document.createElement('span');
    dialog.appendChild(inner);
    document.body.appendChild(dialog);
    expect(shouldIgnoreKeyboardShortcuts(makeKeyEvent(inner))).toBe(true);
    document.body.removeChild(dialog);
  });

  it('allows canvas-level shortcuts', () => {
    const canvas = document.createElement('canvas');
    expect(shouldIgnoreKeyboardShortcuts(makeKeyEvent(canvas))).toBe(false);
  });
});
