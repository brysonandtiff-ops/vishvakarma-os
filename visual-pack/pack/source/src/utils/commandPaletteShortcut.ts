/** Platform-aware label for the workspace command palette shortcut. */
export function getCommandPaletteShortcutLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl+K';
  const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
  return isMac ? '⌘K' : 'Ctrl+K';
}
