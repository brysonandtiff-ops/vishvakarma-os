import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import {
  DEFAULT_VISUAL_THEME,
  VISUAL_THEME_STORAGE_KEY,
  VISUAL_THEMES,
  isVisualThemeId,
  type VisualThemeId,
} from '@/config/visualThemes';

function readStoredTheme(): VisualThemeId {
  if (typeof window === 'undefined') return DEFAULT_VISUAL_THEME;

  const stored = window.localStorage.getItem(VISUAL_THEME_STORAGE_KEY);
  return isVisualThemeId(stored) ? stored : DEFAULT_VISUAL_THEME;
}

function applyTheme(theme: VisualThemeId) {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.visualTheme = theme;
  if (theme === DEFAULT_VISUAL_THEME) {
    document.documentElement.removeAttribute('data-visual-theme');
  }
}

export default function VisualThemeController() {
  const [theme, setTheme] = useState<VisualThemeId>(() => readStoredTheme());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    applyTheme(theme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VISUAL_THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  // Collapse the swatch popover on outside click or Escape so the compact
  // pill never overlaps the other corner controls (voice tour, mantra, QA).
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== VISUAL_THEME_STORAGE_KEY) return;
      setTheme(isVisualThemeId(event.newValue) ? event.newValue : DEFAULT_VISUAL_THEME);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const activeTheme = useMemo(
    () => VISUAL_THEMES.find((visualTheme) => visualTheme.id === theme) ?? VISUAL_THEMES[0],
    [theme],
  );

  return (
    <aside
      ref={containerRef}
      className="vish-theme-controller"
      data-open={open ? 'true' : undefined}
      aria-label="Visual identity mode"
      data-testid="visual-theme-controller"
    >
      {open && (
        <div className="vish-theme-controller__options" role="group" aria-label="Choose visual identity theme">
          {VISUAL_THEMES.map((visualTheme) => (
            <button
              key={visualTheme.id}
              type="button"
              className="vish-theme-controller__option"
              aria-pressed={theme === visualTheme.id}
              onClick={() => setTheme(visualTheme.id)}
              title={visualTheme.description}
              style={{ '--theme-accent': visualTheme.accentHsl } as React.CSSProperties}
            >
              <span className="vish-theme-controller__swatch" aria-hidden="true" />
              <span>{visualTheme.shortLabel}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="vish-theme-controller__toggle"
        aria-expanded={open}
        aria-label={`Visual identity: ${activeTheme.shortLabel}. ${open ? 'Hide' : 'Show'} theme options`}
        onClick={() => setOpen((value) => !value)}
        style={{ '--theme-accent': activeTheme.accentHsl } as React.CSSProperties}
      >
        <span className="vish-theme-controller__swatch" aria-hidden="true" />
        <span className="vish-theme-controller__toggle-text">
          <span className="vish-theme-controller__eyebrow">Visual identity</span>
          <strong>{activeTheme.shortLabel}</strong>
        </span>
        <ChevronUp className="vish-theme-controller__chevron" size={14} aria-hidden="true" />
      </button>
    </aside>
  );
}
