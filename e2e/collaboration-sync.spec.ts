import { test, expect } from '@playwright/test';
import { dismissConsentIfPresent, gotoAppPath } from './helpers';

test.describe('Collaboration sync', () => {
  test('shows collaboration bar for saved cloud project context', async ({ page }) => {
    await gotoAppPath(page, '/editor');
    await dismissConsentIfPresent(page);

    const bar = page.getByTestId('editor-collaboration-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText(/local session|save project to collaborate|collaboration/i);
  });

  test('two editor contexts share collaboration bar state locally', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await gotoAppPath(pageA, '/editor');
    await gotoAppPath(pageB, '/editor');
    await dismissConsentIfPresent(pageA);
    await dismissConsentIfPresent(pageB);

    await expect(pageA.getByTestId('editor-collaboration-bar')).toBeVisible();
    await expect(pageB.getByTestId('editor-collaboration-bar')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
