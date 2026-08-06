# Vishvakarma.OS

The Vishvakarma.OS application. All development, git operations, and documentation live in this directory.

**Documentation hub:** [docs/README.md](docs/README.md)

**Valuation / due diligence:** [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)

**Quick dev start:**

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

**Production:** https://vishvakarma-os.app
**Vercel fallback:** https://vishvakarma-os.vercel.app

---

# Visual Hardening Pack Builder v2

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
```
