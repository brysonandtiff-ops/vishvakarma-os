import { Box } from 'lucide-react';

export default function Viewport3DLoading() {
  return (
    <div className="vish-3d-loading flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="vish-3d-loading-icon flex h-12 w-12 items-center justify-center rounded-2xl">
        <Box className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ws-text">Loading 3D engine</p>
        <p className="text-[11px] text-ws-text-faint">Three.js mounts only when 3D preview is opened.</p>
      </div>
    </div>
  );
}
