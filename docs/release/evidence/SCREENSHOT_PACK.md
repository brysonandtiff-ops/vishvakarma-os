# Release Screenshot Pack

Capture these assets for demo decks, store listings, and `FINAL_CLEANUP_EVIDENCE.md` sign-off.

**Output folder:** `docs/release/evidence/screenshots/`  
**Recommended viewport:** iPad 11 landscape — 1194×834 (Playwright `iPad (gen 7) landscape`)  
**Also capture:** Desktop 1440×900 for marketing pages

## Full page reference pack (development)

For a complete per-route reference library (31 automated captures + manual checklist), see [PAGE_REFERENCE.md](../../design/page-references/PAGE_REFERENCE.md) and run:

```bash
pnpm run capture:page-references
```

## Automated capture

```bash
pnpm run test:screenshots
```

Builds with `vite build --mode e2e` and `VITE_E2E_ALLOW_LOCAL_ACCESS=true` (via Playwright webServer env) so the preview can reach `/editor` without Firebase. Requires Playwright Chromium (`pnpm run test:e2e:install`).

Generated files:

| File | Route / action |
|------|----------------|
| `01-landing-hero.png` | `/` |
| `02-auth-email-link.png` | `/auth` |
| `03-editor-2d-sample.png` | `/editor` + load sample |
| `04-editor-3d-premium.png` | Toggle 3D view |
| `05-export-package-dialog.png` | Open Export Package dialog |
| `06-projects-empty.png` | `/projects` |
| `07-features-ready-badges.png` | `/features` → All Features tab |

## Manual captures (recommended)

These need Firebase configured or specific states Playwright cannot fully simulate:

| # | Subject | Steps | Filename |
|---|---------|-------|----------|
| 8 | 3D Standard mode | Editor → 3D → tap **Standard** atmosphere | `08-editor-3d-standard.png` |
| 9 | Local Draft banner | Deploy preview with missing Firebase env, open `/editor` | `09-local-draft-banner.png` |
| 10 | Projects populated | Sign in → save project → `/projects` with ≥1 row | `10-projects-populated.png` |
| 11 | Cloud Save badge | Firebase env on Vercel → editor toolbar shows **Firebase Cloud Save** | `11-cloud-save-badge.png` |
| 12 | Pricing | `/pricing` full page | `12-pricing-tiers.png` |

## Quality checklist

- Obsidian/gold marketing pages — no white flash on load
- Auth shows disabled Google/Apple **Coming soon**
- Editor cream canvas + black tool rail visible
- Save state badge readable (Local Draft / Cloud Saved)
- Export dialog shows format limitation footnote
- No placeholder “lorem” or fake CAD claims in frame

## Attach to evidence

After capture, update [FINAL_CLEANUP_EVIDENCE.md](./FINAL_CLEANUP_EVIDENCE.md):

```markdown
## Screenshot pack

- [x] Automated pack: `docs/release/evidence/screenshots/` (date)
- [ ] Manual items 8–12 (operator)
```
