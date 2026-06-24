import { expect, test, type Page } from "@playwright/test";

const TOOL_LABELS = ["Select", "Pan", "Wall", "Door", "Window", "Measure", "Label", "Dimension", "Room", "Vastu", "Column", "Stair", "MEP", "Furniture", "Landscape", "Terrain"];
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
}

test.describe("editor click proof", () => {
  test.beforeEach(async ({ page }) => {
    await seedAppSession(page);
  });

  test("all editor tools select cleanly", async ({ page }) => {
    await page.goto("/editor", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("editor-top-bar")).toBeVisible();
    await expect(page.getByTestId("tool-rail")).toBeVisible();

    for (const label of TOOL_LABELS) {
      const button = page.getByRole("button", { name: label }).first();
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("body")).not.toContainText(BLOCKED_COPY);
    }
  });
});
