import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RadialToolMenu from '@/components/editor/RadialToolMenu';
import type { ToolType } from '@/types';

function mockMatchMedia(coarse = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: coarse && query === '(pointer: coarse)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('RadialToolMenu', () => {
  const defaultProps = {
    visible: true,
    x: 120,
    y: 80,
    currentTool: 'wall' as ToolType,
    onSelectTool: vi.fn(),
  };

  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders radial toolbar with center select and ring tools', () => {
    render(<RadialToolMenu {...defaultProps} />);

    expect(screen.getByTestId('radial-tool-menu')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Radial tool picker' })).toBeInTheDocument();
    expect(screen.getByLabelText('Select')).toBeInTheDocument();
    expect(screen.getByLabelText('Column')).toBeInTheDocument();
    expect(screen.getByLabelText('Stair')).toBeInTheDocument();
  });

  it('calls onSelectTool when a ring tool is clicked', async () => {
    const user = userEvent.setup();
    const onSelectTool = vi.fn();

    render(<RadialToolMenu {...defaultProps} onSelectTool={onSelectTool} />);

    await user.click(screen.getByLabelText('Door'));

    expect(onSelectTool).toHaveBeenCalledWith('door');
  });

  it('marks the active tool with aria-pressed', () => {
    render(<RadialToolMenu {...defaultProps} currentTool="measure" />);

    expect(screen.getByLabelText('Measure')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Wall')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders larger radial toolbar on coarse pointers', () => {
    mockMatchMedia(true);

    render(<RadialToolMenu {...defaultProps} />);

    expect(screen.getByTestId('radial-tool-menu')).toBeInTheDocument();
    expect(screen.getByLabelText('Pan')).toBeInTheDocument();
    expect(screen.queryByLabelText('Column')).not.toBeInTheDocument();
  });
});
