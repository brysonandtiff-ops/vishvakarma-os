/**
 * Accessibility Layer Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AccessibilityLayer,
  getAccessibilityLayer,
  enableHighContrast,
  setFontSize,
  announceToScreenReader,
  getSwanVAltText,
} from '@/modules/accessibilityLayer';

describe('AccessibilityLayer', () => {
  let layer: AccessibilityLayer;

  beforeEach(() => {
    AccessibilityLayer.resetInstance();
    layer = getAccessibilityLayer();
    localStorage.clear();
  });

  describe('Configuration', () => {
    it('should get default configuration', () => {
      const config = layer.getConfig();
      expect(config.highContrast).toBe(false);
      expect(config.fontSize).toBe(1.0);
      expect(config.reducedMotion).toBe(false);
      expect(config.screenReaderMode).toBe(false);
      expect(config.keyboardOnly).toBe(false);
    });

    it('should update configuration', () => {
      layer.updateConfig({ highContrast: true, fontSize: 1.5 });
      const config = layer.getConfig();
      expect(config.highContrast).toBe(true);
      expect(config.fontSize).toBe(1.5);
    });
  });

  describe('High Contrast Mode', () => {
    it('should enable high contrast', () => {
      layer.enableHighContrast();
      const config = layer.getConfig();
      expect(config.highContrast).toBe(true);
    });

    it('should disable high contrast', () => {
      layer.enableHighContrast();
      layer.disableHighContrast();
      const config = layer.getConfig();
      expect(config.highContrast).toBe(false);
    });
  });

  describe('Font Scaling', () => {
    it('should set font size', () => {
      layer.setFontSize(1.5);
      const config = layer.getConfig();
      expect(config.fontSize).toBe(1.5);
    });

    it('should clamp font size to minimum', () => {
      layer.setFontSize(0.5);
      const config = layer.getConfig();
      expect(config.fontSize).toBe(1.0);
    });

    it('should clamp font size to maximum', () => {
      layer.setFontSize(3.0);
      const config = layer.getConfig();
      expect(config.fontSize).toBe(2.0);
    });
  });

  describe('Reduced Motion', () => {
    it('should enable reduced motion', () => {
      layer.enableReducedMotion();
      const config = layer.getConfig();
      expect(config.reducedMotion).toBe(true);
    });

    it('should disable reduced motion', () => {
      layer.enableReducedMotion();
      layer.disableReducedMotion();
      const config = layer.getConfig();
      expect(config.reducedMotion).toBe(false);
    });
  });

  describe('Screen Reader Mode', () => {
    it('should enable screen reader mode', () => {
      layer.enableScreenReaderMode();
      const config = layer.getConfig();
      expect(config.screenReaderMode).toBe(true);
    });

    it('should disable screen reader mode', () => {
      layer.enableScreenReaderMode();
      layer.disableScreenReaderMode();
      const config = layer.getConfig();
      expect(config.screenReaderMode).toBe(false);
    });
  });

  describe('ARIA Labels', () => {
    it('should register ARIA label', () => {
      layer.registerAriaLabel('test-element', {
        element: '#test',
        label: 'Test Element',
        description: 'A test element',
        role: 'button',
      });

      const label = layer.getAriaLabel('test-element');
      expect(label).toBeTruthy();
      expect(label?.label).toBe('Test Element');
    });

    it('should get Swan-V alt text', () => {
      const altText = layer.getSwanVAltText();
      expect(altText).toContain('Swan-V Primary Mark');
      expect(altText).toContain('elegant swan');
    });
  });

  describe('Focusable Elements', () => {
    it('should register focusable element', () => {
      const element = document.createElement('button');
      element.id = 'test-button';
      document.body.appendChild(element);

      layer.registerFocusableElement({
        id: 'test-button',
        element,
        tabIndex: 0,
        ariaLabel: 'Test Button',
      });

      // Cleanup
      document.body.removeChild(element);
    });

    it('should unregister focusable element', () => {
      const element = document.createElement('button');
      element.id = 'test-button';
      document.body.appendChild(element);

      layer.registerFocusableElement({
        id: 'test-button',
        element,
        tabIndex: 0,
      });

      layer.unregisterFocusableElement('test-button');

      // Cleanup
      document.body.removeChild(element);
    });

    it('should focus next element', () => {
      const element1 = document.createElement('button');
      element1.id = 'button-1';
      const element2 = document.createElement('button');
      element2.id = 'button-2';

      document.body.appendChild(element1);
      document.body.appendChild(element2);

      layer.registerFocusableElement({
        id: 'button-1',
        element: element1,
        tabIndex: 0,
      });

      layer.registerFocusableElement({
        id: 'button-2',
        element: element2,
        tabIndex: 1,
      });

      layer.focusNext();

      // Cleanup
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });

    it('should focus previous element', () => {
      const element1 = document.createElement('button');
      element1.id = 'button-1';
      const element2 = document.createElement('button');
      element2.id = 'button-2';

      document.body.appendChild(element1);
      document.body.appendChild(element2);

      layer.registerFocusableElement({
        id: 'button-1',
        element: element1,
        tabIndex: 0,
      });

      layer.registerFocusableElement({
        id: 'button-2',
        element: element2,
        tabIndex: 1,
      });

      layer.focusNext();
      layer.focusPrevious();

      // Cleanup
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });

    it('should focus element by ID', () => {
      const element = document.createElement('button');
      element.id = 'test-button';
      document.body.appendChild(element);

      layer.registerFocusableElement({
        id: 'test-button',
        element,
        tabIndex: 0,
      });

      layer.focusElement('test-button');

      // Cleanup
      document.body.removeChild(element);
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce message', () => {
      // Create announcer element
      AccessibilityLayer.createAriaLiveAnnouncer();

      layer.announce('Test message');

      const announcer = document.getElementById('aria-live-announcer');
      expect(announcer).toBeTruthy();
    });

    it('should announce with priority', () => {
      AccessibilityLayer.createAriaLiveAnnouncer();

      layer.announce('Urgent message', 'assertive');

      const announcer = document.getElementById('aria-live-announcer');
      expect(announcer?.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Accessibility Validation', () => {
    it('should check if element is accessible', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Test Button');
      document.body.appendChild(button);

      const isAccessible = layer.isAccessible(button);
      expect(isAccessible).toBe(true);

      document.body.removeChild(button);
    });

    it('should detect missing ARIA label', () => {
      const button = document.createElement('button');
      button.tabIndex = 0;
      document.body.appendChild(button);

      const isAccessible = layer.isAccessible(button);
      expect(isAccessible).toBe(false);

      document.body.removeChild(button);
    });

    it('should validate accessibility', () => {
      const result = layer.validateAccessibility();
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('Configuration Persistence', () => {
    it('should save configuration', () => {
      layer.updateConfig({ highContrast: true, fontSize: 1.5 });

      const saved = localStorage.getItem('accessibility-config');
      expect(saved).toBeTruthy();
    });

    it('should load configuration', () => {
      localStorage.setItem(
        'accessibility-config',
        JSON.stringify({ highContrast: true, fontSize: 1.5 })
      );

      AccessibilityLayer.resetInstance();
      const newLayer = getAccessibilityLayer();
      const config = newLayer.getConfig();

      expect(config.highContrast).toBe(true);
      expect(config.fontSize).toBe(1.5);
    });
  });

  describe('ARIA Live Announcer', () => {
    it('should create ARIA live announcer', () => {
      // Clean up any existing announcer first
      const existing = document.getElementById('aria-live-announcer');
      if (existing) {
        existing.remove();
      }

      AccessibilityLayer.createAriaLiveAnnouncer();

      const announcer = document.getElementById('aria-live-announcer');
      expect(announcer).toBeTruthy();
      expect(announcer?.getAttribute('aria-live')).toBe('polite');

      // Clean up
      if (announcer) {
        announcer.remove();
      }
    });

    it('should not create duplicate announcer', () => {
      AccessibilityLayer.createAriaLiveAnnouncer();
      AccessibilityLayer.createAriaLiveAnnouncer();

      const announcers = document.querySelectorAll('#aria-live-announcer');
      expect(announcers.length).toBe(1);
    });
  });

  describe('Convenience Functions', () => {
    it('should enable high contrast', () => {
      enableHighContrast();
      const config = getAccessibilityLayer().getConfig();
      expect(config.highContrast).toBe(true);
    });

    it('should set font size', () => {
      setFontSize(1.5);
      const config = getAccessibilityLayer().getConfig();
      expect(config.fontSize).toBe(1.5);
    });

    it('should announce to screen reader', () => {
      AccessibilityLayer.createAriaLiveAnnouncer();
      announceToScreenReader('Test message');

      const announcer = document.getElementById('aria-live-announcer');
      expect(announcer).toBeTruthy();
    });

    it('should get Swan-V alt text', () => {
      const altText = getSwanVAltText();
      expect(altText).toContain('Swan-V');
    });
  });
});
