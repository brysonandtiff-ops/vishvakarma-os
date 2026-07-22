import { describe, expect, it } from 'vitest';
import { CO_OWNER_EMAILS, isCoOwnerEmail } from '@/config/coOwners';

describe('coOwners', () => {
  it('lists the co-owner allowlist', () => {
    expect(CO_OWNER_EMAILS).toContain('ajkdentureventure@gmail.com');
  });

  it('matches co-owner emails case-insensitively', () => {
    expect(isCoOwnerEmail('ajkdentureventure@gmail.com')).toBe(true);
    expect(isCoOwnerEmail('AJKDentureVenture@gmail.com')).toBe(true);
    expect(isCoOwnerEmail(' ajkdentureventure@gmail.com ')).toBe(true);
  });

  it('rejects non-co-owner emails', () => {
    expect(isCoOwnerEmail('other@example.com')).toBe(false);
    expect(isCoOwnerEmail(null)).toBe(false);
    expect(isCoOwnerEmail(undefined)).toBe(false);
  });
});
