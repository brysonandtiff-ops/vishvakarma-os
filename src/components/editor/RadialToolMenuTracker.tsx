import { useEffect, useRef, useState, type RefObject } from 'react';
import RadialToolMenu from '@/components/editor/RadialToolMenu';
import type { ToolType } from '@/types';

export default function RadialToolMenuTracker({
  visible,
  containerRef,
  currentTool,
  onSelectTool,
}: {
  visible: boolean;
  containerRef: RefObject<HTMLElement | null>;
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!visible) return;
    const container = containerRef.current;
    if (!container) return;

    const syncRect = () => {
      rectRef.current = container.getBoundingClientRect();
    };
    syncRect();

    let rafId = 0;
    const onPointerMove = (event: PointerEvent) => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const rect = rectRef.current ?? container.getBoundingClientRect();
        setPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      });
    };

    container.addEventListener('pointermove', onPointerMove);
    window.addEventListener('resize', syncRect);
    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', syncRect);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [visible, containerRef]);

  return (
    <RadialToolMenu
      visible={visible}
      x={position.x}
      y={position.y}
      currentTool={currentTool}
      onSelectTool={onSelectTool}
    />
  );
}
