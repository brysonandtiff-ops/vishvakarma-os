import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FollowViewportToggle from '@/components/editor/collaboration/FollowViewportToggle';
import type { Presence } from '@/collaboration/types';

const presences: Presence[] = [
  {
    userId: 'user-2',
    name: 'Maya',
    color: '#336699',
    cursor: { x: 0, y: 0 },
    viewport: { position: [0, 10, 10], target: [0, 0, 0], zoom: 1 },
    lastSeen: Date.now(),
  },
];

describe('FollowViewportToggle', () => {
  it('renders touch-safe follow trigger with accessible label', () => {
    render(<FollowViewportToggle presences={presences} onFollow={vi.fn()} />);
    const trigger = screen.getByTestId('collab-follow-toggle');
    expect(trigger).toHaveAttribute('aria-label', 'Follow collaborator viewport');
    expect(trigger.className).toMatch(/touch-target/);
    expect(trigger.className).toMatch(/min-h-\[44px\]/);
  });

  it('calls onFollow when a collaborator is selected', async () => {
    const user = userEvent.setup();
    const onFollow = vi.fn();
    render(<FollowViewportToggle presences={presences} onFollow={onFollow} />);
    await user.click(screen.getByTestId('collab-follow-toggle'));
    await user.click(screen.getByRole('button', { name: 'Maya' }));
    expect(onFollow).toHaveBeenCalledWith(presences[0]);
  });
});
