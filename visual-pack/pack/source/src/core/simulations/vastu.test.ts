import { describe, it, expect } from 'vitest';
import { analyzeVastu, pointToVastuDirection } from './vastu';

const baseWalls = [
  {
    id: 'w1',
    start: { x: 0, y: 0 },
    end: { x: 400, y: 0 },
    thickness: 200,
    height: 2800,
    material: 'material-concrete',
  },
  {
    id: 'w2',
    start: { x: 400, y: 0 },
    end: { x: 400, y: 300 },
    thickness: 200,
    height: 2800,
    material: 'material-concrete',
  },
  {
    id: 'w3',
    start: { x: 400, y: 300 },
    end: { x: 0, y: 300 },
    thickness: 200,
    height: 2800,
    material: 'material-concrete',
  },
  {
    id: 'w4',
    start: { x: 0, y: 300 },
    end: { x: 0, y: 0 },
    thickness: 200,
    height: 2800,
    material: 'material-concrete',
  },
];

describe('vastu', () => {
  it('returns harmony percent and eight direction scores', () => {
    const result = analyzeVastu({
      walls: baseWalls,
      openings: [
        { id: 'd1', type: 'door', wallId: 'w1', position: 0.5, width: 900, height: 2100 },
      ],
      labels: [{ id: 'l1', text: 'Kitchen', position: { x: 320, y: 80 } }],
      northOrientation: 0,
    });
    expect(result.harmonyPercent).toBeGreaterThan(0);
    expect(result.directions).toHaveLength(8);
    expect(result.roomPlacements.length).toBeGreaterThan(0);
  });

  it('scores kitchen higher when placed in an ideal sector', () => {
    const center = { x: 200, y: 150 };
    const sePoint = { x: center.x - 80, y: center.y + 80 };
    const result = analyzeVastu({
      walls: baseWalls,
      openings: [],
      labels: [{ id: 'l1', text: 'Kitchen', position: sePoint }],
      northOrientation: 0,
    });
    const kitchen = result.roomPlacements.find((p) => /kitchen/i.test(p.label));
    expect(kitchen?.direction).toBe('SE');
    expect(kitchen?.score).toBeGreaterThanOrEqual(90);
  });

  it('rotates sector mapping when northOrientation changes', () => {
    const center = { x: 200, y: 150 };
    const point = { x: center.x, y: center.y - 100 };
    const atZero = pointToVastuDirection(point, center, 0);
    const at90 = pointToVastuDirection(point, center, 90);
    expect(atZero).toBe('N');
    expect(at90).not.toBe(atZero);
  });

  it('includes puja score and tips for mandir label', () => {
    const result = analyzeVastu({
      walls: baseWalls,
      openings: [],
      labels: [{ id: 'l1', text: 'Mandir', position: { x: 320, y: 40 } }],
      northOrientation: 0,
    });
    expect(result.pujaScore).toBeGreaterThan(0);
    expect(result.tips.some((t) => /puja|mandir/i.test(t))).toBe(true);
  });
});
