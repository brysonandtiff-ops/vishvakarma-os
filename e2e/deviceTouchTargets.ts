import { expect, type Page } from '@playwright/test';

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow).toBe(false);
}

export async function assertTouchTargets(
  page: Page,
  selectors: string[],
  minPx = 44,
) {
  const tooSmall = await page.evaluate(
    ({ selectors: sels, min }) => {
      const buttons = sels.flatMap((sel) =>
        Array.from(document.querySelectorAll<HTMLElement>(sel)),
      );
      const seen = new Set<Element>();
      const failures: string[] = [];
      for (const el of buttons) {
        if (seen.has(el)) continue;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
          continue;
        }
        if (rect.width < min || rect.height < min) {
          failures.push(
            `${el.getAttribute('aria-label') ?? el.textContent?.trim()?.slice(0, 40) ?? el.tagName}: ${Math.round(rect.width)}x${Math.round(rect.height)}`,
          );
        }
      }
      return failures;
    },
    { selectors, min: minPx - 1 },
  );
  expect(tooSmall, `Touch targets below ${minPx}px: ${tooSmall.join(', ')}`).toEqual([]);
}

export async function emulateCoarsePointer(page: Page) {
  await page.emulateMedia({ media: 'screen' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => {
        const coarse = query.includes('pointer: coarse') || query.includes('hover: none');
        return {
          matches: coarse,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as MediaQueryList;
      },
    });
  });
}
