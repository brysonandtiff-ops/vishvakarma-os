# Save / Load Determinism Proof — historical API-only record

Generated from commit: `0659de80c2f4dd6f9a140583052b3301cdc5cfcb`
Original test recorded at: 2026-06-20T05:15:11.614Z
Original operator: automated api roundtrip
Result: `PARTIAL`

## Evidence correction

The original machine-readable receipt at
`docs/release/evidence/save-load-proof-run.json` records `mode: "api-roundtrip"`.
It contains database service-role insert/read/update/delete checks; it does **not**
record a real user signing in to the website, saving and reopening a project, or
downloading and importing JSON in a browser.

**Do not interpret the historical database PASS as browser, RLS, physical-device,
or production release certification.** The originally claimed browser steps and
console-error clearance were not demonstrated by this receipt. The original
record remains recoverable in Git history; it has not been rewritten.

## Compare wall/opening counts

Historical sample: 4 walls and 3 openings. Counts were checked in an API
roundtrip, not an authenticated browser. Full canonical manifest equality and
real user-facing import/export acceptance remain unverified.

## Required next evidence

- An approved user's genuine browser session, on a deployed exact SHA.
- Create → load sample → save to cloud → reload → reopen → export → import.
- Successful cloud-save state, original and imported geometry counts, actual
  browser download and zero unaddressed runtime errors.
- Separate user-isolation, physical-device, credential remediation, recovery,
  independent approval and production deployment equality checks.

**Current gate 9: MANUAL / NOT CERTIFIED.**
