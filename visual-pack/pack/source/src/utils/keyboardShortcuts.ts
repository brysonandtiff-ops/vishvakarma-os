/** Returns true when editor/global shortcuts should be ignored (user is typing or in a dialog). */
export function shouldIgnoreKeyboardShortcuts(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }

  if (
    target.isContentEditable ||
    target.contentEditable === 'true' ||
    target.getAttribute('contenteditable') === 'true' ||
    target.closest('[contenteditable="true"]')
  ) {
    return true;
  }

  if (
    target.closest('[role="dialog"]') ||
    target.closest('[cmdk-input]') ||
    target.closest('[data-radix-popper-content-wrapper]')
  ) {
    return true;
  }

  return false;
}
