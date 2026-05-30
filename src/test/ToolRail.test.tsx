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
    it('should render grouped drawing tool buttons', () => {
      render(<ToolRail {...defaultProps} />);

      expect(screen.getByLabelText('Select')).toBeInTheDocument();
      expect(screen.getByLabelText('Wall')).toBeInTheDocument();
      expect(screen.getByLabelText('Door')).toBeInTheDocument();
      expect(screen.getByLabelText('Window')).toBeInTheDocument();
      expect(screen.getByLabelText('Measure')).toBeInTheDocument();
      expect(screen.getByLabelText('Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Dim')).toBeInTheDocument();
    });

    it('should render section labels for mockup groups', () => {
      const { container } = render(<ToolRail {...defaultProps} />);

      expect(container.textContent).toContain('Structure');
      expect(container.textContent).toContain('Annotate');
      expect(container.textContent).toContain('Analysis');
    });

    it('should render stub tools as disabled', () => {
      render(<ToolRail {...defaultProps} />);

      expect(screen.getByLabelText('Arc')).toBeDisabled();
      expect(screen.getByLabelText('Vastu')).toBeDisabled();
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
  });

  describe('active state', () => {
    it('should apply active class to current tool', () => {
      render(<ToolRail {...defaultProps} currentTool="door" />);

      expect(screen.getByLabelText('Door')).toHaveClass('active');
      expect(screen.getByLabelText('Wall')).not.toHaveClass('active');
    });
  });
});
