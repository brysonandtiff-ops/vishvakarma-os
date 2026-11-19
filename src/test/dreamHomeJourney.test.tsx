import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DreamHomeJourney } from '@/components/projects/DreamHomeJourney';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));

describe('Studio sample preview', () => {
  it('opens the sample in each Studio view and labels the sample renderings', () => {
    const openSample = vi.fn();
    render(<DreamHomeJourney onOpenSample={openSample} />);

    fireEvent.click(screen.getByRole('button', { name: 'Blueprint' }));
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    fireEvent.click(screen.getByRole('button', { name: 'Walk' }));

    expect(openSample.mock.calls).toEqual([[], ['orbit'], ['walk']]);
    expect(screen.getByRole('img', { name: /architectural studies/i })).toHaveAttribute('src', '/room-studies/concepts.webp');
  });
});
