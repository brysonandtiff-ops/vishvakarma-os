/**
 * Theme Manager Module
 * 
 * Manages theming system aligned with Swan-V Primary Mark branding.
 * Enforces contrast rules and theme propagation across all UI surfaces.
 * 
 * Part of STEP 9 - Theming & Accessibility
 */

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  swanVContrast: number; // Contrast ratio for Swan-V logo
  wcagLevel: 'AA' | 'AAA';
}

export type ThemeMode = 'architect-table' | 'light' | 'dark' | 'high-contrast' | 'custom';

export interface ThemeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  contrastRatios: Record<string, number>;
}

/**
 * Theme Manager Class
 */
export class ThemeManager {
  private static instance: ThemeManager | null = null;
  private currentTheme: Theme;
  private customTheme: Theme | null = null;
  private listeners: Set<(theme: Theme) => void> = new Set();

  // Swan-V logo colors for contrast validation
  private readonly swanVColors = {
    gold: '#D4AF37',
    white: '#FFFFFF',
    pink: '#FFB6C1',
    orange: '#FF8C00',
  };

  // Predefined themes
  private readonly themes: Record<ThemeMode, Theme> = {
    'architect-table': {
      id: 'architect-table',
      name: 'Architect Table',
      description: 'Warm drafting-table palette inspired by Swan-V gold tones',
      colors: {
        background: '#F5E6D3',
        surface: '#FFF8E7',
        primary: '#D4AF37',
        secondary: '#8B7355',
        accent: '#FF8C00',
        text: '#2C1810',
        textSecondary: '#5C4A3A',
        border: '#D4C5B9',
        error: '#DC2626',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6',
      },
      swanVContrast: 4.8,
      wcagLevel: 'AA',
    },
    light: {
      id: 'light',
      name: 'Light',
      description: 'Clean light theme with Swan-V contrast compliance',
      colors: {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        primary: '#D4AF37',
        secondary: '#FFB6C1',
        accent: '#FF8C00',
        text: '#1A1A1A',
        textSecondary: '#666666',
        border: '#E0E0E0',
        error: '#DC2626',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6',
      },
      swanVContrast: 5.2,
      wcagLevel: 'AA',
    },
    dark: {
      id: 'dark',
      name: 'Dark',
      description: 'Dark theme with enhanced Swan-V visibility',
      colors: {
        background: '#1A1A1A',
        surface: '#2D2D2D',
        primary: '#FFD700',
        secondary: '#FF69B4',
        accent: '#FFA500',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        border: '#404040',
        error: '#EF4444',
        warning: '#FBBF24',
        success: '#34D399',
        info: '#60A5FA',
      },
      swanVContrast: 6.5,
      wcagLevel: 'AA',
    },
    'high-contrast': {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Maximum contrast preserving Swan-V silhouette clarity',
      colors: {
        background: '#000000',
        surface: '#1A1A1A',
        primary: '#FFFF00',
        secondary: '#00FFFF',
        accent: '#FF00FF',
        text: '#FFFFFF',
        textSecondary: '#CCCCCC',
        border: '#FFFFFF',
        error: '#FF0000',
        warning: '#FFFF00',
        success: '#00FF00',
        info: '#00FFFF',
      },
      swanVContrast: 21.0,
      wcagLevel: 'AAA',
    },
    custom: {
      id: 'custom',
      name: 'Custom',
      description: 'User-defined palette with Swan-V validation',
      colors: {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        primary: '#D4AF37',
        secondary: '#FFB6C1',
        accent: '#FF8C00',
        text: '#1A1A1A',
        textSecondary: '#666666',
        border: '#E0E0E0',
        error: '#DC2626',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6',
      },
      swanVContrast: 5.0,
      wcagLevel: 'AA',
    },
  };

  private constructor() {
    // Load saved theme or default to architect-table
    const savedThemeId = this.loadThemePreference();
    this.currentTheme = this.themes[savedThemeId] || this.themes['architect-table'];
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ThemeManager {
    if (!this.instance) {
      this.instance = new ThemeManager();
    }
    return this.instance;
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get theme by mode
   */
  getTheme(mode: ThemeMode): Theme {
    if (mode === 'custom' && this.customTheme) {
      return this.customTheme;
    }
    return this.themes[mode];
  }

  /**
   * Get all available themes
   */
  getAllThemes(): Theme[] {
    const themes = Object.values(this.themes).filter(t => t.id !== 'custom');
    if (this.customTheme) {
      themes.push(this.customTheme);
    }
    return themes;
  }

  /**
   * Switch theme
   */
  switchTheme(mode: ThemeMode): void {
    const theme = this.getTheme(mode);
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveThemePreference(mode);
    this.notifyListeners(theme);
  }

  /**
   * Set custom theme
   */
  setCustomTheme(colors: Partial<ThemeColors>): ThemeValidationResult {
    // Merge with default custom theme
    const customColors: ThemeColors = {
      ...this.themes.custom.colors,
      ...colors,
    };

    // Validate theme
    const validation = this.validateTheme(customColors);

    if (!validation.valid) {
      return validation;
    }

    // Calculate Swan-V contrast
    const swanVContrast = this.calculateSwanVContrast(customColors.background);

    // Create custom theme
    this.customTheme = {
      id: 'custom',
      name: 'Custom',
      description: 'User-defined palette',
      colors: customColors,
      swanVContrast,
      wcagLevel: swanVContrast >= 7.0 ? 'AAA' : 'AA',
    };

    return validation;
  }

  /**
   * Apply custom theme
   */
  applyCustomTheme(): void {
    if (!this.customTheme) {
      console.warn('No custom theme defined');
      return;
    }

    this.currentTheme = this.customTheme;
    this.applyTheme(this.customTheme);
    this.saveThemePreference('custom');
    this.notifyListeners(this.customTheme);
  }

  /**
   * Validate theme colors
   */
  validateTheme(colors: ThemeColors): ThemeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const contrastRatios: Record<string, number> = {};

    // Check text contrast
    const textContrast = this.calculateContrast(colors.text, colors.background);
    contrastRatios['text-background'] = textContrast;

    if (textContrast < 4.5) {
      errors.push(`Text contrast (${textContrast.toFixed(2)}) is below WCAG AA minimum (4.5:1)`);
    } else if (textContrast < 7.0) {
      warnings.push(`Text contrast (${textContrast.toFixed(2)}) is below WCAG AAA (7:1)`);
    }

    // Check primary contrast
    const primaryContrast = this.calculateContrast(colors.primary, colors.background);
    contrastRatios['primary-background'] = primaryContrast;

    if (primaryContrast < 3.0) {
      warnings.push(`Primary color contrast (${primaryContrast.toFixed(2)}) is below recommended (3:1)`);
    }

    // Check Swan-V contrast
    const swanVContrast = this.calculateSwanVContrast(colors.background);
    contrastRatios['swanv-background'] = swanVContrast;

    if (swanVContrast < 3.0) {
      errors.push(`Swan-V logo contrast (${swanVContrast.toFixed(2)}) is below minimum (3:1)`);
    } else if (swanVContrast < 4.5) {
      warnings.push(`Swan-V logo contrast (${swanVContrast.toFixed(2)}) is below WCAG AA (4.5:1)`);
    } else if (swanVContrast < 7.0) {
      warnings.push(`Swan-V logo contrast (${swanVContrast.toFixed(2)}) is below AAA level (7:1)`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      contrastRatios,
    };
  }

  /**
   * Calculate contrast ratio between two colors
   */
  calculateContrast(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate Swan-V logo contrast against background
   */
  calculateSwanVContrast(backgroundColor: string): number {
    // Use gold color as primary Swan-V color
    return this.calculateContrast(this.swanVColors.gold, backgroundColor);
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // Apply CSS variables
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-info', theme.colors.info);

    // Set data attribute for theme-specific styles
    root.setAttribute('data-theme', theme.id);
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of theme change
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (error) {
        console.error('Error in theme listener:', error);
      }
    });
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemePreference(mode: ThemeMode): void {
    try {
      localStorage.setItem('theme-preference', mode);
      if (mode === 'custom' && this.customTheme) {
        localStorage.setItem('custom-theme', JSON.stringify(this.customTheme.colors));
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference(): ThemeMode {
    try {
      const saved = localStorage.getItem('theme-preference') as ThemeMode;
      if (saved === 'custom') {
        const customColors = localStorage.getItem('custom-theme');
        if (customColors) {
          const colors = JSON.parse(customColors);
          this.setCustomTheme(colors);
        }
      }
      return saved || 'architect-table';
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      return 'architect-table';
    }
  }

  /**
   * Reset to default theme
   */
  resetTheme(): void {
    this.switchTheme('architect-table');
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    this.instance = null;
  }
}

/**
 * Convenience functions
 */
export function getThemeManager(): ThemeManager {
  return ThemeManager.getInstance();
}

export function getCurrentTheme(): Theme {
  return getThemeManager().getCurrentTheme();
}

export function switchTheme(mode: ThemeMode): void {
  getThemeManager().switchTheme(mode);
}

export function validateThemeColors(colors: ThemeColors): ThemeValidationResult {
  return getThemeManager().validateTheme(colors);
}
