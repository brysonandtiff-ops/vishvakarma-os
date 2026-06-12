import type { FocusEvent } from 'react';

export function scrollFocusedFieldIntoView(event: FocusEvent<HTMLElement>) {
  requestAnimationFrame(() => {
    event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}
