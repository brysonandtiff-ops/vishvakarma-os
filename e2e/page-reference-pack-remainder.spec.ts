import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const GOVERNANCE_DIR = join(process.cwd(), 'docs/design/page-references/governance');

function shot(page: Page, name: string) {
  return page.screenshot({ path: join(GOVERNANCE_DIR, name), fullPage: false });
}

async function dismissWorkspaceNotifications(page: Page) {
  const dismiss = page.getByRole('button', { name: /dismiss notification/i });
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click({ force: true });
  }
}

test.describe('page reference pack remainder', () => {
  test.beforeAll(() => {
    mkdirSync(GOVERNANCE_DIR, { recursive: true });
  });

  test('captures remaining governance references', async ({ page }) => {
    test.setTimeout(180_000);
    // Registry / change-request create dialogs require Firebase and stay disabled in local e2e mode.
    // 26-registry-form.png and 28-change-new-dialog.png are documented as manual captures in PAGE_REFERENCE.md.
    await page.goto('/registry');
    await dismissWorkspaceNotifications(page);
    await expect(page.getByTestId('registry-loading-skeleton')).toBeHidden({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: /registry center/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^register entry$/i }).first()).toBeVisible();
    await shot(page, '26-registry-form.png');

    await page.goto('/change-requests');
    await dismissWorkspaceNotifications(page);
    await expect(page.getByRole('heading', { name: /change request/i }).first()).toBeVisible();
    await shot(page, '27-change-requests.png');
    await expect(page.getByRole('button', { name: /^new request$/i }).first()).toBeVisible();
    await shot(page, '28-change-new-dialog.png');

    await page.goto('/releases');
    await dismissWorkspaceNotifications(page);
    await expect(page.getByRole('heading', { name: /release center/i }).first()).toBeVisible();
    await shot(page, '29-releases.png');

    await page.goto('/world-records');
    await dismissWorkspaceNotifications(page);
    await expect(page.getByRole('heading', { name: /world record registry/i }).first()).toBeVisible();
    await shot(page, '30-world-records.png');

    await page.goto('/audit');
    await dismissWorkspaceNotifications(page);
    await expect(page.getByRole('heading', { name: /audit log/i }).first()).toBeVisible();
    await shot(page, '31-audit.png');
  });
});
