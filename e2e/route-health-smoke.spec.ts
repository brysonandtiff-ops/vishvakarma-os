import { expect, test, type Page } from "@playwright/test";

type RouteSmokeCase = {
  label: string;
  path: string;
};

const ROUTES: RouteSmokeCase[] = [
  { label: "Landing", path: "/" },
  { label: "Features", path: "/features" },
  { label: "Auth", path: "/auth" },
  { label: "Reset password", path: "/reset-password" },
  { label: "Editor", path: "/editor" },
  { label: "3D Room", path: "/3d-room" },
  { label: "Projects", path: "/projects" },
  { label: "Profile", path: "/profile" },
  { label: "Optimization", path: "/optimization" },
  { label: "Spec Center", path: "/spec-center" },
  { label: "Registry", path: "/registry" },
  { label: "Change Requests", path: "/change-requests" },
  { label: "Releases", path: "/releases" },
  { label: "World Records", path: "/world-records" },
  { label: "Audit", path: "/audit" },
];

const FATAL_UI_TEXT = /Backend not configured|Service configuration required|Application error|Something went wrong|Unhandled Runtime Error|Cannot GET|404: NOT_FOUND/i;
const APP_TEXT = /Vishvakarma|VISHVAKARMA|Blueprint|Architect|Project|Profile|Sign|Release|Registry|Audit|Optimization|World|Spec|Change/i;

async function waitForReactPaint(page: Page) {
  await page.waitForFunction(() => {
    const root = document.querySelector("#root");
    return Boolean(root && root.childElementCount > 0);
  });

  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
}

test.describe("Vishvakarma.OS top-level route health", () => {
  for (const route of ROUTES) {
    test(`${route.label} route renders without fatal UI/config errors`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route.path} should not return a server error`).toBeLessThan(500);

      await waitForReactPaint(page);

      await expect(page.locator("body"), `${route.path} should render app copy`).toContainText(APP_TEXT);
      await expect(page.locator("body"), `${route.path} should not show fatal/config copy`).not.toContainText(FATAL_UI_TEXT);
    });
  }
});
