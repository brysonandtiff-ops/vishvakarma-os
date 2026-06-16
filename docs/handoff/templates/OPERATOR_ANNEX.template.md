# Operator Annex — Vishvakarma.OS

**Template only — do not commit filled values to git.**

Copy this file to `docs/handoff/OPERATOR_ANNEX.md` (gitignored), complete all fields, and deliver via secure channel (password manager, encrypted data room, or signed transfer document).

---

## Document metadata

| Field | Value |
|-------|-------|
| Product | Vishvakarma.OS |
| Version | 1.5.0 |
| Production URL | https://vishvakarma-os.app |
| Vercel fallback URL | https://vishvakarma-os.vercel.app |
| Completed by | |
| Date | |
| Recipient | |

---

## Account ownership registry

### GitHub

| Field | Value |
|-------|-------|
| Organization / owner | |
| Repository | brysonandtiff-ops/vishvakarma-os |
| Admin contact email | |
| 2FA status | |
| Billing account | |

### Vercel

| Field | Value |
|-------|-------|
| Team / account | |
| Project name | |
| Production domain(s) | |
| Admin contact email | |
| Deployment protection enabled | Yes / No |

### Supabase

| Field | Value |
|-------|-------|
| Organization | |
| Project name | |
| Project ref | jyocvwipthswfcmvqgqe |
| Region | |
| Admin contact email | |
| Service role key location | Vercel env: `SUPABASE_SERVICE_ROLE_KEY` |
| Anon key location | Vercel env: `VITE_SUPABASE_ANON_KEY` |

### Stripe

| Field | Value |
|-------|-------|
| Account ID | |
| Mode | Test / Live |
| Admin contact email | |
| Webhook endpoint | https://vishvakarma-os.app/api/stripe/webhook |
| Webhook secret location | Vercel env: `STRIPE_WEBHOOK_SECRET` |
| Studio price ID location | Vercel env: `STRIPE_PRICE_STUDIO_MONTHLY` |
| Enterprise price ID location | Vercel env: `STRIPE_PRICE_ENTERPRISE_MONTHLY` |

### Google Cloud (OAuth + Gemini)

| Field | Value |
|-------|-------|
| GCP project ID | |
| OAuth client ID location | Supabase Auth dashboard / `SUPABASE_AUTH_GOOGLE_CLIENT_ID` |
| Gemini API key location | Vercel env: `GEMINI_API_KEY` |
| Admin contact email | |

### Domain / DNS (if applicable)

| Field | Value |
|-------|-------|
| Registrar | |
| DNS provider | |
| Custom domain | |
| SSL provider | Vercel (default) |

### Firebase (legacy — if still accessible)

| Field | Value |
|-------|-------|
| Project ID | gen-lang-client-0690161780 (referenced in legacy scripts) |
| Purpose | Migration history only — not production runtime |
| Service account location | Operator secure storage only |

---

## Co-owner and admin contacts

| Role | Email | Supabase profile ID | Notes |
|------|-------|---------------------|-------|
| Primary operator | | | |
| Co-owner (code allowlist) | | | See `src/config/coOwners.ts` |
| Admin (profiles.role) | | | |

---

## Key rotation procedure (post-transfer)

1. Rotate `SUPABASE_SERVICE_ROLE_KEY` in Supabase dashboard → update Vercel
2. Rotate Stripe webhook secret → update Stripe dashboard + Vercel
3. Rotate `GEMINI_API_KEY` in Google Cloud → update Vercel
4. Review Google OAuth authorized redirect URIs in Supabase Auth
5. Update co-owner allowlist in `src/config/coOwners.ts` if needed → deploy
6. Run verification:
   ```bash
   pnpm run production:verify-env --strict
   pnpm run verify:supabase-schema:live
   pnpm run verify:stripe-billing
   pnpm run verify:production-auth-flow
   ```

---

## Emergency contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Technical lead | | | |
| Billing / finance | | | |
| Legal | | | |

---

## Transfer attestation

- [ ] All third-party accounts identified above have been transferred or access granted to recipient
- [ ] All production secrets rotated post-transfer
- [ ] Operator annex delivered via secure channel and destroyed from sender's insecure copies
- [ ] `pnpm run handoff:verify` passes on transferred repository
- [ ] Production smoke test completed on https://vishvakarma-os.app
