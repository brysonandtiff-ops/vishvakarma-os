# Getting Started

## Prerequisites

- Node.js 20+
- pnpm 9.15.0

## Setup

```bash
cd vishvakarma-os-live
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Configure Firebase Auth and Firestore variables in `.env.local` (see `.env.example`).

## Development

```bash
pnpm run dev
```

Open `http://127.0.0.1:5173`.

For local preview without auth, set `VITE_ALLOW_LOCAL_DEMO=true` in development only.

## Verification

```bash
pnpm run verify:ci
pnpm run test:e2e
pnpm run production:evidence
```

## Production checklist

1. Configure Firebase email-link auth and authorized domains
2. Deploy Firestore security rules (`firebase deploy --only firestore:rules`)
3. Set Vercel Firebase environment variables (see `docs/release/VERCEL_ENV.md`)
4. Run `pnpm run production:verify-env --strict`
5. Attach evidence under `docs/release/evidence/`
