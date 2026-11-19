export type WalkVector = { x: number; z: number };
export function planarWalk(look: WalkVector, input: WalkVector, seconds: number, speed=2.8): WalkVector {
  const zero = { x: 0, z: 0 };
  if (![look.x, look.z, input.x, input.z, seconds, speed].every(Number.isFinite) || seconds <= 0 || speed <= 0) return zero;
  const length = Math.hypot(look.x, look.z);
  if (length < 1e-6) return zero;
  const fx = look.x / length, fz = look.z / length;
  const ix = Math.max(-1,Math.min(1,input.x)), iz = Math.max(-1,Math.min(1,input.z));
  const x = fx*iz-fz*ix, z = fz*iz+fx*ix;
  const mag = Math.hypot(x,z);
  if (mag < 1e-6) return zero;
  const step = speed*Math.min(seconds,0.05)/Math.max(1,mag);
  return { x:x*step, z:z*step };
}
