import { describe, it, expect } from 'vitest';
import { routeMep } from './tvashtar';

describe('tvashtar MEP routing', () => {
  it('returns a path between start and end', () => {
    const result = routeMep(
      [],
      { x: 0, y: 0 },
      { x: 200, y: 200 },
    );
    expect(result.path.length).toBeGreaterThanOrEqual(2);
    expect(result.cost).toBeGreaterThan(0);
  });
});
