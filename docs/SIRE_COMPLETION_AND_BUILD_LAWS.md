# Vishvakarma.OS — Completion Plan & Build Laws

This repository follows the S.I.R.E. canonical eight-step build laws:

**FIND → PLAN → BUILD → TEST → SHOW → HARDEN → PROVE → FINISH**

Canonical reference (external):  
[SIRE-CANONICAL_STEP_BUILDING_LAWS.md](https://github.com/brysonandtiff-ops/SIRE/blob/main/docs/engineering-laws/SIRE-CANONICAL_STEP_BUILDING_LAWS.md)

Local agent rules in `AGENTS.md` and RepairBot / auto-finish hooks remain binding. Read this file in **FIND** before mutating.

---

## Product (plain language)

**Vishvakarma.OS** is a browser-native architectural planning and 3D review workstation. Users draw blueprints (walls, openings), review plans, and work through governance/release surfaces with Supabase-backed auth and persistence. Production backend is **Supabase-only**.

---

## Completion north star

1. Editor draw / save / load / export paths stay proven on current HEAD with RepairBot and verify tiers.
2. Auth (Supabase + Google OAuth) remains correctly configured for each origin — no placeholder keys.
3. Remaining **PARTIAL** launch-evidence items upgraded to PASS with real-device / long-soak proof where required.
4. Release claims only after `repairbot:world` / release gates + owner phone acceptance.
5. Never invent **GREEN**; PARTIAL stays PARTIAL until evidence says otherwise.

---

## The eight steps (every change)

| Step | Name | What you do here |
| :---: | :--- | :--- |
| **1** | **FIND** | Exact HEAD SHA; dirty tree; AGENTS.md PARTIAL table; env/auth truth |
| **2** | **PLAN** | Smallest slice; match verify matrix to change type |
| **3** | **BUILD** | Feature branch (`cursor/*`); no parallel app trees; preserve editor shell layout |
| **4** | **TEST** | `pnpm run lint:types` minimum; `test` / `test:routes` / `build` / RepairBot tier as needed |
| **5** | **SHOW** | Deep-proof / screenshot evidence for editor or UI changes, SHA-bound |
| **6** | **HARDEN** | Auth gates, no secrets committed, Supabase redirect origins correct |
| **7** | **PROVE** | LAW-101 disclosure; do not over-claim PARTIAL evidence as PASS |
| **8** | **FINISH** | Ship on feature branch; report PASS / FAIL / BLOCKED / NOT RUN |

Merge to `main`, production deploy, and release seals stay **owner phone-gated**.

---

## Ordered next steps

1. Keep RepairBot healthy after substantive edits (`repairbot:fast` → `medium` before “feature done”).
2. Close PARTIAL evidence: collaboration preview (production co-edit), physical iPad Safari recordings, extended 30+ min soak.
3. Re-verify auth redirects whenever origins or Supabase dashboard URLs change (`auth:gates`, `test:supabase-auth`).
4. Run `verify:ci` / `repairbot:world` before pre-release claims (needs live Supabase env where required).
5. Owner phone / device acceptance for user-facing release.

---

## Honest blockers

From `AGENTS.md` — treat as **PARTIAL / BLOCKED** for production claims until upgraded:

- **RepairBot / verify tiers:** type or test failures block auto-ship; do not weaken gates to look green.
- **Auth / Supabase:** placeholder anon keys, wrong redirect origins, and stale `VITE_*` after env edits remain common foot-guns; production auth is Supabase-only.
- **PARTIAL evidence still open:**
  - Collaboration preview touch chrome — preview-only, not production co-editing
  - Physical iPad Safari screen recordings — automated viewport PASS ≠ real Home Screen + Pencil
  - Extended long-session soak (30+ min) — fast 60s soak is not the extended soak
- **3D viewport:** headless/GPU-less environments fall back honestly; that is not a 2D editor failure.

---

## Software-building AI autonomy

Authorised cloud agents may run **24/7** on feature branches through FIND→FINISH.

- Auto-ship hooks push to the **current** branch — keep work on `cursor/*`, not `main`, for routine agent edits.
- Merge, release, and deploy remain **phone-gated**.
- Never invent **GREEN**. `UNKNOWN` = fail-closed.
