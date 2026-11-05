import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('phone auth floating controls', () => {
  it('keeps the sign-in card clear of the optional mantra control', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/styles/vish-auth-layout-tidy.css'),
      'utf8',
    );

    const phoneBlockStart = css.indexOf('/* Phone auth must be task-first');
    expect(phoneBlockStart).toBeGreaterThanOrEqual(0);

    const phoneBlock = css.slice(phoneBlockStart);
    expect(phoneBlock).toContain("body:has([data-testid='auth-page']) .mantra-widget");
    expect(phoneBlock).toContain('display: none');
    expect(phoneBlock).toContain("body:has([data-testid='auth-page']) .vish-voice-tour-launch");
  });
});
