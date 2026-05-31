import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolRail from '@/components/editor/ToolRail';
import type { ToolType } from '@/types';

describe('ToolRail', () => {
  const defaultProps = {
    currentTool: 'select' as ToolType,
    onToolChange: vi.fn(),
  };

  describe('rendering', () => {
    it('should render drafting tools and draft-mode tools', () => {
      render(<ToolRail {...defaultProps} workspaceMode="draft" />);

      expect(screen.getByLabelText('Select')).toBeInTheDocument();
      expect(screen.getByLabelText('Wall')).toBeInTheDocument();
      expect(screen.getByLabelText('Door')).toBeInTheDocument();
      expect(screen.getByLabelText('Window')).toBeInTheDocument();
      expect(screen.getByLabelText('Measure')).toBeInTheDocument();
      expect(screen.getByLabelText('Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Dimension')).toBeInTheDocument();
      expect(screen.getByLabelText('Room')).toBeInTheDocument();
      expect(screen.getByLabelText('Vastu')).toBeInTheDocument();
      expect(screen.queryByLabelText('Arc')).not.toBeInTheDocument();
    });

    it('uses production tool rail class for iPad layout', () => {
      const { container } = render(<ToolRail {...defaultProps} />);
      expect(container.querySelector('.vish-tool-rail')).toBeInTheDocument();
    });
  });

  describe('tool selection', () => {
    it('should call onToolChange when Wall tool is clicked', async () => {
      const user = userEvent.setup();
      const onToolChange = vi.fn();

      render(<ToolRail {...defaultProps} onToolChange={onToolChange} />);

      await user.click(screen.getByLabelText('Wall'));

      expect(onToolChange).toHaveBeenCalledWith('wall');
    });

    it('should call onToolChange when Vastu tool is clicked in draft mode', async () => {
      const user = userEvent.setup();
      const onToolChange = vi.fn();

      render(<ToolRail {...defaultProps} workspaceMode="draft" onToolChange={onToolChange} />);

      await user.click(screen.getByLabelText('Vastu'));

      expect(onToolChange).toHaveBeenCalledWith('vastu');
    });
  });

  describe('active state', () => {
    it('should apply active class to current tool', () => {
      render(<ToolRail {...defaultProps} currentTool="door" />);

      expect(screen.getByLabelText('Door')).toHaveClass('active');
      expect(screen.getByLabelText('Wall')).not.toHaveClass('active');
    });
  });
});
