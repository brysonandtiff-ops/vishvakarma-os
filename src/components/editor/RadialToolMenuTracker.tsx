import { useEffect, useRef, useState, type RefObject } from 'react';
import RadialToolMenu from '@/components/editor/RadialToolMenu';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import type { ToolType } from '@/types';

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 12;

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
  const isCoarsePointer = useCoarsePointer();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [longPressActive, setLongPressActive] = useState(false);
  const rectRef = useRef<DOMRect | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressOriginRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!visible) {
      setLongPressActive(false);
      clearLongPressTimer();
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const syncRect = () => {
      rectRef.current = container.getBoundingClientRect();
    };
    syncRect();

    let rafId = 0;
    const setMenuPosition = (clientX: number, clientY: number) => {
      const rect = rectRef.current ?? container.getBoundingClientRect();
      setPosition({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (isCoarsePointer && longPressOriginRef.current) {
        const dx = event.clientX - longPressOriginRef.current.x;
        const dy = event.clientY - longPressOriginRef.current.y;
        if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE_PX) {
          clearLongPressTimer();
          longPressOriginRef.current = null;
        }
      }

      if (!isCoarsePointer || longPressActive) {
        if (rafId) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          setMenuPosition(event.clientX, event.clientY);
        });
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!isCoarsePointer || event.pointerType === 'pen') return;
      longPressOriginRef.current = { x: event.clientX, y: event.clientY };
      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        setLongPressActive(true);
        setMenuPosition(event.clientX, event.clientY);
      }, LONG_PRESS_MS);
    };

    const onPointerUp = () => {
      clearLongPressTimer();
      longPressOriginRef.current = null;
    };

    const onPointerCancel = () => {
      clearLongPressTimer();
      longPressOriginRef.current = null;
      setLongPressActive(false);
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('resize', syncRect);
    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('resize', syncRect);
      clearLongPressTimer();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [visible, containerRef, isCoarsePointer, longPressActive]);

  const menuVisible = visible && (!isCoarsePointer || longPressActive);

  return (
    <RadialToolMenu
      visible={menuVisible}
      x={position.x}
      y={position.y}
      currentTool={currentTool}
      onSelectTool={(tool) => {
        onSelectTool(tool);
        setLongPressActive(false);
      }}
    />
  );
}
