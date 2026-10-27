# S.I.R.E. LAW 105 Ω — Historical credential recovery: stop-ship precheck

**Status:** BLOCKED — planning/evidence only. **No history rewrite, no ref update, no force-push, no production deployment, no credential rotation authorised by this document.**

## STEP — GOAL
Safely resolve GitHub security incident [#153](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/153) without erasing the evidence needed for incident investigation or breaking outstanding pull requests.

## PLAN
1. **Provider-side containment:** An authorised owner privately identifies which detected credentials are genuine or still valid. Confirm independent revocation/rotation in affected provider consoles (Supabase, Stripe, Google, session/private keys). Never paste tokens, hashes, secret-bearing files or diagnostic excerpts into issues or CI logs.
2. **Protected retained backup:** After credential containment, the owner creates and independently verifies an **encrypted, access-controlled, offsite Git mirror and full ref inventory**, with restore and delete procedures. A disposable GitHub Actions bundle is **not** this backup.
3. **Controlled remediation review:** Agree a precise allowlist of historical paths and content replacements; quantify PR, tag, branch, fork and CI artifact impact. Obtain independent security approval before any destructive work.
4. **Isolated simulation only after approval:** Rehearse on a disposable, non-pushable mirror. Verify refs, tree hashes, surviving application content, Git integrity, remaining Gitleaks findings and application tests. Never upload the mirror, bundle, raw token matches or altered history.
5. **Owner-controlled promotion only after every gate passes:** Coordinate freeze and re-clone requirements for contributors; apply exact reviewed changes under established branch protection and release controls. Any rewrite changes commit IDs and does not revoke credentials or erase copies held outside this repository.

## CHECK — Verified evidence, 27 October 2026
- [GitHub history scan #40439097612](https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/40439097612): **25 potential historical secret matches across 6 commits**. These are scanner detections, not confirmation of current key validity.
- [Current-source comparison #40441146671](https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/40441146671): 2 current generic-key detections inherited from `main`, both with mock-style markers; independent credential validity remains **UNKNOWN**.
- [Recovery preflight #40441857743](https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/40441857743): **443 refs, 2,375 reachable commits**, disposable **722,567,809-byte bundle**, matching restored ref tips/commits, successful `git fsck`. All temporary copies deleted. **1,078/1,078 unit tests and security checks passed**.
- [Draft PR #187](https://github.com/brysonandtiff-ops/vishvakarma-os/pull/187): isolated recovery-preflight implementation is unmerged and has **no submitted independent review**.
- GitHub `main` was **not protected by enforced branch rules** at last inspection; see [#177](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/177).
- Provider recovery [#137](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/137): connected Vishvakarma.OS Supabase project remained **INACTIVE** during previous read-only check. No authenticated cloud save proof.

## UPGRADE
Use two independent reviewers: one for incident/provider credential remediation, another for Git history/recovery integrity and release provenance. Their reviewed approvals must be attributable to eligible accounts, not a self-approval.

## FIX — Acceptance gates, all mandatory
- [ ] Provider key inventory privately classified; every real compromised active key revoked/rotated with evidence (without exposing values).
- [ ] Both current-source detections resolved or independently established to be synthetic test fixtures.
- [ ] A **retained** encrypted backup exists under owner custody; offline restore and full ref-tip comparison independently verified.
- [ ] Current and historical secret scanning pass on the remediated candidate; residual third-party caches, forks and external exposures assessed.
- [ ] Scope and mapping for all altered refs, tags and open PRs reviewed; contributor re-clone plan accepted.
- [ ] Full exact-SHA unit, type, security, E2E, RLS and authenticated cloud-runtime acceptance passes after remediation.
- [ ] Branch protection [#177] enforced, reviewer approval recorded, release SHA and signed evidence receipt independently confirmed.

## WHAT YOU BUILD
A verified, recoverable, independently approved security-remediation release candidate. **This file does not create one.**

## FILES
This guidance document only. No secret-bearing files, backup archives, rewritten history, or new executable CI workflow are included.

## VERIFY
Use existing GitHub evidence links above. A successful disposable backup exercise proves backup tooling behaviour, **not** that an encrypted retained offsite backup is present. No rehearsal or promotion of rewritten history is claimed in this document.

## STOP
**STOP-SHIP** on missing provider rotation, encrypted retained backup, complete ref mapping, isolated rehearsal proof, independently approved protection, or live user/runtime tests.

## RISKS
Public Git history is copied outside the repository; history rewrites cannot unpublish cached tokens. Large generated-file history and open PR refs create a high risk of broken references. Do not print, download or upload raw scanner reports into public artifacts.

## ROLLBACK
Do **not** proceed to a push without a separately tested recovery plan using the owner-controlled encrypted backup. A rewritten history cannot be safely rolled back by an unspecified generic command.

## EVIDENCE
Only redacted counter summaries and independently verified SHA/run identifiers may be shared publicly. Historical credential status, backup retention and production release readiness remain **UNKNOWN/BLOCKED** until evidenced.
