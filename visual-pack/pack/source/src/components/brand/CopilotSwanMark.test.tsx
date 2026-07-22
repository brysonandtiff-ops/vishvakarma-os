import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CopilotSwanMark, { architectureBotMotionToSwan } from '@/components/brand/CopilotSwanMark';

describe('CopilotSwanMark', () => {
  it('renders motion and size data attributes', () => {
    render(<CopilotSwanMark motion="generating" size="sm" testId="copilot-swan-test" />);

    const mark = screen.getByTestId('copilot-swan-test');
    expect(mark).toHaveAttribute('data-motion', 'generating');
    expect(mark).toHaveAttribute('data-size', 'sm');
  });

  it('renders issue badge on fab size', () => {
    render(<CopilotSwanMark size="fab" issueCount={3} testId="copilot-swan-fab" />);

    expect(screen.getByTestId('architecture-bot-badge')).toHaveTextContent('3');
  });

  it('maps architecture bot states to swan motion modes', () => {
    expect(architectureBotMotionToSwan('attention')).toBe('attention');
    expect(architectureBotMotionToSwan('healthy')).toBe('healthy');
    expect(architectureBotMotionToSwan('idle')).toBe('idle');
  });
});
