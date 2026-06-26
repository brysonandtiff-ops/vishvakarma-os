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

async function stopMotion(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
}

test.describe("editor click proof", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seedAppSession(page);
  });

  test("all editor tools select cleanly", async ({ page }) => {
    await page.goto("/editor", { waitUntil: "domcontentloaded" });
    await stopMotion(page);
    await expect(page.getByTestId("editor-top-bar")).toBeVisible();
    await expect(page.getByTestId("tool-rail")).toBeVisible();

    for (const label of TOOL_LABELS) {
      const button = page.getByRole("button", { name: label }).first();
      await expect(button, `${label} tool should exist`).toBeAttached();
      await button.evaluate((element) => {
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });
      await expect(button, `${label} tool should become active`).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("body"), `${label} should not trigger fatal UI copy`).not.toContainText(BLOCKED_COPY);
    }
  });
});
