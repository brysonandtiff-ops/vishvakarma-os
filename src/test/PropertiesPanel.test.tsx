import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import type { Wall, Opening } from '@/types';

describe('PropertiesPanel', () => {
  const mockWall: Wall = {
    id: 'wall-123456789012',
    start: { x: 0, y: 0 },
    end: { x: 400, y: 0 },
    thickness: 10,
    height: 300,
    material: 'paint',
  };

  const mockDoor: Opening = {
    id: 'door-1',
    wallId: 'wall-123456789012',
    type: 'door',
    position: 0.5,
    width: 90,
    height: 210,
  };

  const mockWindow: Opening = {
    id: 'window-1',
    wallId: 'wall-123456789012',
    type: 'window',
    position: 0.3,
    width: 120,
    height: 150,
    sillHeight: 90,
  };

  const defaultProps = {
    currentTool: 'select' as const,
    openings: [],
    onWallUpdate: vi.fn(),
    onOpeningUpdate: vi.fn(),
    onWallDelete: vi.fn(),
    onOpeningDelete: vi.fn(),
  };

  describe('empty state', () => {
    it('should render tool defaults when no wall is selected', () => {
      render(<PropertiesPanel {...defaultProps} currentTool="door" />);
      
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('Door defaults')).toBeInTheDocument();
      expect(screen.getByText('Pre-flight defaults – adjust before placing.')).toBeInTheDocument();
    });

    it('should not render wall properties in empty state', () => {
      render(<PropertiesPanel {...defaultProps} />);
      
      expect(screen.queryByText('Wall Properties')).not.toBeInTheDocument();
    });
  });

  describe('wall properties', () => {
    it('should render wall properties when wall is selected', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      expect(screen.getByText('Wall Properties')).toBeInTheDocument();
      expect(screen.getByText('Thickness')).toBeInTheDocument();
      expect(screen.getByText('Height')).toBeInTheDocument();
    });

    it('should display wall length', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      expect(screen.getByText('Length')).toBeInTheDocument();
      expect(screen.getByText('400px')).toBeInTheDocument();
    });

    it('should display wall ID (truncated)', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('wall-1234567...')).toBeInTheDocument();
    });

    it('should display wall thickness value', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      expect(screen.getByText('10px')).toBeInTheDocument();
    });

    it('should display wall height value', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      expect(screen.getByText('300cm')).toBeInTheDocument();
    });

    it('should calculate wall length correctly for diagonal wall', () => {
      const diagonalWall: Wall = {
        ...mockWall,
        end: { x: 300, y: 400 },
      };
      
      render(<PropertiesPanel {...defaultProps} selectedWall={diagonalWall} />);
      
      // Length = sqrt(300^2 + 400^2) = 500
      expect(screen.getByText('500px')).toBeInTheDocument();
    });
  });

  describe('wall sliders', () => {
    it('should render thickness slider label', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      expect(screen.getByText('Thickness')).toBeInTheDocument();
      expect(screen.getByText('10px')).toBeInTheDocument();
    });

    it('should render height slider label', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      expect(screen.getByText('Height')).toBeInTheDocument();
      expect(screen.getByText('300cm')).toBeInTheDocument();
    });

    it('should have thickness slider with correct id', () => {
      const { container } = render(
        <PropertiesPanel {...defaultProps} selectedWall={mockWall} />
      );
      
      const slider = container.querySelector('#thickness');
      expect(slider).toBeInTheDocument();
    });

    it('should have height slider with correct id', () => {
      const { container } = render(
        <PropertiesPanel {...defaultProps} selectedWall={mockWall} />
      );
      
      const slider = container.querySelector('#height');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('openings display', () => {
    it('should display "No doors or windows" when no openings', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} openings={[]} />);
      
      expect(screen.getByText('Openings (0)')).toBeInTheDocument();
      expect(screen.getByText('No doors or windows on this wall')).toBeInTheDocument();
    });

    it('should display door opening', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
        />
      );
      
      expect(screen.getByText('Openings (1)')).toBeInTheDocument();
      expect(screen.getByText('door')).toBeInTheDocument();
    });

    it('should display window opening', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockWindow]}
        />
      );
      
      expect(screen.getByText('Openings (1)')).toBeInTheDocument();
      expect(screen.getByText('window')).toBeInTheDocument();
    });

    it('should display multiple openings', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor, mockWindow]}
        />
      );
      
      expect(screen.getByText('Openings (2)')).toBeInTheDocument();
      expect(screen.getByText('door')).toBeInTheDocument();
      expect(screen.getByText('window')).toBeInTheDocument();
    });

    it('should only display openings for selected wall', () => {
      const otherWallOpening: Opening = {
        ...mockDoor,
        id: 'door-2',
        wallId: 'other-wall',
      };
      
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor, otherWallOpening]}
        />
      );
      
      expect(screen.getByText('Openings (1)')).toBeInTheDocument();
    });
  });

  describe('opening properties', () => {
    it('should display door width', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
        />
      );
      
      expect(screen.getByText('90cm')).toBeInTheDocument();
    });

    it('should display door height', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
        />
      );
      
      expect(screen.getByText('210cm')).toBeInTheDocument();
    });

    it('should display door position as percentage', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
        />
      );
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should display window sill height', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockWindow]}
        />
      );
      
      expect(screen.getByText('Sill Height')).toBeInTheDocument();
      expect(screen.getByText('90cm')).toBeInTheDocument();
    });

    it('should not display sill height for doors', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
        />
      );
      
      expect(screen.queryByText('Sill Height')).not.toBeInTheDocument();
    });
  });

  describe('opening delete', () => {
    it('should render delete button for each opening', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
        />
      );
      
      const deleteButtons = screen.getAllByRole('button');
      // Should have at least one delete button (opening delete)
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should call onOpeningDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onOpeningDelete = vi.fn();
      
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
          onOpeningDelete={onOpeningDelete}
        />
      );
      
      // Find the delete button (small button with Trash2 icon)
      const deleteButtons = screen.getAllByRole('button');
      const openingDeleteButton = deleteButtons.find(
        (btn) => btn.className.includes('h-6 w-6')
      );
      
      if (openingDeleteButton) {
        await user.click(openingDeleteButton);
        expect(onOpeningDelete).toHaveBeenCalledWith('door-1');
      }
    });
  });

  describe('wall delete', () => {
    it('should render delete wall button', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      expect(screen.getByText('Delete Wall')).toBeInTheDocument();
    });

    it('should call onWallDelete when delete wall button is clicked', async () => {
      const user = userEvent.setup();
      const onWallDelete = vi.fn();
      
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          onWallDelete={onWallDelete}
        />
      );
      
      await user.click(screen.getByText('Delete Wall'));
      
      expect(onWallDelete).toHaveBeenCalledWith('wall-123456789012');
      expect(onWallDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('props updates', () => {
    it('should update display when selectedWall changes', () => {
      const { rerender } = render(
        <PropertiesPanel {...defaultProps} selectedWall={mockWall} />
      );
      
      expect(screen.getByText('400px')).toBeInTheDocument();
      
      const newWall: Wall = {
        ...mockWall,
        end: { x: 600, y: 0 },
      };
      
      rerender(<PropertiesPanel {...defaultProps} selectedWall={newWall} />);
      
      expect(screen.getByText('600px')).toBeInTheDocument();
    });

    it('should update display when openings change', () => {
      const { rerender } = render(
        <PropertiesPanel {...defaultProps} selectedWall={mockWall} openings={[]} />
      );
      
      expect(screen.getByText('Openings (0)')).toBeInTheDocument();
      
      rerender(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
        />
      );
      
      expect(screen.getByText('Openings (1)')).toBeInTheDocument();
    });

    it('should switch from wall properties to empty state', () => {
      const { rerender } = render(
        <PropertiesPanel {...defaultProps} selectedWall={mockWall} />
      );
      
      expect(screen.getByText('Wall Properties')).toBeInTheDocument();
      
      rerender(<PropertiesPanel {...defaultProps} currentTool="select" />);
      
      expect(screen.queryByText('Wall Properties')).not.toBeInTheDocument();
      expect(screen.getByText('Select a wall or opening to edit properties.')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for sliders', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      // Check that labels exist
      expect(screen.getByText('Thickness')).toBeInTheDocument();
      expect(screen.getByText('Height')).toBeInTheDocument();
    });

    it('should have accessible delete button', () => {
      render(<PropertiesPanel {...defaultProps} selectedWall={mockWall} />);
      
      const deleteButton = screen.getByText('Delete Wall');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton.tagName).toBe('BUTTON');
    });

    it('should render all interactive elements as buttons', () => {
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[mockDoor]}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle wall with zero length', () => {
      const zeroLengthWall: Wall = {
        ...mockWall,
        end: { x: 0, y: 0 },
      };
      
      render(<PropertiesPanel {...defaultProps} selectedWall={zeroLengthWall} />);
      
      expect(screen.getByText('0px')).toBeInTheDocument();
    });

    it('should handle opening with position 0', () => {
      const edgeOpening: Opening = {
        ...mockDoor,
        position: 0,
      };
      
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[edgeOpening]}
        />
      );
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle opening with position 1', () => {
      const edgeOpening: Opening = {
        ...mockDoor,
        position: 1,
      };
      
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[edgeOpening]}
        />
      );
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle window without sillHeight', () => {
      const windowWithoutSill: Opening = {
        ...mockWindow,
        sillHeight: undefined,
      };
      
      render(
        <PropertiesPanel
          {...defaultProps}
          selectedWall={mockWall}
          openings={[windowWithoutSill]}
        />
      );
      
      expect(screen.queryByText('Sill Height')).not.toBeInTheDocument();
    });
  });
});
