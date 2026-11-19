import { describe, expect, it } from 'vitest';
import { planarWalk } from '@/components/editor/walkMovement';
const facing={x:0,z:-1};
describe('camera walk movement',()=>{
  it('forward and backward directions are correct',()=>{
    expect(planarWalk(facing,{x:0,z:1},0.01).z).toBeLessThan(0);
    expect(planarWalk(facing,{x:0,z:-1},0.01).z).toBeGreaterThan(0);
  });
  it('right and left strafe correctly',()=>{
    expect(planarWalk(facing,{x:1,z:0},0.01).x).toBeGreaterThan(0);
    expect(planarWalk(facing,{x:-1,z:0},0.01).x).toBeLessThan(0);
  });
  it('diagonal speed is normalized',()=>{
    const straight=planarWalk(facing,{x:0,z:1},0.02);
    const diagonal=planarWalk(facing,{x:1,z:1},0.02);
    expect(Math.hypot(diagonal.x,diagonal.z)).toBeCloseTo(Math.hypot(straight.x,straight.z));
  });
  it('tab resume is clamped to prevent jumping',()=>{
    const motion=planarWalk(facing,{x:0,z:1},3);
    expect(Math.hypot(motion.x,motion.z)).toBeLessThanOrEqual(0.14 + 1e-8);
  });
  it('invalid direction fails closed',()=>{
    expect(planarWalk({x:0,z:0},{x:0,z:1},0.02)).toEqual({x:0,z:0});
  });
});
