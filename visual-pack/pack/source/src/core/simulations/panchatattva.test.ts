import { describe, it, expect } from 'vitest';
import { analyzePanchatattva } from './panchatattva';

describe('panchatattva', () => {
  it('returns five element scores', () => {
    const result = analyzePanchatattva({
      walls: [],
      labels: [
        { id: 'l1', text: 'Kitchen', position: { x: 0, y: 0 } },
        { id: 'l2', text: 'Master Bedroom', position: { x: 10, y: 10 } },
      ],
    });
    expect(result.elements).toHaveLength(5);
    expect(result.balancePercent).toBeGreaterThan(0);
    const agni = result.elements.find((e) => e.element === 'agni');
    expect(agni?.score).toBeGreaterThan(60);
  });

  it('boosts akash for puja and courtyard labels', () => {
    const result = analyzePanchatattva({
      walls: [],
      labels: [
        { id: 'l1', text: 'Puja Room', position: { x: 0, y: 0 } },
        { id: 'l2', text: 'Courtyard', position: { x: 10, y: 10 } },
      ],
    });
    const akash = result.elements.find((e) => e.element === 'akash');
    expect(akash?.score).toBeGreaterThanOrEqual(90);
  });
});
