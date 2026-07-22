import { describe, expect, it } from 'vitest';
import { parseCouncilText, parseSiteSurveyText } from '@/services/copilot/ingestion/documentParsers';

describe('documentParsers', () => {
  it('parses council setbacks and coverage from text', () => {
    const council = parseCouncilText(
      'Council: Example Shire\nZone: R2\nFront setback: 6m\nSide setback: 1.5m\nRear setback: 3m\nMaximum coverage: 40%\nMaximum height: 8.5m',
    );
    expect(council.setbacks.front).toBe(6);
    expect(council.setbacks.side).toBe(1.5);
    expect(council.maxCoverageRatio).toBe(0.4);
    expect(council.maxHeightM).toBe(8.5);
  });

  it('parses site survey slope and orientation', () => {
    const survey = parseSiteSurveyText('Site slope: 5% orientation: NE easement: drainage reserve');
    expect(survey.slope).toBe(5);
    expect(survey.orientation).toContain('NE');
    expect(survey.easements.length).toBeGreaterThan(0);
  });
});
