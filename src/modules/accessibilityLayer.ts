/**
 * Accessibility Layer Module
 * 
 * Provides comprehensive accessibility features including ARIA labels,
 * screen reader support, keyboard navigation, and contrast engine.
 * 
 * Part of STEP 9 - Theming & Accessibility
 */

export interface AccessibilityConfig {
  highContrast: boolean;
  fontSize: number; // 1.0 - 2.0
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardOnly: boolean;
}

export interface AriaLabel {
  element: string;
  label: string;
  description?: string;
  role?: string;
}

export interface FocusableElement {
  id: string;
  element: HTMLElement;
  tabIndex: number;
  ariaLabel?: string;
}

/**
 * Accessibility Layer Class
 */
export class AccessibilityLayer {
  private static instance: AccessibilityLayer | null = null;
  private config: AccessibilityConfig = {
    highContrast: false,
    fontSize: 1.0,
    reducedMotion: false,
    screenReaderMode: false,
    keyboardOnly: false,
  };

  private ariaLabels: Map<string, AriaLabel> = new Map();
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex = -1;

  // Swan-V logo alt text
  private readonly swanVAltText =
    'Vishvakarma.OS - Swan-V Primary Mark: An elegant swan with spread wings forming a V shape, symbolizing precision and craftsmanship in architectural design';

  private constructor() {
    this.loadConfig();
    this.applyConfig();
    this.setupEventListeners();
    this.registerDefaultAriaLabels();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AccessibilityLayer {
    if (!this.instance) {
      this.instance = new AccessibilityLayer();
    }
    return this.instance;
  }

  /**
   * Get current configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.applyConfig();
    this.saveConfig();
  }

  /**
   * Enable high contrast mode
   */
  enableHighContrast(): void {
    this.updateConfig({ highContrast: true });
  }

  /**
   * Disable high contrast mode
   */
  disableHighContrast(): void {
    this.updateConfig({ highContrast: false });
  }

  /**
   * Set font size scale
   */
  setFontSize(scale: number): void {
    const clampedScale = Math.max(1.0, Math.min(2.0, scale));
    this.updateConfig({ fontSize: clampedScale });
  }

  /**
   * Enable reduced motion
   */
  enableReducedMotion(): void {
    this.updateConfig({ reducedMotion: true });
  }

  /**
   * Disable reduced motion
   */
  disableReducedMotion(): void {
    this.updateConfig({ reducedMotion: false });
  }

  /**
   * Enable screen reader mode
   */
  enableScreenReaderMode(): void {
    this.updateConfig({ screenReaderMode: true });
  }

  /**
   * Disable screen reader mode
   */
  disableScreenReaderMode(): void {
    this.updateConfig({ screenReaderMode: false });
  }

  /**
   * Register ARIA label
   */
  registerAriaLabel(id: string, label: AriaLabel): void {
    this.ariaLabels.set(id, label);
    this.applyAriaLabel(id, label);
  }

  /**
   * Get ARIA label
   */
  getAriaLabel(id: string): AriaLabel | undefined {
    return this.ariaLabels.get(id);
  }

  /**
   * Get Swan-V logo alt text
   */
  getSwanVAltText(): string {
    return this.swanVAltText;
  }

  /**
   * Register focusable element
   */
  registerFocusableElement(element: FocusableElement): void {
    this.focusableElements.push(element);
    this.focusableElements.sort((a, b) => a.tabIndex - b.tabIndex);
  }

  /**
   * Unregister focusable element
   */
  unregisterFocusableElement(id: string): void {
    this.focusableElements = this.focusableElements.filter(el => el.id !== id);
  }

  /**
   * Focus next element
   */
  focusNext(): void {
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentFocusIndex].element.focus();
  }

  /**
   * Focus previous element
   */
  focusPrevious(): void {
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex =
      (this.currentFocusIndex - 1 + this.focusableElements.length) %
      this.focusableElements.length;
    this.focusableElements[this.currentFocusIndex].element.focus();
  }

  /**
   * Focus element by ID
   */
  focusElement(id: string): void {
    const index = this.focusableElements.findIndex(el => el.id === id);
    if (index !== -1) {
      this.currentFocusIndex = index;
      this.focusableElements[index].element.focus();
    }
  }

  /**
   * Announce to screen reader
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.getElementById('aria-live-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }

  /**
   * Check if element is accessible
   */
  isAccessible(element: HTMLElement): boolean {
    // Check if element has proper ARIA attributes
    const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
    const hasRole = element.hasAttribute('role');
    const isInteractive = element.tabIndex >= 0;

    return hasAriaLabel || hasRole || !isInteractive;
  }

  /**
   * Validate accessibility
   */
  validateAccessibility(): {
    passed: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for missing ARIA labels
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(el => {
      if (!this.isAccessible(el as HTMLElement)) {
        issues.push(`Element missing ARIA label: ${el.tagName} ${el.id || el.className}`);
      }
    });

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      if (level > lastLevel + 1) {
        issues.push(`Heading hierarchy skip: ${heading.tagName} after h${lastLevel}`);
      }
      lastLevel = level;
    });

    // Check for images without alt text
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt) {
        issues.push(`Image missing alt text: ${img.src}`);
      }
    });

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  /**
   * Apply configuration to DOM
   */
  private applyConfig(): void {
    const root = document.documentElement;

    // Apply font size
    root.style.setProperty('--font-scale', this.config.fontSize.toString());

    // Apply high contrast
    if (this.config.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }

    // Apply reduced motion
    if (this.config.reducedMotion) {
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.removeAttribute('data-reduced-motion');
    }

    // Apply screen reader mode
    if (this.config.screenReaderMode) {
      root.setAttribute('data-screen-reader', 'true');
    } else {
      root.removeAttribute('data-screen-reader');
    }

    // Apply keyboard only mode
    if (this.config.keyboardOnly) {
      root.setAttribute('data-keyboard-only', 'true');
    } else {
      root.removeAttribute('data-keyboard-only');
    }
  }

  /**
   * Apply ARIA label to element
   */
  private applyAriaLabel(id: string, label: AriaLabel): void {
    const element = document.querySelector(label.element);
    if (element) {
      element.setAttribute('aria-label', label.label);
      if (label.description) {
        element.setAttribute('aria-description', label.description);
      }
      if (label.role) {
        element.setAttribute('role', label.role);
      }
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Detect keyboard-only navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.updateConfig({ keyboardOnly: true });
      }
    });

    document.addEventListener('mousedown', () => {
      this.updateConfig({ keyboardOnly: false });
    });

    // Detect system preferences (only if matchMedia is available)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (prefersReducedMotion.matches) {
        this.enableReducedMotion();
      }

      prefersReducedMotion.addEventListener('change', (e) => {
        if (e.matches) {
          this.enableReducedMotion();
        } else {
          this.disableReducedMotion();
        }
      });

      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      if (prefersHighContrast.matches) {
        this.enableHighContrast();
      }

      prefersHighContrast.addEventListener('change', (e) => {
        if (e.matches) {
          this.enableHighContrast();
        } else {
          this.disableHighContrast();
        }
      });
    }
  }

  /**
   * Register default ARIA labels
   */
  private registerDefaultAriaLabels(): void {
    // Swan-V logo
    this.registerAriaLabel('swan-v-logo', {
      element: '[data-swan-v-logo]',
      label: this.swanVAltText,
      role: 'img',
    });

    // Tool rail
    this.registerAriaLabel('tool-rail', {
      element: '[data-tool-rail]',
      label: 'Tool palette',
      description: 'Select drawing and editing tools',
      role: 'toolbar',
    });

    // Canvas
    this.registerAriaLabel('canvas', {
      element: '[data-canvas]',
      label: 'Blueprint canvas',
      description: 'Draw and edit architectural blueprints',
      role: 'application',
    });

    // Properties panel
    this.registerAriaLabel('properties-panel', {
      element: '[data-properties-panel]',
      label: 'Properties panel',
      description: 'View and edit element properties',
      role: 'complementary',
    });
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('accessibility-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save accessibility config:', error);
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('accessibility-config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load accessibility config:', error);
    }
  }

  /**
   * Create ARIA live announcer
   */
  static createAriaLiveAnnouncer(): void {
    if (!document.getElementById('aria-live-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'aria-live-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
    }
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
export function getAccessibilityLayer(): AccessibilityLayer {
  return AccessibilityLayer.getInstance();
}

export function enableHighContrast(): void {
  getAccessibilityLayer().enableHighContrast();
}

export function setFontSize(scale: number): void {
  getAccessibilityLayer().setFontSize(scale);
}

export function announceToScreenReader(message: string, priority?: 'polite' | 'assertive'): void {
  getAccessibilityLayer().announce(message, priority);
}

export function getSwanVAltText(): string {
  return getAccessibilityLayer().getSwanVAltText();
}
