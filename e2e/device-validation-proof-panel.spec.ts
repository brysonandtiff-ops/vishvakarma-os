import { expect, test } from "@playwright/test";

test.describe("Vishvakarma.OS QA proof panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("vishvakarma-analytics-consent", "denied");
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (window as any).__vishCopiedProof = text;
          },
        },
      });
    });
  });

  test("shows QA launcher, opens panel, runs scan, and copies proof", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const launcher = page.locator(".vish-device-validation__launcher");
    await expect(launcher).toBeVisible();
    await expect(launcher).toContainText("QA");

    await launcher.click();

    const panel = page.getByRole("dialog", { name: /device validation checklist/i });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Device Validation/i)).toBeVisible();

    await panel.getByRole("button", { name: /run scan/i }).click();
    await expect(panel.getByText(/Viewport:/i)).toBeVisible();
    await expect(panel.getByText(/Interactive controls scanned:/i)).toBeVisible();

    await panel.getByRole("button", { name: /copy proof/i }).click();
    await expect(panel.getByRole("button", { name: /copied/i })).toBeVisible();

    const copiedProof = await page.evaluate(() => (window as any).__vishCopiedProof || "");
    expect(copiedProof).toContain("Vishvakarma.OS Device Validation Proof");
    expect(copiedProof).toContain("## Checks");
    expect(copiedProof).toContain("## Scan");
  });
});

test.describe("Vishvakarma.OS responsive QA launcher", () => {
  const devices = [
    { name: "iPad 10 landscape", width: 1180, height: 820 },
    { name: "iPad 10 portrait", width: 820, height: 1180 },
    { name: "mobile portrait", width: 390, height: 844 },
  ];

  for (const device of devices) {
    test(`QA launcher remains reachable on ${device.name}`, async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("vishvakarma-analytics-consent", "denied");
      });
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const launcher = page.locator(".vish-device-validation__launcher");
      await expect(launcher).toBeVisible();

      const box = await launcher.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });
  }
});
