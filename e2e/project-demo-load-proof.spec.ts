import { expect, test } from "@playwright/test";

const BLOCKED_COPY = /Backend not configured|Service configuration required|Application error|Something went wrong/i;

test.describe("project load proof", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("vishvakarma.os.onboardingDismissed.v1", "1");
    });
  });

  test("demo project opens from projects page into editor", async ({ page }) => {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toContainText(BLOCKED_COPY);

    const demoButton = page.getByTestId(/^projects-open-demo-/).first();
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    await expect(page).toHaveURL(/\/editor/);
    await expect(page.getByTestId("editor-top-bar")).toBeVisible();
    await expect(page.getByTestId("tool-rail")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(BLOCKED_COPY);
  });
});
