import { describe, expect, it } from 'vitest';
import { validateCopilotUpload } from '@/services/copilot/ingestion/copilotUpload';

describe('validateCopilotUpload iPad image formats', () => {
  it('accepts HEIC site survey uploads by extension', () => {
    const file = new File(['x'], 'site.heic', { type: '' });
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(validateCopilotUpload('siteSurvey', file)).toBeNull();
  });

  it('accepts HEIF boundary plan uploads by extension', () => {
    const file = new File(['x'], 'boundary.heif', { type: '' });
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(validateCopilotUpload('boundaryPlan', file)).toBeNull();
  });
});
