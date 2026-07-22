import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { AtmospherePerformanceMode } from '@/utils/atmosphereMode';
import { FrameGovernor } from '@/utils/adaptiveFrameGovernor';
import { reportFrameStats } from '@/utils/frameStatsStore';

/**
 * Samples real frame time from the render loop and asks the parent to cap the
 * effective atmosphere tier when the device can't hold a smooth rate (and to
 * lift it back once headroom returns). Renders nothing.
 *
 * Mounted inside <Canvas>, so `useFrame` only fires on frames the loop actually
 * renders — under `frameloop="demand"` that means it measures exactly the
 * moments that matter (orbit damping, auto-rotate, walk mode) and stays silent
 * while idle. The governor itself discards demand-gap deltas defensively.
 */
export function AdaptiveFrameGovernor({
  ceiling,
  onCapChange,
}: {
  ceiling: AtmospherePerformanceMode;
  onCapChange: (cap: AtmospherePerformanceMode) => void;
}) {
  const governorRef = useRef<FrameGovernor | null>(null);
  if (governorRef.current === null) {
    governorRef.current = new FrameGovernor();
    governorRef.current.setCeiling(ceiling, { reset: true });
  }
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    // A new ceiling is fresh user intent (or a walk-mode transition): restore
    // the chosen quality immediately, then let the governor re-evaluate.
    governorRef.current?.setCeiling(ceiling, { reset: true });
  }, [ceiling]);

  useFrame((_, delta) => {
    const governor = governorRef.current;
    if (!governor) return;
    const outcome = governor.pushFrame(delta * 1000);
    if (outcome.fps !== null) {
      reportFrameStats({ fps: outcome.fps, cap: outcome.cap });
    }
    if (outcome.changed) {
      onCapChange(outcome.cap);
      // Demand loop is paused between events — force the retiered frame to paint.
      invalidate();
    }
  });

  return null;
}
