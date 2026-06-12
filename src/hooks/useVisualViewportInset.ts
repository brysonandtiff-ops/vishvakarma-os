import { useEffect, useState } from 'react';

export interface VisualViewportInset {
  bottomInset: number;
  isKeyboardOpen: boolean;
}

const KEYBOARD_THRESHOLD_PX = 80;

function readViewportInset(): VisualViewportInset {
  if (typeof window === 'undefined') {
    return { bottomInset: 0, isKeyboardOpen: false };
  }

  const viewport = window.visualViewport;
  if (!viewport) {
    return { bottomInset: 0, isKeyboardOpen: false };
  }

  const layoutHeight = window.innerHeight;
  const visibleBottom = viewport.offsetTop + viewport.height;
  const bottomInset = Math.max(0, layoutHeight - visibleBottom);
  const isKeyboardOpen = bottomInset > KEYBOARD_THRESHOLD_PX;

  return { bottomInset, isKeyboardOpen };
}

export function useVisualViewportInset(): VisualViewportInset {
  const [inset, setInset] = useState<VisualViewportInset>(() => readViewportInset());

  useEffect(() => {
    const update = () => setInset(readViewportInset());
    update();

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return inset;
}
