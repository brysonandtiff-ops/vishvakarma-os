import { useEffect } from 'react';
import type { ToolType } from '@/types';

interface UseKeyboardAcceleratorsProps {
  onToolSelect: (tool: ToolType) => void;
  onExport: () => void;
  isActive?: boolean;
}

export function useKeyboardAccelerators({
  onToolSelect,
  onExport,
  isActive = true,
}: UseKeyboardAcceleratorsProps) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle shortcuts
      if (e.key.toLowerCase() === 'w' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        onToolSelect('wall');
      } else if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        onToolSelect('door');
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        onToolSelect('select');
      } else if (e.key.toLowerCase() === 'e' && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        onExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onToolSelect, onExport]);
}
