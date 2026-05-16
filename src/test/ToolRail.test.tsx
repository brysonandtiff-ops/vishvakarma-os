import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolRail from '@/components/editor/ToolRail';
import type { ToolType } from '@/types';

describe('ToolRail', () => {
  const defaultProps = {
    currentTool: 'select' as ToolType,
    onToolChange: vi.fn(),
    show3DView: false,
    onToggle3DView: vi.fn(),
    gridVisible: true,
    onToggleGrid: vi.fn(),
    snapEnabled: true,
    onToggleSnap: vi.fn(),
  };

  describe('rendering', () => {
    it('should render all 5 drawing tool buttons', () => {
      render(<ToolRail {...defaultProps} />);
      
      expect(screen.getByLabelText('Select')).toBeInTheDocument();
      expect(screen.getByLabelText('Wall')).toBeInTheDocument();
      expect(screen.getByLabelText('Door')).toBeInTheDocument();
      expect(screen.getByLabelText('Window')).toBeInTheDocument();
      expect(screen.getByLabelText('Measure')).toBeInTheDocument();
    });

    it('should render all 3 view control buttons', () => {
      render(<ToolRail {...defaultProps} />);
      
      expect(screen.getByLabelText('Toggle 3D View')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle Grid')).toBeInTheDocument();
      expect(screen.getByLabelText('Snap to Grid')).toBeInTheDocument();
    });

    it('should render separator between tools and view controls', () => {
      const { container } = render(<ToolRail {...defaultProps} />);
      
      const separator = container.querySelector('.bg-wood-light');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('tool selection', () => {
    it('should call onToolChange when Select tool is clicked', async () => {
      const user = userEvent.setup();
      const onToolChange = vi.fn();
      
      render(<ToolRail {...defaultProps} onToolChange={onToolChange} />);
      
      await user.click(screen.getByLabelText('Select'));
      
      expect(onToolChange).toHaveBeenCalledWith('select');
      expect(onToolChange).toHaveBeenCalledTimes(1);
    });

    it('should call onToolChange when Wall tool is clicked', async () => {
      const user = userEvent.setup();
      const onToolChange = vi.fn();
      
      render(<ToolRail {...defaultProps} onToolChange={onToolChange} />);
      
      await user.click(screen.getByLabelText('Wall'));
      
      expect(onToolChange).toHaveBeenCalledWith('wall');
      expect(onToolChange).toHaveBeenCalledTimes(1);
    });

    it('should call onToolChange when Door tool is clicked', async () => {
      const user = userEvent.setup();
      const onToolChange = vi.fn();
      
      render(<ToolRail {...defaultProps} onToolChange={onToolChange} />);
      
      await user.click(screen.getByLabelText('Door'));
      
      expect(onToolChange).toHaveBeenCalledWith('door');
      expect(onToolChange).toHaveBeenCalledTimes(1);
    });

    it('should call onToolChange when Window tool is clicked', async () => {
      const user = userEvent.setup();
      const onToolChange = vi.fn();
      
      render(<ToolRail {...defaultProps} onToolChange={onToolChange} />);
      
      await user.click(screen.getByLabelText('Window'));
      
      expect(onToolChange).toHaveBeenCalledWith('window');
      expect(onToolChange).toHaveBeenCalledTimes(1);
    });

    it('should call onToolChange when Measure tool is clicked', async () => {
      const user = userEvent.setup();
      const onToolChange = vi.fn();
      
      render(<ToolRail {...defaultProps} onToolChange={onToolChange} />);
      
      await user.click(screen.getByLabelText('Measure'));
      
      expect(onToolChange).toHaveBeenCalledWith('measure');
      expect(onToolChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('view controls', () => {
    it('should call onToggle3DView when 3D View button is clicked', async () => {
      const user = userEvent.setup();
      const onToggle3DView = vi.fn();
      
      render(<ToolRail {...defaultProps} onToggle3DView={onToggle3DView} />);
      
      await user.click(screen.getByLabelText('Toggle 3D View'));
      
      expect(onToggle3DView).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleGrid when Grid button is clicked', async () => {
      const user = userEvent.setup();
      const onToggleGrid = vi.fn();
      
      render(<ToolRail {...defaultProps} onToggleGrid={onToggleGrid} />);
      
      await user.click(screen.getByLabelText('Toggle Grid'));
      
      expect(onToggleGrid).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleSnap when Snap button is clicked', async () => {
      const user = userEvent.setup();
      const onToggleSnap = vi.fn();
      
      render(<ToolRail {...defaultProps} onToggleSnap={onToggleSnap} />);
      
      await user.click(screen.getByLabelText('Snap to Grid'));
      
      expect(onToggleSnap).toHaveBeenCalledTimes(1);
    });
  });

  describe('active state', () => {
    it('should apply active class to current tool', () => {
      render(<ToolRail {...defaultProps} currentTool="wall" />);
      
      const wallButton = screen.getByLabelText('Wall');
      expect(wallButton).toHaveClass('active');
    });

    it('should not apply active class to inactive tools', () => {
      render(<ToolRail {...defaultProps} currentTool="wall" />);
      
      const selectButton = screen.getByLabelText('Select');
      expect(selectButton).not.toHaveClass('active');
    });

    it('should apply active class to 3D View when enabled', () => {
      render(<ToolRail {...defaultProps} show3DView={true} />);
      
      const viewButton = screen.getByLabelText('Toggle 3D View');
      expect(viewButton).toHaveClass('active');
    });

    it('should not apply active class to 3D View when disabled', () => {
      render(<ToolRail {...defaultProps} show3DView={false} />);
      
      const viewButton = screen.getByLabelText('Toggle 3D View');
      expect(viewButton).not.toHaveClass('active');
    });

    it('should apply active class to Grid when enabled', () => {
      render(<ToolRail {...defaultProps} gridVisible={true} />);
      
      const gridButton = screen.getByLabelText('Toggle Grid');
      expect(gridButton).toHaveClass('active');
    });

    it('should apply active class to Snap when enabled', () => {
      render(<ToolRail {...defaultProps} snapEnabled={true} />);
      
      const snapButton = screen.getByLabelText('Snap to Grid');
      expect(snapButton).toHaveClass('active');
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label for all tool buttons', () => {
      render(<ToolRail {...defaultProps} />);
      
      expect(screen.getByLabelText('Select')).toHaveAttribute('aria-label', 'Select');
      expect(screen.getByLabelText('Wall')).toHaveAttribute('aria-label', 'Wall');
      expect(screen.getByLabelText('Door')).toHaveAttribute('aria-label', 'Door');
      expect(screen.getByLabelText('Window')).toHaveAttribute('aria-label', 'Window');
      expect(screen.getByLabelText('Measure')).toHaveAttribute('aria-label', 'Measure');
    });

    it('should have proper aria-label for view control buttons', () => {
      render(<ToolRail {...defaultProps} />);
      
      expect(screen.getByLabelText('Toggle 3D View')).toHaveAttribute('aria-label', 'Toggle 3D View');
      expect(screen.getByLabelText('Toggle Grid')).toHaveAttribute('aria-label', 'Toggle Grid');
      expect(screen.getByLabelText('Snap to Grid')).toHaveAttribute('aria-label', 'Snap to Grid');
    });

    it('should render all buttons as button elements', () => {
      render(<ToolRail {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      // 5 tools + 3 view controls = 8 buttons
      expect(buttons).toHaveLength(8);
    });
  });

  describe('icon rendering', () => {
    it('should render Eye icon when 3D view is enabled', () => {
      const { container } = render(<ToolRail {...defaultProps} show3DView={true} />);
      
      const viewButton = screen.getByLabelText('Toggle 3D View');
      const svg = viewButton.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
    });

    it('should render EyeOff icon when 3D view is disabled', () => {
      const { container } = render(<ToolRail {...defaultProps} show3DView={false} />);
      
      const viewButton = screen.getByLabelText('Toggle 3D View');
      const svg = viewButton.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
    });

    it('should render icons for all tool buttons', () => {
      const { container } = render(<ToolRail {...defaultProps} />);
      
      const selectButton = screen.getByLabelText('Select');
      const wallButton = screen.getByLabelText('Wall');
      const doorButton = screen.getByLabelText('Door');
      const windowButton = screen.getByLabelText('Window');
      const measureButton = screen.getByLabelText('Measure');
      
      expect(selectButton.querySelector('svg')).toBeInTheDocument();
      expect(wallButton.querySelector('svg')).toBeInTheDocument();
      expect(doorButton.querySelector('svg')).toBeInTheDocument();
      expect(windowButton.querySelector('svg')).toBeInTheDocument();
      expect(measureButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('props changes', () => {
    it('should update active tool when currentTool prop changes', () => {
      const { rerender } = render(<ToolRail {...defaultProps} currentTool="select" />);
      
      let selectButton = screen.getByLabelText('Select');
      let wallButton = screen.getByLabelText('Wall');
      
      expect(selectButton).toHaveClass('active');
      expect(wallButton).not.toHaveClass('active');
      
      // Change current tool
      rerender(<ToolRail {...defaultProps} currentTool="wall" />);
      
      selectButton = screen.getByLabelText('Select');
      wallButton = screen.getByLabelText('Wall');
      
      expect(selectButton).not.toHaveClass('active');
      expect(wallButton).toHaveClass('active');
    });

    it('should update 3D view icon when show3DView prop changes', () => {
      const { rerender } = render(<ToolRail {...defaultProps} show3DView={false} />);
      
      let viewButton = screen.getByLabelText('Toggle 3D View');
      expect(viewButton).not.toHaveClass('active');
      
      // Enable 3D view
      rerender(<ToolRail {...defaultProps} show3DView={true} />);
      
      viewButton = screen.getByLabelText('Toggle 3D View');
      expect(viewButton).toHaveClass('active');
    });

    it('should update grid button when gridVisible prop changes', () => {
      const { rerender } = render(<ToolRail {...defaultProps} gridVisible={false} />);
      
      let gridButton = screen.getByLabelText('Toggle Grid');
      expect(gridButton).not.toHaveClass('active');
      
      // Enable grid
      rerender(<ToolRail {...defaultProps} gridVisible={true} />);
      
      gridButton = screen.getByLabelText('Toggle Grid');
      expect(gridButton).toHaveClass('active');
    });

    it('should update snap button when snapEnabled prop changes', () => {
      const { rerender } = render(<ToolRail {...defaultProps} snapEnabled={false} />);
      
      let snapButton = screen.getByLabelText('Snap to Grid');
      expect(snapButton).not.toHaveClass('active');
      
      // Enable snap
      rerender(<ToolRail {...defaultProps} snapEnabled={true} />);
      
      snapButton = screen.getByLabelText('Snap to Grid');
      expect(snapButton).toHaveClass('active');
    });
  });
});
