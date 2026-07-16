import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoAppPath } from './helpers';

async function clickBounded(target: Locator) {
  await target.waitFor({ state: 'visible', timeout: 10_000 });
  const clicked = await target
    .click({ force: true, timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (clicked) return;
  await target.evaluate((element) => (element as HTMLElement).click());
}

async function prepareEditor(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('vishvakarma-analytics-consent', 'denied');
    window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
    window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
  });
  await gotoAppPath(page, '/editor');
}

async function openSimulationPanels(page: Page) {
  const panel = page.getByTestId('akasha-cast-panel');
  if (await panel.isVisible({ timeout: 1_000 }).catch(() => false)) return true;

  const trigger = page.getByRole('button', { name: /Simulation & proof panels/i }).first();
  if (!(await trigger.isVisible({ timeout: 2_000 }).catch(() => false))) return false;

  await clickBounded(trigger);
  return panel.isVisible({ timeout: 5_000 }).catch(() => false);
}

test.describe('Akasha Cast', () => {
  test('shows the Studio panel or the correct Starter-tier state', async ({ page }) => {
    await prepareEditor(page);
    const panelAvailable = await openSimulationPanels(page);
    const panel = page.getByTestId('akasha-cast-panel');

    if (panelAvailable) {
      await expect(panel).toBeVisible();
      await expect(panel).toContainText(/Akasha Cast/i);
      return;
    }

    await expect(panel).toHaveCount(0);
    await expect(page.getByText('starter', { exact: true }).first()).toBeVisible();
  });

  test('local cast start exposes viewer link and viewer page shell', async ({ browser }) => {
    const presenterContext = await browser.newContext();
    const viewerContext = await browser.newContext();

    try {
      const presenter = await presenterContext.newPage();
      const viewer = await viewerContext.newPage();

      await prepareEditor(presenter);
      const panelAvailable = await openSimulationPanels(presenter);
      if (!panelAvailable) {
        test.skip(true, 'Akasha Cast requires Studio tier in configured backend builds');
      }

      const startButton = presenter.getByTestId('akasha-cast-start');
      if (!(await startButton.isVisible({ timeout: 2_000 }).catch(() => false))) {
        test.skip(true, 'Akasha Cast start requires Studio tier in configured backend builds');
      }

      await clickBounded(startButton);
      await expect(presenter.getByTestId('akasha-cast-stop')).toBeVisible({ timeout: 15_000 });
      await expect(presenter.getByTestId('akasha-cast-copy-link')).toBeVisible();

      const shareUrl = await presenter.evaluate(async () => {
        const panel = document.querySelector('[data-testid="akasha-cast-panel"]');
        if (!panel) return null;
        const { getCastSessionManager } = await import('/src/cast/CastSessionManager.ts');
        return getCastSessionManager().getShareUrl();
      });

      expect(shareUrl).toMatch(/\/cast\//);

      if (shareUrl) {
        const path = new URL(shareUrl).pathname;
        await viewer.addInitScript(() => {
          window.localStorage.setItem('vishvakarma-analytics-consent', 'denied');
        });
        await gotoAppPath(viewer, path);
        await expect(viewer.getByTestId('cast-viewer-page')).toBeVisible({ timeout: 15_000 });
      }
    } finally {
      await presenterContext.close();
      await viewerContext.close();
    }
  });
});
