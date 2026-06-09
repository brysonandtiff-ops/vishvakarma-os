import { expect, test } from '@playwright/test';
import { dismissEditorOverlays } from './helpers';

/**
 * Lightweight smoke suite for Firefox and WebKit (Gate 1.1 cross-browser proof).
 * Runs the same critical paths as app-smoke without duplicating every editor test.
 */
test.describe('cross-browser smoke', () => {
  test.setTimeout(90_000);

  test('marketing landing renders hero and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Free/i }).first()).toBeVisible();
  });

  test('editor loads with toolbar and canvas', async ({ page }) => {
    await dismissEditorOverlays(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible();
    await expect(page.getByTestId('tool-rail').getByRole('button', { name: 'Wall' })).toBeVisible();
  });

  test('governance releases page loads', async ({ page }) => {
    await page.goto('/releases', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /release/i }).first()).toBeVisible();
  });
});
