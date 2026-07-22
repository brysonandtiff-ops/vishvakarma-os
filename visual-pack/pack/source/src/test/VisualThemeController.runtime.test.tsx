import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VisualThemeController from '@/components/common/VisualThemeController';
import { VISUAL_THEME_STORAGE_KEY } from '@/config/visualThemes';

function resetVisualThemeState() {
  window.localStorage.clear();
  delete document.documentElement.dataset.visualTheme;
  document.documentElement.removeAttribute('data-visual-theme');
}

describe('VisualThemeController runtime boundary', () => {
  beforeEach(() => {
    resetVisualThemeState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetVisualThemeState();
  });

  it('keeps blocked browser storage from crashing the app shell', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('visual theme storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('visual theme storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('visual theme storage unavailable');
    });

    render(<VisualThemeController />);

    expect(screen.getByTestId('visual-theme-controller')).toHaveAttribute(
      'data-controller-boundary',
      'visual-only',
    );
    expect(document.documentElement).not.toHaveAttribute('data-visual-theme');
  });

  it('applies alternate presentation themes without persisting default shell state', () => {
    window.localStorage.setItem(VISUAL_THEME_STORAGE_KEY, 'midnight-obsidian');

    render(<VisualThemeController />);

    expect(window.localStorage.getItem(VISUAL_THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-visual-theme');

    fireEvent.click(screen.getByRole('button', { name: /visual identity: obsidian/i }));
    fireEvent.click(screen.getByRole('button', { name: /solar/i }));

    expect(document.documentElement.dataset.visualTheme).toBe('solar-mandala');
    expect(window.localStorage.getItem(VISUAL_THEME_STORAGE_KEY)).toBe('solar-mandala');
  });
});
