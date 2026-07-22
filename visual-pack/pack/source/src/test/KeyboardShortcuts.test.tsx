import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KeyboardShortcuts from '@/components/editor/KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  describe('rendering', () => {
    it('should render trigger button', () => {
      render(<KeyboardShortcuts />);
      
      const button = screen.getByRole('button', { name: /keyboard shortcuts/i });
      expect(button).toBeInTheDocument();
    });

    it('should render keyboard icon in trigger button', () => {
      render(<KeyboardShortcuts />);
      
      const button = screen.getByRole('button', { name: /keyboard shortcuts/i });
      expect(button).toBeInTheDocument();
      // Icon is rendered as SVG
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('dialog interaction', () => {
    it('should open dialog when trigger button is clicked', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      const button = screen.getByRole('button', { name: /keyboard shortcuts/i });
      await user.click(button);
      
      // Dialog should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should display all tool shortcuts', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      // Check Tools section
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Select Tool')).toBeInTheDocument();
      expect(screen.getByText('Wall Tool')).toBeInTheDocument();
      expect(screen.getByText('Door Tool')).toBeInTheDocument();
      expect(screen.getByText('Window Tool')).toBeInTheDocument();
      expect(screen.getByText('Measure Tool')).toBeInTheDocument();
      
      // Check keyboard shortcuts
      expect(screen.getByText('V')).toBeInTheDocument();
      expect(screen.getByText('W')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('N')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('should display all view shortcuts', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      // Check View section
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Toggle Grid')).toBeInTheDocument();
      expect(screen.getByText('Toggle Snap')).toBeInTheDocument();
      expect(screen.getByText('Toggle 3D View')).toBeInTheDocument();
      
      // Check keyboard shortcuts
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('Shift+S')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display all edit shortcuts', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      // Check Edit section
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Redo')).toBeInTheDocument();
      
      // Check keyboard shortcuts
      expect(screen.getByText('Ctrl+Z')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Shift+Z')).toBeInTheDocument();
    });

    it('should display tips section', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      // Check Tips section
      expect(screen.getByText('💡 Tips:')).toBeInTheDocument();
      expect(screen.getByText(/Hover over walls with Measure tool/i)).toBeInTheDocument();
      expect(screen.getByText(/Click walls with Door\/Window tools/i)).toBeInTheDocument();
      expect(screen.getByText(/Selected walls show measurements/i)).toBeInTheDocument();
      expect(screen.getByText(/Snap-to-grid helps align walls/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should have accessible button with title', () => {
      render(<KeyboardShortcuts />);
      
      const button = screen.getByRole('button', { name: /keyboard shortcuts/i });
      expect(button).toHaveAttribute('title', 'Keyboard Shortcuts');
    });

    it('should use semantic kbd elements for shortcuts', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      // Check that kbd elements are used
      const kbdElements = screen.getAllByText(/^[VWDNMG3]$|Shift\+S|Ctrl\+Z|Ctrl\+Shift\+Z/);
      expect(kbdElements.length).toBeGreaterThan(0);
      
      // Verify they are kbd elements
      kbdElements.forEach((element) => {
        expect(element.tagName).toBe('KBD');
      });
    });
  });

  describe('structure', () => {
    it('should organize shortcuts into three sections', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      // Check section headings
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should display shortcuts in key-value pairs', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      // Check that each tool has a corresponding shortcut
      const selectTool = screen.getByText('Select Tool');
      const vKey = screen.getByText('V');
      
      expect(selectTool).toBeInTheDocument();
      expect(vKey).toBeInTheDocument();
      
      // They should be in the same container
      const container = selectTool.closest('.flex');
      expect(container).toContainElement(vKey);
    });
  });

  describe('count verification', () => {
    it('should display exactly 5 tool shortcuts', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      const toolsSection = screen.getByText('Tools').closest('div');
      const shortcuts = toolsSection?.querySelectorAll('kbd');
      
      expect(shortcuts).toHaveLength(5);
    });

    it('should display exactly 3 view shortcuts', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      const viewSection = screen.getByText('View').closest('div');
      const shortcuts = viewSection?.querySelectorAll('kbd');
      
      expect(shortcuts).toHaveLength(3);
    });

    it('should display exactly 2 edit shortcuts', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      const editSection = screen.getByText('Edit').closest('div');
      const shortcuts = editSection?.querySelectorAll('kbd');
      
      expect(shortcuts).toHaveLength(2);
    });

    it('should display exactly 4 tips', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcuts />);
      
      await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
      
      const tipsSection = screen.getByText('💡 Tips:').closest('div');
      const tips = tipsSection?.querySelectorAll('li');
      
      expect(tips).toHaveLength(4);
    });
  });
});
