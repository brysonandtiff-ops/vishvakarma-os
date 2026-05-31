import { describe, it, expect } from 'vitest';
import { analyzeVastu } from './vastu';

describe('vastu', () => {
  it('returns harmony percent and tips', () => {
    const result = analyzeVastu({
      walls: [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 200, y: 0 },
          thickness: 200,
          height: 2800,
          material: 'material-concrete',
        },
      ],
      openings: [
        { id: 'd1', type: 'door', wallId: 'w1', position: 0.5, width: 900, height: 2100 },
      ],
      labels: [{ id: 'l1', text: 'Kitchen', position: { x: 50, y: 50 } }],
    });
    expect(result.harmonyPercent).toBeGreaterThan(0);
    expect(result.directions).toHaveLength(8);
  });
});
