import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    applyTheme(theme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VISUAL_THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

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
    <aside className="vish-theme-controller" aria-label="Visual identity mode" data-testid="visual-theme-controller">
      <div className="vish-theme-controller__header">
        <span className="vish-theme-controller__eyebrow">Visual identity</span>
        <strong>{activeTheme.shortLabel}</strong>
      </div>
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
    </aside>
  );
}
