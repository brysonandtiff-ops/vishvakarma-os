import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CO_OWNER, FOUNDER, STUDIO_NAME } from '@/brand/founders';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';

describe('FoundersAcknowledgment', () => {
  it('renders auth variant with studio and founder credits', () => {
    render(<FoundersAcknowledgment variant="auth" />);

    const block = screen.getByTestId('founders-acknowledgment-auth');
    expect(block).toHaveAttribute('aria-label');
    expect(screen.getByText(STUDIO_NAME)).toBeInTheDocument();
    expect(screen.getByText(`${FOUNDER.name} — ${FOUNDER.title}`)).toBeInTheDocument();
    expect(screen.getByText(`${CO_OWNER.name} — ${CO_OWNER.title}`)).toBeInTheDocument();
    expect(document.querySelector('.vish-auth-founders-line')).toBeTruthy();
  });

  it('renders footer variant with copyright and founders', () => {
    render(<FoundersAcknowledgment variant="footer" />);

    const block = screen.getByTestId('founders-acknowledgment-footer');
    expect(block).toHaveAttribute('aria-label');
    expect(screen.getByText(new RegExp(`${STUDIO_NAME}`))).toBeInTheDocument();
    expect(screen.getByText(/Vishvakarma\.OS/)).toBeInTheDocument();
    expect(screen.getByText(`${FOUNDER.name} — ${FOUNDER.title}`)).toBeInTheDocument();
    expect(screen.getByText(`${CO_OWNER.name} — ${CO_OWNER.title}`)).toBeInTheDocument();
    expect(document.querySelector('.vish-marketing-founders')).toBeTruthy();
  });

  it('renders sidebar variant with compact studio and role lines', () => {
    render(<FoundersAcknowledgment variant="sidebar" />);

    const block = screen.getByTestId('founders-acknowledgment-sidebar');
    expect(block).toHaveAttribute('aria-label');
    expect(screen.getByText(STUDIO_NAME)).toBeInTheDocument();
    expect(screen.getByText(FOUNDER.name)).toBeInTheDocument();
    expect(screen.getByText(FOUNDER.title)).toBeInTheDocument();
    expect(screen.getByText(`${CO_OWNER.name} · ${CO_OWNER.title}`)).toBeInTheDocument();
    expect(document.querySelector('.vish-sidebar-founders')).toBeTruthy();
  });
});
