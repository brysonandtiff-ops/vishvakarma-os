import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import {
  DEFAULT_VISUAL_THEME,
  VISUAL_THEME_STORAGE_KEY,
  VISUAL_THEMES,
  isVisualThemeId,
  type VisualThemeId,
} from '@/config/visualThemes';

const VISUAL_THEME_CONTROLLER_BOUNDARY = 'visual-only';

function getVisualThemeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredTheme(): VisualThemeId {
  const storage = getVisualThemeStorage();
  if (!storage) return DEFAULT_VISUAL_THEME;

  try {
    const stored = storage.getItem(VISUAL_THEME_STORAGE_KEY);
    return isVisualThemeId(stored) ? stored : DEFAULT_VISUAL_THEME;
  } catch {
    return DEFAULT_VISUAL_THEME;
  }
}

function persistStoredTheme(theme: VisualThemeId) {
  const storage = getVisualThemeStorage();
  if (!storage) return;

  try {
    if (theme === DEFAULT_VISUAL_THEME) {
      storage.removeItem(VISUAL_THEME_STORAGE_KEY);
      return;
    }

    storage.setItem(VISUAL_THEME_STORAGE_KEY, theme);
  } catch {
    // Visual identity is presentation-only; blocked browser storage must not
    // prevent the app shell from rendering.
  }
}

function applyTheme(theme: VisualThemeId) {
  if (typeof document === 'undefined') return;

  if (theme === DEFAULT_VISUAL_THEME) {
    delete document.documentElement.dataset.visualTheme;
    document.documentElement.removeAttribute('data-visual-theme');
    return;
  }

  document.documentElement.dataset.visualTheme = theme;
}

export default function VisualThemeController() {
  const [theme, setTheme] = useState<VisualThemeId>(() => readStoredTheme());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    applyTheme(theme);
    persistStoredTheme(theme);
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
      data-controller-boundary={VISUAL_THEME_CONTROLLER_BOUNDARY}
      data-visual-scope="presentation-only"
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
