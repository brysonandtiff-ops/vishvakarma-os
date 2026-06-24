import { expect, test } from "@playwright/test";

const TOOL_LABELS = ["Select", "Pan", "Wall", "Door", "Window", "Measure", "Label", "Dimension", "Room", "Vastu", "Column", "Stair", "MEP", "Furniture", "Landscape", "Terrain"];
const BLOCKED_COPY = /Backend not configured|Service configuration required|Application error|Something went wrong/i;

test.describe("editor click proof", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("vishvakarma.os.onboardingDismissed.v1", "1");
    });
  });

  test("all editor tools select cleanly", async ({ page }) => {
    await page.goto("/editor", { waitUntil: "domcontentloaded" });
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
