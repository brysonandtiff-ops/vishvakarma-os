# Vishvakarma.OS — Private iPad Trial Gate (19 Nov 2026)

**Trial link:** https://vishvakarmaos.app/auth?next=%2Fprojects

This URL uses the real active `vishvakarmaos.app` custom domain, not a temporary Pages preview, and requests the Projects workspace only after authentication. Do not claim that it is the newly deployed review design before branch promotion.

## What source work is now in review
- The existing official swan/V logo is unchanged and the original gift concept is stored privately with SHA-256 in Evidence Storage.
- Owner vision: Projects → 2D plan → 3D room → first-person walk → save and export.
- Mouse/keyboard WASD/arrow-key walking and touch-pad direction use shared camera-relative motion calculations.
- OAuth/email-link return destinations may include only `/editor`, `/editor-lite`, `/projects`, or `/3d-room`; untrusted or external destinations always fall back to `/editor`.
- The access-request button opens the iPad's Share sheet (or copies a request). It does **not** secretly register, invite or approve accounts. Email OTP remains `shouldCreateUser: false` by security design.

## Actual account/host status
- Supabase project `jyocvwipthswfcmvqgqe` metadata reports ACTIVE_HEALTHY, but direct database/advisor queries returned hibernation or connection timeouts during this inspection. No live signup, email delivery, authenticated save/load or MFA proof is available from these failures.
- Cloudflare Pages production and preview configurations have server-only Supabase bindings. The frontend currently has a versioned fallback for public URL/publishable key; these are not proof that provider redirect allowlists, actual invite delivery or backend isolation work in the live app.
- The reviewed private gift experience is on draft PR #210, stacked on the other unmerged repair branches; the source behind the active domain may differ.
- Issues #153 (security) and #188 (retained encrypted backup) remain release holds.

## Trial acceptance steps (actual iPad required)
1. Owner approves a real personal email/account via the existing Supabase administrative invitation route. Do not change public signup policy without a separate security decision.
2. Open the QR link in **Safari on the iPad**, not an embedded browser. Check the full account access page and tap sizes.
3. Finish a genuine Google or invited-email sign-in, then confirm it lands in Projects, without unexpected redirects.
4. Create/draw a 2D house, open its 3D model, use the touch movement pad, save, close Safari and reopen exactly the same house; test one permitted export.
5. Record real screenshot/video, device model/iPadOS, environment, deployed exact SHA, errors, test results, signed-in tenant isolation and owner approval.

**STOP / FAIL CLOSED:** If any provider, editor, storage or security gate fails, do not call this ready for a guest, bypass sign-in, provide fake proof, or promote production.
