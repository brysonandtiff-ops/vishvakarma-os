# Vishvakarma.OS — Current Release Status

**Reviewed:** 19 November 2026 · Australia/Perth  
**Package version:** 1.5.0  
**Decision:** **BLOCKED — NOT RELEASE-CERTIFIED**

## Real hosting and review chain

The active public custom domain is [vishvakarmaos.app](https://vishvakarmaos.app/) on Cloudflare Pages. The similarly named hyphenated .app domain is retired/deactivated. Public reachability is not proof of newest source in production.

| Git and build | Verified state |
| --- | --- |
| main | SHA 3bf5153c04f00a19fa12d2bb2551ea420a632363: older than November review |
| [PR #208](https://github.com/brysonandtiff-ops/vishvakarma-os/pull/208) | Open draft, head 9823f2c2f6515de4de49a44ba6f6d987f9bfb010 |
| [PR #209](https://github.com/brysonandtiff-ops/vishvakarma-os/pull/209) | Open draft, head 2b0c94c9fb1be6f1077537959c2224f7bd083944 |
| [PR #210](https://github.com/brysonandtiff-ops/vishvakarma-os/pull/210) | Open draft, last visually tested code parent 614256d64c502c8158c6867f69beacaf0ea8c0cb; subsequent documentation commits require their own fresh build receipt |
| [Cloudflare preview](https://c8775cdc.vishvakarma-os.pages.dev/auth?next=%2Fprojects) | SUCCESS at SHA 614256d..., 50 selected files and **312/312** selected tests passed |

## What the browser really checked

Signed-out TinyFish inspected public Home, Features, Pricing, Terms, Privacy, theme changes, readable voice-tour captions, session gates, 404 recovery and the sign-in UI. The final sign-in review passed **8 of 9** visual checks; policy links still require scrolling.

Evidence: [functional](https://agent.tinyfish.ai/runs/ef6afee9-a86d-44a3-9a2a-5f5dd92f2cd3), [desktop/PWA](https://agent.tinyfish.ai/runs/7c4de896-fa79-48ab-806a-9a1015111b11), [access and 404](https://agent.tinyfish.ai/runs/20c54209-cd91-4da6-9e66-65d3111e7d00), [sign-in review](https://agent.tinyfish.ai/runs/be85892a-f431-4632-9eb8-72fa3a654896).

Those were **not authenticated** drawing or save/reopen tests, not physical iPad tests, and not independent verification of external service permissions.

## Mandatory release holds

1. **[Security issue #153](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/153): OPEN.** Credential rotation/history scan and security closeout pending; no unsafe history purge.
2. **[Encrypted retained backup #188](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/188): OPEN.** Independently recoverable tested backup not yet proven.
3. Approved account registration/sign-in, Google/email redirects, admin/tenant RLS and real cloud persistence remain **unverified**. A draft SQL migration is not an active administrator role.
4. Real iPad/Fold/iPhone operation, audio, screenshots, video and true 2D → 3D → Walk → Save → Reopen → Export round-trip have not been verified.
5. Provider configuration, Stripe billing, professional regulatory accuracy and PWA offline recovery need real proof and separate approval for any cost.
6. Production release requires the exact approved source SHA, independent QA and explicit owner sign-off.

No paid actions, credentials, DNS, live data, production deployments or merges are authorised by this documentation update.

Read [source of truth](../repository/SOURCE_OF_TRUTH_20261119.md), [November evidence](./evidence/REVIEW_VERIFICATION_LEDGER_20261119.md), [visual lock](../BRAND_LOCK.md) and [owner acceptance](../design/OWNER_VISION_ACCEPTANCE.md).

Historic reports of “PRODUCTION READY” or Guinness record status do not override this current HOLD.
