import { test, expect, type Locator } from '@playwright/test';
import { dismissConsentIfPresent, gotoAppPath } from './helpers';

async function clickBounded(target: Locator) {
  await target.waitFor({ state: 'visible', timeout: 10_000 });
  const clicked = await target
    .click({ force: true, timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (clicked) return;
  await target.evaluate((element) => (element as HTMLElement).click());
}

test.describe('Akasha Cast', () => {
  async function openSimulationPanels(page: import('@playwright/test').Page) {
    const panel = page.getByTestId('akasha-cast-panel');
    if (await panel.isVisible({ timeout: 1_000 }).catch(() => false)) return;

    const trigger = page.getByRole('button', { name: /Simulation & proof panels/i }).first();
    await clickBounded(trigger);
    await expect(panel).toBeVisible({ timeout: 10_000 });
  }

  test('shows Akasha Cast panel in editor more menu area', async ({ page }) => {
    await gotoAppPath(page, '/editor');
    await dismissConsentIfPresent(page);
    await openSimulationPanels(page);

    const panel = page.getByTestId('akasha-cast-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/Akasha Cast/i);
  });

  test('local cast start exposes viewer link and viewer page shell', async ({ browser }) => {
    const presenterContext = await browser.newContext();
    const viewerContext = await browser.newContext();

    try {
      const presenter = await presenterContext.newPage();
      const viewer = await viewerContext.newPage();

      await gotoAppPath(presenter, '/editor');
      await dismissConsentIfPresent(presenter);
      await openSimulationPanels(presenter);

      const startButton = presenter.getByTestId('akasha-cast-start');
      if (!(await startButton.isVisible({ timeout: 2_000 }).catch(() => false))) {
        test.skip(true, 'Akasha Cast start requires Studio tier in configured backend builds');
      }

      await clickBounded(startButton);
      await expect(presenter.getByTestId('akasha-cast-stop')).toBeVisible({ timeout: 15_000 });

      const copyButton = presenter.getByTestId('akasha-cast-copy-link');
      await expect(copyButton).toBeVisible();

      const shareUrl = await presenter.evaluate(async () => {
        const panel = document.querySelector('[data-testid="akasha-cast-panel"]');
        if (!panel) return null;
        const { getCastSessionManager } = await import('/src/cast/CastSessionManager.ts');
        return getCastSessionManager().getShareUrl();
      });

      expect(shareUrl).toMatch(/\/cast\//);

      if (shareUrl) {
        const path = new URL(shareUrl).pathname;
        await gotoAppPath(viewer, path);
        await dismissConsentIfPresent(viewer);
        await expect(viewer.getByTestId('cast-viewer-page')).toBeVisible({ timeout: 15_000 });
      }
    } finally {
      await presenterContext.close();
      await viewerContext.close();
    }
  });
});
