import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DreamHomeJourney } from '@/components/projects/DreamHomeJourney';

describe('original owner design journey', () => {
  it('keeps the locked original Vishvakarma swan/V mark', () => {
    render(<MemoryRouter><DreamHomeJourney /></MemoryRouter>);
    expect(document.querySelector('.vish-dream__brand img')).toHaveAttribute('src', '/brand/vishvakarma-official-logo.svg');
    expect(screen.getByRole('heading', {name: /a home begins/i})).toBeInTheDocument();
  });
  it('links to real app routes and labels the illustration truthfully', () => {
    render(<MemoryRouter><DreamHomeJourney /></MemoryRouter>);
    expect(screen.getByRole('list').children).toHaveLength(5);
    expect(screen.getByRole('link', {name:'See projects'})).toHaveAttribute('href', '#recent-projects');
    expect(screen.getByRole('link', {name:'Open 2D editor'})).toHaveAttribute('href', '/editor-lite');
    expect(screen.getByRole('link', {name:'Open 3D room'})).toHaveAttribute('href', '/3d-room');
    expect(screen.getByRole('link', {name:'Try Walk mode'})).toHaveAttribute('href', '/3d-room');
    expect(screen.getByRole('link', {name:'Open save tools'})).toHaveAttribute('href', '/editor');
    expect(screen.getByText(/not a live editor screenshot/i)).toBeInTheDocument();
  });
});
