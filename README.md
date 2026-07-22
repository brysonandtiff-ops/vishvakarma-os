# Vishvakarma-os Workspace

This folder wraps the Vishvakarma.OS application. **All development, git operations, and documentation live in the subdirectory below.**

## Start here

```bash
cd vishvakarma-os-live
```

**Documentation hub:** [vishvakarma-os-live/docs/README.md](vishvakarma-os-live/docs/README.md)

**Valuation / due diligence:** [vishvakarma-os-live/docs/handoff/HANDOFF.md](vishvakarma-os-live/docs/handoff/HANDOFF.md)

**Quick dev start:**

```bash
cd vishvakarma-os-live
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

**Production:** https://vishvakarma-os.app  
**Vercel fallback:** https://vishvakarma-os.vercel.app

---

# ?? Visual Hardening Pack Builder v2

The visual audit system validates screenshots before release evidence is accepted.

## Purpose

- Detect auth redirects
- Detect 404 captures
- Reject splash/loading-only screenshots
- Produce deterministic visual evidence packs

## Usage

```powershell
pnpm run build
pnpm run preview

python visual-pack\scripts\build_visual_pack.py --discover
python visual-pack\scripts\build_visual_pack.py --login
python visual-pack\scripts\build_visual_pack.py --verify-auth
python visual-pack\scripts\build_visual_pack.py
