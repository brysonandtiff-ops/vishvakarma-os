# Vishvakarma.OS Post-READY Deep Proof Matrix

Date: 2026-06-24
Status: deeper proof hardening in progress

This matrix separates automated proof from evidence that requires a human, a real device, or a real customer/payment event.

## Automated proof added in this branch

### Editor tool clickthrough

File: `e2e/editor-tool-clickthrough-proof.spec.ts`

Checks:

- Opens `/editor`.
- Dismisses the first-run overlay through local storage.
- Confirms the tool rail is visible.
- Clicks every visible tool button.
- Confirms the active tool state changes.
- Confirms no backend/config/fatal app copy appears.

Tools covered:

- Select
- Pan
- Wall
- Door
- Window
- Measure
- Label
- Dimension
- Room
- Vastu
- Column
- Stair
- MEP
- Furniture
- Landscape
- Terrain

### Project load path

File: `e2e/project-demo-load-proof.spec.ts`

Checks:

- Opens `/projects`.
- Confirms no backend/config/fatal app copy appears.
- Opens a demo project into the editor.
- Confirms the editor top bar and tool rail render after project load.

This proves a project/demo load path. Cloud save/load stress still requires a disposable authenticated Supabase user.

### Deep proof Playwright config

File: `playwright.deep-proof.config.ts`

Run with:

```bash
pnpm exec playwright test --config=playwright.deep-proof.config.ts
```

## Already completed before this branch

### Route health smoke

File: `e2e/route-health-smoke.spec.ts`

Checks all major top-level routes for server errors, React paint, recognizable app copy, and no backend/config failure copy.

### QA proof panel smoke

File: `e2e/device-validation-proof-panel.spec.ts`

Checks the QA launcher, proof panel, scan action, copy-proof action, and key device launcher reachability.

## Manual or environment-backed proof still required

### Cloud project save/load stress

Needs:

- Disposable authenticated Supabase user.
- Known E2E email/password or test OAuth session.
- Permission-safe test project prefix.

Proof goal:

- Create multiple projects.
- Save/update/load/delete them.
- Confirm no orphaned test records remain.

### Multi-user role proof

Needs:

- At least two test users.
- Role fixture plan for owner, co-owner/admin/family roles.
- RLS policy assertions for owner-only and collaborator access.

Current database hardening performed:

- `public.is_project_member(project_row public.projects)` now has an explicit `search_path`.
- `public.is_project_owner(project_row public.projects)` now has an explicit `search_path`.

### iPad real-device manual proof

Needs:

- Real iPad 10 or equivalent Safari/iPadOS device.
- Screen recording or screenshots.
- Manual checklist signed off.

Required checks:

- Auth loads.
- Google SSO begins.
- Editor opens.
- Tool rail reachable.
- QA launcher reachable.
- No horizontal overflow blocking primary controls.

### Security advisor cleanup

One safe database hardening fix was applied directly through Supabase migration:

- Added immutable search path to project role helper functions.

Remaining warnings need careful follow-up because they can affect app data access:

- `ai_usage` RLS enabled with no policy.
- Broad audit insert policy.
- Public storage bucket listing warning for `materials`.
- GraphQL visibility warnings.
- Security definer function execute warnings.
- Leaked password protection disabled.
- MFA options insufficient.

### Real paying user trial

This cannot be simulated truthfully by an automated test.

Needs:

- Real buyer or pilot user.
- Payment or signed trial agreement.
- Trial session evidence.
- Support notes and outcome.

### Long-session stability

Needs:

- Local or CI run with a longer timeout budget.
- Recommended duration: 30 minutes for pilot proof, 2 hours for stronger confidence.
- Capture browser console, Vercel runtime logs, and memory/performance notes.

## Truthful final statement

The app is READY for the verified auth/backend/editor-entry and route-health launch scope.

This branch adds deeper proof scripts for editor tool clickthrough and demo project load. It does not falsely claim cloud save/load, multi-user roles, real-device iPad use, or paying-customer validation until those have dedicated evidence.
