import { useCallback, useRef } from 'react';
import type { ButtonHTMLAttributes, PointerEvent as ReactPointerEvent } from 'react';

/**
 * iPad Safari can occasionally drop the synthetic click after a touch/pen tap when
 * editor chrome is inside nested scroll/gesture regions. Run touch/pen activation
 * directly on pointer-up and suppress the follow-up click so controls only fire once.
 */
export function useReliablePress(onPress?: () => void) {
  const suppressNextClickRef = useRef(false);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      if (!onPress) return;

      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);

      event.preventDefault();
      event.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(50);
      onPress();
    },
    [onPress],
  );

  const onClick = useCallback<NonNullable<ButtonHTMLAttributes<HTMLButtonElement>['onClick']>>(
    (event) => {
      if (suppressNextClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (navigator.vibrate) navigator.vibrate(50);
      onPress?.();
    },
    [onPress],
  );

  return { onClick, onPointerUp } satisfies Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'onPointerUp'
  >;
}
