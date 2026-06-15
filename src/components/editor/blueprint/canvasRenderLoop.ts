export type CanvasDirtyFlag = 'geometry' | 'viewport' | 'interaction' | 'overlay';

export type CanvasDirtyFlags = Record<CanvasDirtyFlag, boolean>;

export function createEmptyDirtyFlags(): CanvasDirtyFlags {
  return { geometry: false, viewport: false, interaction: false, overlay: false };
}

export function createCanvasRenderScheduler(
  draw: () => void,
  getDirtyFlags: () => CanvasDirtyFlags,
  markAllClean: () => void,
) {
  let rafId = 0;

  const flush = () => {
    rafId = 0;
    const flags = getDirtyFlags();
    if (!flags.geometry && !flags.viewport && !flags.interaction && !flags.overlay) return;
    draw();
    markAllClean();
  };

  const requestDraw = (flag: CanvasDirtyFlag) => {
    const flags = getDirtyFlags();
    flags[flag] = true;
    if (!rafId) {
      rafId = window.requestAnimationFrame(flush);
    }
  };

  const cancel = () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  return { requestDraw, cancel, flush };
}
