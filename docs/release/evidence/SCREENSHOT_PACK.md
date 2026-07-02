# Release Screenshot Pack

Capture these assets for demo decks, store listings, investor walkthroughs, and `FINAL_CLEANUP_EVIDENCE.md` sign-off.

**Output folder:** `docs/release/evidence/screenshots/`  
**Recommended viewport:** iPad 11 landscape — 1194×834  
**Also capture:** Desktop 1440×900 and iPhone portrait/landscape after major polish passes.

## Full page reference pack

For a complete per-route reference library, see [PAGE_REFERENCE.md](../../design/page-references/PAGE_REFERENCE.md) and run:

```bash
pnpm run capture:page-references
```

## Automated release capture

```bash
pnpm run test:screenshots
```

Builds with `vite build --mode e2e` and `VITE_E2E_ALLOW_LOCAL_ACCESS=true` so the preview can reach `/editor` without production auth. Requires Playwright Chromium (`pnpm run test:e2e:install`).

Generated files:

| File | Route / action | Truth check |
|------|----------------|-------------|
| `01-landing-hero.png` | `/` | Landing renders with Sacred 3D / editor positioning |
| `02-auth-google-sso.png` | `/auth` | Google SSO-only auth; no email/password/magic-link/local login UI |
| `03-editor-2d-sample.png` | `/editor` + load sample | Canvas + tool rail + sample project visible |
| `04-editor-3d-premium.png` | Toggle 3D view | 3D pane visible or graceful WebGL fallback state |
| `05-export-package-dialog.png` | Open Export Package dialog | Export UI visible with truthful format/capability copy |
| `06-projects-empty.png` | `/projects` | Empty/local/cloud project state is readable |
| `07-features-truth-badges.png` | `/features` → All Features tab | Available vs Preview badges are visible |
| `08-pricing-tiers.png` | `/pricing` | Pricing tiers render without clipped badges or overflow |
| `09-optimization-empty.png` | `/optimization` | Design battle/optimization empty state renders, no loading hang |
| `10-releases.png` | `/releases` | Release evidence page renders |
| `11-world-records.png` | `/world-records` | Registry page renders with honest candidate wording |
| `12-audit.png` | `/audit` | Audit/timeline page renders |

## Manual captures: Supabase / production states

These need a configured Supabase production or staging session and should be captured by an operator after sign-in:

| # | Subject | Steps | Filename |
|---|---------|-------|----------|
| 13 | Google OAuth redirect | `/auth` → Continue with Google SSO → return to `/editor` | `13-google-oauth-return.png` |
| 14 | Cloud Save badge | Supabase env on Vercel → sign in → editor toolbar shows cloud-connected save state | `14-cloud-save-badge.png` |
| 15 | Projects populated | Sign in → save project → `/projects` with ≥1 row | `15-projects-populated.png` |
| 16 | Registry create enabled | Supabase configured → `/registry` → Register Entry | `16-registry-form-open.png` |
| 17 | Change request enabled | Supabase configured → `/change-requests` → New Request | `17-change-request-open.png` |

## Truthful-functionality checklist

- Auth shows **Google SSO only**; no email input, password input, magic link, password reset, Apple, or local workspace login path.
- Feature badges must distinguish **Available** vs **Preview**.
- Cloud-backed actions must say or imply they require Supabase/auth when they cannot complete locally.
- Disabled or preview controls must not look like fully functional production actions.
- Editor shows 2D canvas, tool rail, properties, sample load, export, and 3D preview/fallback clearly.
- Pricing badges and CTA cards must not clip on phone/iPad/desktop.
- No page may have horizontal overflow at standard phone, iPad portrait, iPad landscape, or desktop widths.
- No placeholder “lorem,” fake CAD certification, or unverified production claims should appear in screenshots.

## Attach to evidence

After capture, update [FINAL_CLEANUP_EVIDENCE.md](./FINAL_CLEANUP_EVIDENCE.md):

```markdown
## Screenshot pack

- [x] Automated pack: `docs/release/evidence/screenshots/` (date)
- [ ] Manual Supabase/auth items 13–17 (operator)
```
