# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: page-reference-pack.spec.ts >> page reference pack >> captures full visual inventory
- Location: e2e\page-reference-pack.spec.ts:173:3

# Error details

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

# Test source

```ts
  1   | import { mkdirSync } from 'node:fs';
  2   | import { join } from 'node:path';
  3   | import { expect, test, type Page } from '@playwright/test';
  4   | import { dismissEditorOverlays, loadSampleProject, openProjectActionsMenu } from './helpers';
  5   | 
  6   | const ROOT = join(process.cwd(), 'docs/design/page-references');
  7   | const DIRS = {
  8   |   marketing: join(ROOT, 'marketing'),
  9   |   editor: join(ROOT, 'editor'),
  10  |   workspace: join(ROOT, 'workspace'),
  11  |   governance: join(ROOT, 'governance'),
  12  | } as const;
  13  | 
  14  | const LOCAL_DRAFT_KEY = 'vishvakarma.os.editor.localDraft.v1';
  15  | const ONBOARDING_DISMISSED_KEY = 'vishvakarma.os.onboardingDismissed.v1';
  16  | 
  17  | function shot(page: Page, dir: keyof typeof DIRS, name: string, fullPage = false) {
  18  |   return page.screenshot({
  19  |     path: join(DIRS[dir], name),
  20  |     fullPage,
  21  |   });
  22  | }
  23  | 
  24  | async function clearAppStorage(page: Page) {
  25  |   await page.goto('/');
  26  |   await page.evaluate(() => localStorage.clear());
  27  | }
  28  | 
  29  | async function clickForce(page: Page, name: RegExp | string, timeout = 10_000) {
  30  |   const button = page.getByRole('button', { name }).first();
  31  |   await expect(button).toBeVisible({ timeout });
  32  |   await button.evaluate((el) => {
  33  |     (el as HTMLButtonElement).click();
  34  |   });
  35  | }
  36  | 
  37  | async function clickDom(page: Page, name: RegExp | string) {
  38  |   await page.getByRole('button', { name }).first().evaluate((el) => {
  39  |     (el as HTMLButtonElement).click();
  40  |   });
  41  | }
  42  | 
  43  | async function clickProjectActionsMenuItem(page: Page, name: RegExp | string) {
  44  |   let lastError: unknown;
  45  |   for (let attempt = 0; attempt < 4; attempt += 1) {
  46  |     try {
  47  |       await openProjectActionsMenu(page);
  48  |       const item = page.getByRole('menuitem', { name }).first();
  49  |       await expect(item).toBeVisible({ timeout: 10_000 });
  50  |       await item.evaluate((el) => {
  51  |         (el as HTMLElement).click();
  52  |       });
  53  |       await page.waitForTimeout(250);
  54  |       return;
  55  |     } catch (error) {
  56  |       lastError = error;
  57  |       await page.keyboard.press('Escape').catch(() => {});
> 58  |       await page.waitForTimeout(300);
      |                  ^ Error: page.waitForTimeout: Target page, context or browser has been closed
  59  |     }
  60  |   }
  61  |   if (lastError instanceof Error) throw lastError;
  62  |   throw new Error(`Could not click Project actions menu item: ${String(name)}`);
  63  | }
  64  | 
  65  | async function openImportFloorPlanDialog(page: Page): Promise<boolean> {
  66  |   const directButton = page.getByRole('button', { name: /import floor plan/i }).first();
  67  |   if (await directButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
  68  |     await directButton.evaluate((el) => {
  69  |       (el as HTMLButtonElement).click();
  70  |     });
  71  |     return true;
  72  |   }
  73  | 
  74  |   try {
  75  |     await clickProjectActionsMenuItem(page, /import/i);
  76  |     return true;
  77  |   } catch (error) {
  78  |     console.warn('[page-reference-pack] Import floor plan action not visible in current editor chrome; skipping import dialog screenshot.', error);
  79  |     await page.keyboard.press('Escape').catch(() => {});
  80  |     return false;
  81  |   }
  82  | }
  83  | 
  84  | async function dismissWorkspaceNotifications(page: Page) {
  85  |   const dismiss = page.getByRole('button', { name: /dismiss notification/i });
  86  |   if (await dismiss.isVisible().catch(() => false)) {
  87  |     await dismiss.click({ force: true });
  88  |   }
  89  | }
  90  | 
  91  | async function loadSampleBlueprint(page: Page) {
  92  |   await dismissWorkspaceNotifications(page);
  93  | 
  94  |   const onboardingVisible = await page.getByTestId('first-run-welcome').isVisible().catch(() => false);
  95  |   if (onboardingVisible) {
  96  |     await clickDom(page, /load sample blueprint/i);
  97  |     await expect(page.getByRole('dialog', { name: /load sample blueprint/i })).toBeVisible({ timeout: 15_000 });
  98  |     await page.getByRole('button', { name: /load blueprint/i }).click();
  99  |     await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  100 |     await page.waitForFunction(
  101 |       () => {
  102 |         const bar = document.querySelector('.ws-status-bar');
  103 |         const text = bar?.textContent ?? '';
  104 |         const match = text.match(/Walls:\s*(\d+)/i);
  105 |         return Boolean(match && Number(match[1]) > 0);
  106 |       },
  107 |       { timeout: 30_000 },
  108 |     );
  109 |     return;
  110 |   }
  111 | 
  112 |   await loadSampleProject(page);
  113 | }
  114 | 
  115 | async function seedDraftRecovery(page: Page) {
  116 |   await page.evaluate(
  117 |     ({ key }) => {
  118 |       const payload = {
  119 |         version: 1,
  120 |         savedAt: new Date().toISOString(),
  121 |         projectId: null,
  122 |         projectName: 'Recovery Reference Draft',
  123 |         manifest: {
  124 |           version: '1.0.0',
  125 |           name: 'Recovery Reference Draft',
  126 |           walls: [
  127 |             {
  128 |               id: 'wall-ref-1',
  129 |               start: { x: 100, y: 100 },
  130 |               end: { x: 300, y: 100 },
  131 |               thickness: 12,
  132 |               height: 96,
  133 |               material: 'material-brick',
  134 |             },
  135 |           ],
  136 |           openings: [],
  137 |           materials: [],
  138 |           floorMaterial: 'material-concrete',
  139 |           lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
  140 |           gridSize: 20,
  141 |           snapToGrid: true,
  142 |           metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  143 |         },
  144 |       };
  145 |       localStorage.setItem(key, JSON.stringify(payload));
  146 |       localStorage.removeItem('vishvakarma.os.onboardingDismissed.v1');
  147 |     },
  148 |     { key: LOCAL_DRAFT_KEY },
  149 |   );
  150 | }
  151 | 
  152 | async function prepareEditorWithSample(page: Page) {
  153 |   await clearAppStorage(page);
  154 |   await page.evaluate(
  155 |     (key) => localStorage.setItem(key, '1'),
  156 |     ONBOARDING_DISMISSED_KEY,
  157 |   );
  158 |   await dismissEditorOverlays(page);
```