import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pilotPlan = readFileSync(
  new URL('../../docs/pilots/VISHVAKARMA_OS_PILOT_PLAN.md', import.meta.url),
  'utf8',
);

const feedbackTemplate = readFileSync(
  new URL('../../docs/pilots/PILOT_FEEDBACK_TEMPLATE.md', import.meta.url),
  'utf8',
);

describe('pilot proof docs', () => {
  it('keeps the pilot plan focused on external proof and safe product claims', () => {
    const requiredPlanPhrases = [
      '3–5 residential concept review sessions',
      'Does Vishvakarma.OS help someone understand, explain, and discuss a residential building idea faster',
      'demo evidence → reviewer feedback → pilot evidence → testimonial/usage proof → stronger valuation',
      'Family Home 4BR',
      'Duplex Two Floor',
      'Courtyard Villa / Vastu showcase',
      'brief → review → concept → estimate → compliance → export',
      'pilot evidence → testimonial pack → landing page proof section → first paid pilot',
    ];

    for (const phrase of requiredPlanPhrases) {
      expect(pilotPlan).toContain(phrase);
    }

    expect(pilotPlan).toContain('decision-support');
    expect(pilotPlan).toContain('not certified approval');
    expect(pilotPlan).toContain('fixed construction quoting');
    expect(pilotPlan).toContain('AUD estimates are early estimates only');
    expect(pilotPlan).toContain('Only commit anonymised summaries');
  });

  it('keeps the feedback template measurable and permission-aware', () => {
    const requiredTemplatePhrases = [
      'Rate from **1 = weak/confusing** to **5 = strong/clear**.',
      'The 3D preview made the design clearer',
      'The AI proof flow was useful',
      'The AUD estimate helped the conversation',
      'The compliance notes were useful as decision-support',
      'Would the reviewer pay for this before formal drafting or design work?',
      '$50–$150 / $150–$500 / $500–$1,500 / $1,500+ / unsure',
      'Reviewer gave permission to use anonymous feedback',
      'Safe public summary format',
    ];

    for (const phrase of requiredTemplatePhrases) {
      expect(feedbackTemplate).toContain(phrase);
    }

    expect(feedbackTemplate).toContain('not certified building approval');
    expect(feedbackTemplate).toContain('not a fixed quote');
    expect(feedbackTemplate).toContain('not certified approval');
    expect(feedbackTemplate).toContain('No private project details are included in public materials');
  });
});
