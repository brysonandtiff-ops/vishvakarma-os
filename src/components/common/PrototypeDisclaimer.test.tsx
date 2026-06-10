import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  PROTOTYPE_BADGE,
  PROTOTYPE_MODULE_COMPLIANCE,
  PROTOTYPE_MODULE_COST,
  PROTOTYPE_MODULE_COPILOT,
  PROTOTYPE_MODULE_OPTIMIZATION,
} from '@/constants/prototypeDisclaimer';
import {
  PrototypeDisclaimerBadge,
  PrototypeModuleNotice,
} from '@/components/common/PrototypeDisclaimer';

describe('PrototypeDisclaimer', () => {
  it('renders global badge text', () => {
    render(<PrototypeDisclaimerBadge />);
    expect(screen.getByTestId('prototype-disclaimer-badge')).toHaveTextContent(PROTOTYPE_BADGE);
  });

  it('renders cost module notice', () => {
    render(<PrototypeModuleNotice variant="cost" />);
    expect(screen.getByTestId('prototype-notice-cost')).toHaveTextContent(PROTOTYPE_MODULE_COST);
  });

  it('renders compliance module notice', () => {
    render(<PrototypeModuleNotice variant="compliance" />);
    expect(screen.getByTestId('prototype-notice-compliance')).toHaveTextContent(
      PROTOTYPE_MODULE_COMPLIANCE,
    );
  });

  it('renders copilot module notice', () => {
    render(<PrototypeModuleNotice variant="copilot" />);
    expect(screen.getByTestId('prototype-notice-copilot')).toHaveTextContent(PROTOTYPE_MODULE_COPILOT);
  });

  it('renders optimization module notice', () => {
    render(<PrototypeModuleNotice variant="optimization" />);
    expect(screen.getByTestId('prototype-notice-optimization')).toHaveTextContent(
      PROTOTYPE_MODULE_OPTIMIZATION,
    );
  });
});
