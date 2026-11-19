# Vishvakarma.OS — Current Release Status

**Reviewed:** 19 November 2026 UTC

**Package version:** 1.5.0

**Decision:** **BLOCKED — LOCAL CANDIDATE FREEZE ONLY**

**Local freeze ref:** `vishvakarma-studio-freeze-20261119` on `codex/vishvakarma-web-studio`

## Production and candidate identity

The active custom domain is [vishvakarmaos.app](https://vishvakarmaos.app/) on Cloudflare Pages. Cloudflare also lists www as active and both hyphenated hosts as deactivated.

| Git and build | Verified state |
| --- | --- |
| Cloudflare production | Deployment `3d003e50-e10c-417b-b25c-9e2b341012b0` succeeded on 5 August 2026 at source `5a1305928ca9435e577ea2e021935452f9289a02`. |
| Latest Cloudflare preview observed | Deployment `cc716a47-a827-4793-8634-9e4a2dc86d61` succeeded on 19 November 2026 at source `6c307063e5bf6cab84344f7f629c703c1e962e5b`. [Immutable preview](https://cc716a47.vishvakarma-os.pages.dev) |
| Browser-tested Studio source | `03e5fff1de7a9e5c78916a396e18e3cf5d7fbcaf` introduced the unified Projects and Studio workflow in the existing app. The freeze adds release validation and documentation. |

## Release evidence

- **Public origin.** A fresh request returned `ok: true` from `/api/health`. The service-worker script was served, and the unknown API route returned 404. This runner's outbound proxy blocked the direct header and cache verifier.
- **Live browser.** Home and Features rendered on the apex, and www served the landing page. Signed-out `/editor` and `/projects` sent the browser to sign-in. Live sign-in displayed password and account-creation controls with no visible Google or email-link action. `/terms` and `/privacy` rendered the application's 404. [Browser receipt](https://agent.tinyfish.ai/runs/801d22c7-148e-468d-b741-49d0745e5395)
- **Studio source.** Desktop Chromium drew a wall, rendered it in 3D, walked at eye height, and saved, exported, and reopened the same geometry in browser-local mode. Phone Chromium emulation exercised touch drawing, Walk movement and the Details drawer. The sample-open workflow preserved a separate recovery draft.
- **Production identity.** The August build is still the production deployment. The Studio candidate has no immutable hosted deployment receipt.

Earlier preview and browser receipts remain in the [November evidence ledger](./evidence/REVIEW_VERIFICATION_LEDGER_20261119.md).

## Mandatory release holds

1. **[Security issue #153](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/153) is open.** Verified credential rotation and incident closeout remain outstanding. Preserve a recoverable backup before considering any history rewrite.
2. **[Encrypted retained backup #188](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/188) is open.** Independent decrypt and restore evidence remains outstanding.
3. The August deployment has stale sign-in UI and unavailable Terms and Privacy pages. Verify the corrected routes, approved-account Google/email flows, administrator rights, tenant RLS and cloud persistence on the exact hosted candidate.
4. Physical iPad, Fold and iPhone operation, audio, PWA recovery and the signed-in Blueprint → 3D → Walk → Save → Reopen → Export round trip need verification.
5. Provider configuration, Stripe billing and professional regulatory accuracy remain separate acceptance items.
6. Production release requires an exact-source Cloudflare preview, independent QA and explicit owner sign-off.

Certification preflight verifies both GitHub holds. Keep the independent rotation and restore receipts with the frozen source and immutable Cloudflare deployment. See the [operator checklist](./OPERATOR_CHECKLIST.md), [source of truth](../repository/SOURCE_OF_TRUTH_20261119.md), and [visual lock](../BRAND_LOCK.md).
