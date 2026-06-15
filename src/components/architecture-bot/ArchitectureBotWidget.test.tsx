import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ArchitectureBotWidget from '@/components/architecture-bot/ArchitectureBotWidget';
import type { ArchitectureIssue } from '@/services/architecture-bot/types';

const issues: ArchitectureIssue[] = [
  {
    id: 'test-issue',
    title: 'Wall height',
    message: 'Wall w1 below minimum height.',
    severity: 'fail',
    category: 'ncc',
    autoFixable: true,
    ruleId: 'ncc-habitable-height',
  },
];

describe('ArchitectureBotWidget', () => {
  it('renders character and opens panel on toggle', () => {
    render(
      <ArchitectureBotWidget
        panelOpen={false}
        issues={issues}
        issueCount={1}
        animationState="attention"
        fixing={false}
        onTogglePanel={vi.fn()}
        onClosePanel={vi.fn()}
        onFixEverything={vi.fn()}
      />,
    );

    expect(screen.getByTestId('architecture-bot-widget')).toBeInTheDocument();
    expect(screen.getByTestId('architecture-bot-character')).toHaveAttribute('data-state', 'attention');
    expect(screen.getByTestId('architecture-bot-badge')).toHaveTextContent('1');
  });

  it('calls fix handler from panel', () => {
    const onFixEverything = vi.fn();
    render(
      <ArchitectureBotWidget
        panelOpen
        issues={issues}
        issueCount={1}
        animationState="attention"
        fixing={false}
        onTogglePanel={vi.fn()}
        onClosePanel={vi.fn()}
        onFixEverything={onFixEverything}
      />,
    );

    fireEvent.click(screen.getByTestId('architecture-bot-fix-all'));
    expect(onFixEverything).toHaveBeenCalledTimes(1);
  });
});
