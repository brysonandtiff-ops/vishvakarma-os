# Vishvakarma.OS Multi-Device Human Truth Validation

## Purpose

This system validates Vishvakarma.OS as a first-time user would experience it across supported device classes. It is deliberately stricter than a responsive-layout smoke test: a route or control only passes when the application remains usable, readable, reachable and free from recorded runtime failures.

The validation contract covers usability, compatibility, responsiveness, touch interaction, accessibility, visual quality, core editor behaviour, 3D route stability, governance routes, export reachability and PWA shell integrity.

## Truth boundary

Evidence must always be classified correctly:

- **REAL DEVICE** — physical hardware actually used.
- **BROWSER ENGINE** — an actual Chromium, Firefox or WebKit engine run by Playwright or a browser.
- **EMULATED DEVICE** — viewport/touch/mobile-context emulation. This is useful compatibility evidence but is not physical-device proof.

Never report a Playwright iPhone/iPad profile as a physical iPhone/iPad test.

## Repository guard

Canonical repository:

`brysonandtiff-ops/vishvakarma-os`

The runner verifies both:

1. `package.json.name === "vishvakarma-os"`
2. `origin` resolves to the canonical GitHub repository.

A local checkout may have any folder name (for example a cutover/worktree folder), but the repository identity must match before testing begins.

The runner records:

- local repository root
- branch
- HEAD SHA
- origin
- worktree state
- timestamp
- Node/platform information
- baseline/final mode

## Automated emulated-device matrix

`playwright.device-truth.config.ts` currently defines representative profiles for:

| Profile | Browser engine | Class |
|---|---|---|
| Small iPhone class | WebKit | Phone |
| Standard iPhone class | WebKit | Phone |
| Large iPhone Pro Max class | WebKit | Phone |
| Pixel/Galaxy class | Chromium | Phone |
| iPad mini class | WebKit | Tablet |
| iPad Air/Pro 11-inch class | WebKit | Tablet |
| iPad Pro 13-inch class | WebKit | Tablet |
| Android 10–11-inch tablet class | Chromium | Tablet |
| Windows/laptop 1366×768 class | Chromium | Desktop |
| Desktop 1920×1080 class | Chromium | Desktop |
| Desktop 1440×900 class | Firefox | Desktop |
| Safari/WebKit desktop class | WebKit | Desktop |
| Surface-style touch laptop class | Chromium | Hybrid |

The matrix intentionally uses device-*classes*. Browser automation cannot prove physical safe-area behaviour, Apple Pencil hardware characteristics, OS keyboard behaviour, PWA installation UX or real GPU performance.

## Canonical routes covered by the automated baseline

- `/`
- `/features`
- `/projects`
- `/editor`
- `/3d-room`
- `/optimization`
- `/spec-center`
- `/registry`
- `/change-requests`
- `/releases`
- `/audit`

Every route baseline checks:

- route responds without HTTP 5xx
- body renders
- application error boundary is not visible
- no horizontal viewport overflow
- screenshot evidence is captured
- uncaught page errors are collected
- browser console errors are collected
- same-origin failed requests are collected
- same-origin HTTP 5xx responses are collected

A visually attractive route with an uncaught runtime exception is not a clean pass.

## First-time editor truth test

Each profile also executes a core editor interaction test:

1. open the editor from clean local E2E state
2. dismiss first-run overlays safely
3. confirm ToolRail and blueprint canvas are visible
4. validate touch targets on non-desktop profiles
5. select the Wall tool
6. draw a wall using mouse or touch-style pointer input
7. prove the wall count changed
8. reach Undo
9. reach Redo
10. open the Export dialog
11. capture export evidence
12. fail if runtime/network truth collectors recorded clean-room errors

This does not replace the larger existing Vishvakarma editor workflow suite. It is a cross-device truth gate layered over it.

## Rotation/state test

Phone, tablet and hybrid profiles perform an editor rotation/resize test:

1. open the editor
2. draw a wall
3. record wall count
4. swap the viewport to the opposite orientation
5. verify canvas remains visible
6. verify no horizontal overflow
7. verify wall count/state is preserved
8. capture landscape evidence
9. return to canonical orientation
10. verify state is still preserved

This catches layout rotation regressions that a static screenshot cannot.

## PWA shell truth

The automated PWA check verifies that:

- a manifest link is declared
- the manifest can be retrieved
- the manifest contains an application name

This is **not** proof of physical-device installation, offline editing, splash-screen correctness or OS-level update behaviour.

Those remain manual real-device gates.

## Running locally on Windows

From the Vishvakarma.OS repository root:

```powershell
.\RUN_VISHVAKARMA_DEVICE_TRUTH.ps1
```

Install Playwright browsers first if required:

```powershell
.\RUN_VISHVAKARMA_DEVICE_TRUTH.ps1 -InstallBrowsers
```

Run only one profile while debugging:

```powershell
.\RUN_VISHVAKARMA_DEVICE_TRUTH.ps1 -Project "ipad-11-webkit"
```

After repairs, generate the final report name instead of the baseline report:

```powershell
.\RUN_VISHVAKARMA_DEVICE_TRUTH.ps1 -Final
```

Equivalent cross-platform command:

```bash
node scripts/device-truth/run.mjs
```

## Baseline-first rule

Do not erase or hide initial failures.

The first run generates:

`evidence/device-tests/MULTI_DEVICE_BASELINE_REPORT.md`

Fixes should only begin after the baseline is preserved externally if the evidence directory will be cleaned.

After repairs:

1. re-run failed profiles/tests
2. run the complete critical matrix again
3. run with `-Final`
4. compare the final report with the baseline

The final automated report is:

`evidence/device-tests/VISHVAKARMA_MULTI_DEVICE_TRUTH_REPORT.md`

## Generated evidence

The runner writes generated evidence under:

`evidence/device-tests/`

This directory is gitignored because screenshots, traces, video and browser reports are runtime artifacts rather than source code.

Expected contents include:

- `run-metadata.json`
- `results.json`
- `MULTI_DEVICE_BASELINE_REPORT.md` or `VISHVAKARMA_MULTI_DEVICE_TRUTH_REPORT.md`
- `screenshots/<project>/...png`
- `artifacts/`
- `html-report/`

## Severity model

Use the following human classification when triaging findings:

- **P0** — crash, data loss, security failure or complete blocker
- **P1** — core workflow is broken
- **P2** — major device/UX defect
- **P3** — polish/minor visual defect

The automated report uses conservative default severity mapping for its own failures. A human must upgrade/downgrade severity based on actual product impact.

## Physical-device validation checklist

The automated matrix is only half of the release proof. For any device family claimed as truly supported, run the critical workflow on physical hardware and record the exact device, OS and browser version.

### iPhone

Validate where available:

- portrait + landscape
- Safari
- safe areas/notch
- one-finger touch
- pinch zoom and scrolling
- form keyboard opening/dismissal
- dialogs/dropdowns
- file upload
- PWA installation/standalone launch

### Android phone

Validate where available:

- portrait + landscape
- Chrome
- Android keyboard
- back navigation
- overscroll/gesture conflicts
- dialogs/file upload
- PWA installability

### iPad — priority platform

Validate on representative physical iPad hardware where available:

- iPad mini
- 11-inch iPad Air/Pro
- 13-inch iPad Pro
- Safari
- portrait + landscape
- Apple Pencil interaction where hardware is available
- coarse touch targets
- wall/door/window placement
- selection, pan and zoom
- inspectors and ToolRail
- Copilot/modals
- 3D orbit
- material selection
- software keyboard
- split-view-like widths
- PWA standalone mode

### Android tablet

Validate portrait/landscape, Chrome, touch editing, keyboard behaviour, 3D, export and PWA.

### Windows desktop/laptop

Validate Chrome, Edge and Firefox where installed, representative resolutions, keyboard/mouse workflow and display scaling where practical.

### macOS

Only claim macOS/Safari proof when physical or genuinely hosted macOS/Safari execution occurred. WebKit-on-Windows/Linux automation is browser-engine evidence, not macOS hardware proof.

### Touch hybrid

Where Surface-style hardware is available, switch between mouse, touch and keyboard and confirm coarse/fine-pointer state does not corrupt the workspace.

## Physical critical workflow

On every meaningful real-device class:

1. start from clean first-run state
2. launch Vishvakarma.OS
3. authenticate/enter the workspace
4. understand the dashboard without developer guidance
5. create a project
6. draw exterior/internal walls
7. create at least 2–3 rooms
8. add doors/windows/dimensions/labels/furniture
9. test undo/redo
10. edit element properties
11. save
12. reload and prove persistence
13. open Live 3D
14. navigate the model
15. change environment/time settings
16. return to 2D and prove geometry is unchanged
17. review optimisation candidates/trade-offs
18. open Registry and Spec Center
19. exercise governance surfaces
20. reach Export and attempt supported formats
21. return to the dashboard
22. reopen the project and prove it still exists

Record any friction even when the workflow technically succeeds.

## Manual torture tests

The physical-device pass should additionally exercise:

- rapid tapping/clicking
- slow deliberate input
- drag outside canvas
- drag across UI
- double tap/double click
- long press
- pinch/wheel zoom
- pan
- draw while zoomed
- rapid undo/redo
- repeated select/deselect
- mobile keyboard opening/dismissal
- background/foreground app switching
- network slowdown/offline/reconnection
- larger project stress

Watch specifically for ghost/duplicate walls, lost pointer capture, incorrect snapping, stuck tools, overlays intercepting canvas input, accidental browser zoom, state loss and silent save failure.

## Human new-user review

Finish every physical-device campaign with a non-developer review covering:

- first impression
- ease of learning
- 2D editor experience
- 3D experience
- phone experience
- iPad experience
- desktop experience
- navigation
- visual design
- speed
- frustrations
- confusing features
- favourite feature
- trust/professionalism
- whether an architect would keep using it
- what would make them stop using it
- overall score /100

The objective is truth, not reassurance.

## Production verdict rules

Report separate verdicts for:

- Desktop Ready
- Phone Ready
- iPad Ready
- Android Tablet Ready
- PWA Ready
- Production Multi-Device Ready

Use `YES`, `CONDITIONAL` or `NO` and state the evidence supporting the verdict.

A green emulated matrix alone can only justify a **conditional** multi-device verdict when physical-device proof is still missing.
