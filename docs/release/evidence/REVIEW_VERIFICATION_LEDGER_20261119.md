# Vishvakarma.OS — November 2026 Review Evidence

**Date:** 19 November 2026. Historical snapshot, not a new production certificate.

| Reference | Verified meaning |
| --- | --- |
| main@3bf5153c04f00a19fa12d2bb2551ea420a632363 | Older main |
| PR #208@9823f2c2f6515de4de49a44ba6f6d987f9bfb010 | Draft recovery/readiness |
| PR #209@2b0c94c9fb1be6f1077537959c2224f7bd083944 | Draft documentation source correction |
| PR #210@614256d64c502c8158c6867f69beacaf0ea8c0cb | Latest visually tested development code before this docs update |
| [Cloudflare preview](https://c8775cdc.vishvakarma-os.pages.dev/auth?next=%2Fprojects) | Same SHA, deployed SUCCESS, **50 selected files / 312 passing tests** |
| [Public routes](https://agent.tinyfish.ai/runs/ef6afee9-a86d-44a3-9a2a-5f5dd92f2cd3) | Public controls/navigation, not full private E2E |
| [Desktop/PWA](https://agent.tinyfish.ai/runs/7c4de896-fa79-48ab-806a-9a1015111b11) | No phone/iPad viewport or offline install testing |
| [Signed-out auth/404](https://agent.tinyfish.ai/runs/20c54209-cd91-4da6-9e66-65d3111e7d00) | No private data observed and 404 recovered; marketing links alone are not private PASS |
| [Sign-in baseline](https://agent.tinyfish.ai/runs/31d49872-dac3-4a8b-94a2-eead8a7067b7) | Clipping found |
| [Intermediate sign-in](https://agent.tinyfish.ai/runs/d3973286-4f31-4f58-bc6c-a9fe6b41690e) | Clipping still failed, documented |
| [Latest sign-in](https://agent.tinyfish.ai/runs/be85892a-f431-4632-9eb8-72fa3a654896) | 8/9 visual checks pass, legal links require scroll |

All TinyFish browser observations in this ledger were **signed out**. There was no authenticated save/reopen, real iPad capture or 3D house video, so no full software E2E pass is claimed.

See the [current release gate](../CURRENT_RELEASE_STATUS.md) and [source reality matrix](../../repository/SOURCE_OF_TRUTH_20261119.md). Security #153 and backup #188 remain OPEN.
