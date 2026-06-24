import { expect, test, type Page } from "@playwright/test";

const BLOCKED_COPY = /Backend not configured|Service configuration required|Application error|Something went wrong/i;

async function seedAppSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("vishvakarma.os.onboardingDismissed.v1", "1");
    window.localStorage.setItem(
      "vishvakarma.os.supabase.session.v1",
      JSON.stringify({
        provider: "supabase",
        uid: "e2e-proof-user",
        email: "e2e-proof@vishvakarma.local",
        idToken: "e2e-proof-access-token",
        refreshToken: "e2e-proof-refresh-token",
        expiresAt: Date.now() + 86_400_000,
      }),
    );
  });

  await page.route("**/rest/v1/profiles**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/rest/v1/projects**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

test.describe("project load proof", () => {
  test.beforeEach(async ({ page }) => {
    await seedAppSession(page);
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
