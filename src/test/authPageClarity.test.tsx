import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AuthLoginCard, { type AuthLoginStatus } from '@/components/auth/AuthLoginCard';
import AuthLoginHero from '@/components/auth/AuthLoginHero';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseProps = () => ({
  submitting: false,
  disabled: false,
  status: null as AuthLoginStatus | null,
  email: '',
  embeddedAuthBrowser: false,
  embeddedBrowserLabel: 'embedded browser',
  externalAuthUrl: 'https://vishvakarmaos.app/auth',
  showConfigRequired: false,
  onEmailChange: vi.fn(),
  onEmailLink: vi.fn(),
  onSso: vi.fn(),
  onRequestAccess: vi.fn(),
  onCopyAuthUrl: vi.fn(),
});

describe('Vishvakarma.OS signed-out auth UI clarity and brand lock', () => {
  it('keeps Google SSO, private magic-link and invitation request working controls', () => {
    const props = baseProps();
    render(<MemoryRouter><AuthLoginCard {...props} /></MemoryRouter>);
    fireEvent.click(screen.getByTestId('google-sso-button'));
    expect(props.onSso).toHaveBeenCalledTimes(1);
    const email = screen.getByTestId('email-magic-link-input');
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete','email');
    expect(email).toHaveAttribute('aria-describedby','vish-auth-email-help');
    expect(screen.getByText(/does not create a new account/i)).toBeInTheDocument();
    fireEvent.change(email, { target: { value: 'person@example.org' } });
    expect(props.onEmailChange).toHaveBeenCalledWith('person@example.org');
    fireEvent.click(screen.getByRole('button', { name: /share an invitation request/i }));
    expect(props.onRequestAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link',{ name: 'Privacy' })).toHaveAttribute('href','/privacy');
    expect(screen.getByRole('link',{ name: 'Terms' })).toHaveAttribute('href','/terms');
    expect(screen.getByRole('link',{ name: 'Home' })).toHaveAttribute('href','/');
    expect(screen.getByRole('textbox',{name:'Approved account email'})).toBeInTheDocument();
  });

  it('shows an accessible email error beside the field', () => {
    const props = baseProps();
    props.status = { variant:'error', message:'Enter the approved email address for your account.' };
    render(<MemoryRouter><AuthLoginCard {...props} /></MemoryRouter>);
    const input = screen.getByTestId('email-magic-link-input');
    expect(input).toHaveAttribute('aria-invalid','true');
    expect(input).toHaveAttribute('aria-describedby','vish-auth-email-help vish-auth-email-error');
    expect(screen.getByTestId('auth-inline-email-error')).toHaveAttribute('role','alert');
    expect(screen.getAllByText(/enter the approved email address/i)).toHaveLength(1);
  });

  it('does not label a Google error as invalid email or duplicate a success notice', () => {
    const props = baseProps();
    props.status = { variant:'error', message:'Google OAuth could not connect.' };
    const { rerender } = render(<MemoryRouter><AuthLoginCard {...props} /></MemoryRouter>);
    expect(screen.getByTestId('email-magic-link-input')).not.toHaveAttribute('aria-invalid','true');
    expect(screen.getByTestId('auth-feedback')).toHaveAttribute('role','alert');
    props.status = { variant:'success', message:'Your access request was copied. Send it to your inviter.' };
    rerender(<MemoryRouter><AuthLoginCard {...props} /></MemoryRouter>);
    expect(screen.getByTestId('auth-feedback')).toHaveAttribute('role','status');
    expect(screen.getAllByText(/access request was copied/i)).toHaveLength(1);
  });

  it('keeps original owner logo on both panels and source-locks helpful visible copy', () => {
    const props=baseProps();
    render(<MemoryRouter><><AuthLoginHero /><AuthLoginCard {...props} /></></MemoryRouter>);
    const images = screen.getAllByAltText(/vishvakarma.os (?:original swan|swan) logo|vishvakarma.os original swan/i);
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src','/brand/vishvakarma-official-logo.svg');
    expect(images[1]).toHaveAttribute('src','/brand/vishvakarma-official-logo.svg');
    const css = readFileSync(resolve(process.cwd(),'src/styles/vish-auth-clarity.css'),'utf8');
    expect(css).toContain('white-space: normal !important');
    expect(css).toContain('clip: auto !important');
    expect(css).toContain('@media (max-width: 980px)');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('flex-wrap: wrap !important');
    expect(css).toContain('.vish-login-page__email-input:focus');
    expect(css).toContain('position: relative !important');
  });

  it('shows clear configuration warning without permitting disabled sign-in', () => {
    const props=baseProps();
    props.showConfigRequired = true;
    props.disabled = true;
    render(<MemoryRouter><AuthLoginCard {...props} /></MemoryRouter>);
    expect(screen.getByRole('alert')).toHaveTextContent('Backend not configured');
    expect(screen.getByTestId('google-sso-button')).toBeDisabled();
    expect(screen.getByTestId('email-magic-link-button')).toBeDisabled();
  });
});
