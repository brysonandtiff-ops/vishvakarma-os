# Guinness World Records Application Checklist (Phase 2)

**Proposed category:** Most pre-release compliance gates enforced in browser-based architectural floor plan software.

**Current status:** Not submitted — complete Phase 1 self-verified bundle first.

## Pre-Submission Checklist

- [ ] Phase 1 evidence green (`pnpm run record:measure`, `docs/world-record/latest-measurement.json`)
- [ ] Competitor baseline completed ([`COMPETITOR_BASELINE.md`](COMPETITOR_BASELINE.md))
- [ ] Independent witness attestation signed ([`WITNESS_ATTESTATION.md`](WITNESS_ATTESTATION.md))
- [ ] Screen recording of measurement + `/world-records` UI
- [ ] Written rules document (metric definition from [`WORLD_RECORD_CLAIM.md`](WORLD_RECORD_CLAIM.md))

## Application Steps

1. Visit [Guinness World Records — Apply](https://www.guinnessworldrecords.com/applications).
2. Propose new category with exact metric wording from `WORLD_RECORD_CLAIM.md`.
3. Pre-agree rules with GWR adjudication team (what counts as a gate, product scope, witness requirements).
4. Schedule official attempt with adjudicator present.
5. Run on attempt day:

   ```bash
   pnpm run record:measure
   pnpm run release:gates:strict
   ```

6. Submit bundle: video, witness form, competitor baseline PDF, `latest-measurement.json`, commit SHA.

## On Approval

1. Save certificate to `public/records/gwr-certificate.pdf`.
2. Update `latest-measurement.json` status field to `guinness_verified` (manual registry update until automated).
3. Update [`EVIDENCE_MANIFEST.md`](../release/evidence/EVIDENCE_MANIFEST.md) with GWR reference.
4. `/world-records` will show **Guinness Verified** only when certificate asset returns HTTP 200.

## Estimated Timeline

- GWR review: 8–16 weeks after submission
- Application fee: per GWR pricing at time of application

## Honesty Rule

Do not use Guinness World Records logos or “Official World Record Holder” language in the product or marketing until a certificate is on file and status is `guinness_verified`.
