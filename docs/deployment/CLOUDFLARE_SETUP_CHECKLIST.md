# Cloudflare setup checklist

- [ ] Merge the Cloudflare migration pull request after all GitHub gates pass.
- [ ] Create a Cloudflare Pages project connected to `brysonandtiff-ops/vishvakarma-os`.
- [ ] Select production branch `main`.
- [ ] Set build command to `node scripts/vercel-build.mjs`.
- [ ] Set output directory to `dist`.
- [ ] Set Node.js to `22` and pnpm to `9.15.0`.
- [ ] Add public Vite build variables.
- [ ] Add Supabase, Stripe, and optional Gemini runtime secrets.
- [ ] Deploy and verify `https://vishvakarma-os.pages.dev`.
- [ ] Add Pages URLs to Supabase Auth redirects.
- [ ] Add a Stripe test webhook for the Pages URL.
- [ ] Pass health, auth, checkout, webhook, SPA, PWA, and cache smoke checks.
- [ ] Add `vishvakarma-os.app` as a Pages custom domain.
- [ ] Change DNS only after all previous checks pass.
- [ ] Re-run the smoke suite on the custom domain.
- [ ] Retain Vercel as rollback until production evidence is captured.
