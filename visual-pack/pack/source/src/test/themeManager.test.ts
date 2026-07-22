/**
 * Theme Manager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ThemeManager,
  getThemeManager,
  getCurrentTheme,
  switchTheme,
  validateThemeColors,
  type ThemeColors,
} from '@/modules/themeManager';

describe('ThemeManager', () => {
  let manager: ThemeManager;

  beforeEach(() => {
    ThemeManager.resetInstance();
    manager = getThemeManager();
    localStorage.clear();
  });

  describe('Theme Switching', () => {
    it('should start with architect-table theme', () => {
      const theme = manager.getCurrentTheme();
      expect(theme.id).toBe('architect-table');
    });

    it('should switch to light theme', () => {
      manager.switchTheme('light');
      const theme = manager.getCurrentTheme();
      expect(theme.id).toBe('light');
    });

    it('should switch to dark theme', () => {
      manager.switchTheme('dark');
      const theme = manager.getCurrentTheme();
      expect(theme.id).toBe('dark');
    });

    it('should switch to high-contrast theme', () => {
      manager.switchTheme('high-contrast');
      const theme = manager.getCurrentTheme();
      expect(theme.id).toBe('high-contrast');
    });
  });

  describe('Theme Retrieval', () => {
    it('should get theme by mode', () => {
      const theme = manager.getTheme('light');
      expect(theme.id).toBe('light');
      expect(theme.name).toBe('Light');
    });

    it('should get all available themes', () => {
      const themes = manager.getAllThemes();
      expect(themes.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Custom Theme', () => {
    it('should set custom theme', () => {
      const customColors: Partial<ThemeColors> = {
        background: '#2D2D2D', // Darker background for better Swan-V contrast
        text: '#FFFFFF',
        primary: '#FFD700', // Brighter gold
      };

      const result = manager.setCustomTheme(customColors);
      expect(result.valid).toBe(true);
    });

    it('should validate custom theme', () => {
      const customColors: Partial<ThemeColors> = {
        background: '#FFFFFF',
        text: '#EEEEEE', // Low contrast
      };

      const result = manager.setCustomTheme(customColors);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should apply custom theme', () => {
      const customColors: Partial<ThemeColors> = {
        background: '#2D2D2D',
        text: '#FFFFFF',
        primary: '#FFD700',
      };

      manager.setCustomTheme(customColors);
      manager.applyCustomTheme();

      const theme = manager.getCurrentTheme();
      expect(theme.id).toBe('custom');
    });
  });

  describe('Contrast Calculation', () => {
    it('should calculate contrast ratio', () => {
      const contrast = manager.calculateContrast('#FFFFFF', '#000000');
      expect(contrast).toBeCloseTo(21.0, 1);
    });

    it('should calculate Swan-V contrast', () => {
      const contrast = manager.calculateSwanVContrast('#FFFFFF');
      expect(contrast).toBeGreaterThan(2.0); // Gold on white has lower contrast
    });

    it('should validate high contrast', () => {
      const contrast = manager.calculateContrast('#FFFFFF', '#000000');
      expect(contrast).toBeGreaterThan(7.0); // AAA level
    });
  });

  describe('Theme Validation', () => {
    it('should validate valid theme', () => {
      const colors: ThemeColors = {
        background: '#1A1A1A', // Dark background for better Swan-V contrast
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
      };

      const result = manager.validateTheme(colors);
      expect(result.valid).toBe(true);
    });

    it('should reject low contrast text', () => {
      const colors: ThemeColors = {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        primary: '#D4AF37',
        secondary: '#FFB6C1',
        accent: '#FF8C00',
        text: '#CCCCCC', // Low contrast
        textSecondary: '#666666',
        border: '#E0E0E0',
        error: '#DC2626',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6',
      };

      const result = manager.validateTheme(colors);
      expect(result.valid).toBe(false);
    });

    it('should warn about AAA level', () => {
      const colors: ThemeColors = {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        primary: '#D4AF37',
        secondary: '#FFB6C1',
        accent: '#FF8C00',
        text: '#595959', // AA but not AAA
        textSecondary: '#666666',
        border: '#E0E0E0',
        error: '#DC2626',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6',
      };

      const result = manager.validateTheme(colors);
      // Should have warnings about text and Swan-V contrast
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme preference', () => {
      manager.switchTheme('dark');
      const saved = localStorage.getItem('theme-preference');
      expect(saved).toBe('dark');
    });

    it('should load theme preference', () => {
      localStorage.setItem('theme-preference', 'dark');
      ThemeManager.resetInstance();
      const newManager = getThemeManager();
      expect(newManager.getCurrentTheme().id).toBe('dark');
    });

    it('should save custom theme', () => {
      const customColors: Partial<ThemeColors> = {
        background: '#2D2D2D',
        text: '#FFFFFF',
        primary: '#FFD700',
      };

      manager.setCustomTheme(customColors);
      manager.applyCustomTheme();

      const saved = localStorage.getItem('custom-theme');
      expect(saved).toBeTruthy();
    });
  });

  describe('Theme Subscription', () => {
    it('should notify listeners on theme change', () => {
      let notified = false;
      manager.subscribe(() => {
        notified = true;
      });

      manager.switchTheme('dark');
      expect(notified).toBe(true);
    });

    it('should unsubscribe listener', () => {
      let count = 0;
      const unsubscribe = manager.subscribe(() => {
        count++;
      });

      manager.switchTheme('dark');
      expect(count).toBe(1);

      unsubscribe();
      manager.switchTheme('light');
      expect(count).toBe(1); // Should not increment
    });
  });

  describe('Theme Reset', () => {
    it('should reset to default theme', () => {
      manager.switchTheme('dark');
      manager.resetTheme();
      expect(manager.getCurrentTheme().id).toBe('architect-table');
    });
  });

  describe('Convenience Functions', () => {
    it('should get current theme', () => {
      const theme = getCurrentTheme();
      expect(theme).toBeTruthy();
    });

    it('should switch theme', () => {
      switchTheme('dark');
      expect(getCurrentTheme().id).toBe('dark');
    });

    it('should validate theme colors', () => {
      const colors: ThemeColors = {
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
      };

      const result = validateThemeColors(colors);
      expect(result.valid).toBe(true);
    });
  });
});
