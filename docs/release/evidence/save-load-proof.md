# Save / Load Determinism Proof

Generated from commit: `<sha>`  
Deployment URL: `<url>`  
Generated at: `<timestamp>`  
Operator: `<name>`  
Result: `PASS / FAIL / PARTIAL`

## Purpose

Prove Vishvakarma.OS can preserve a project through save, reload, export, and import without changing the project model.

## Preconditions

- Supabase URL and anon key configured, or local-only mode explicitly selected.
- Browser cache state recorded.
- Sample project available.
- Current commit SHA recorded.

## Test Steps

| Step | Action | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 1 | Open `/` | Editor loads without crash |  | Pending |
| 2 | Load sample project | Walls/openings/materials render |  | Pending |
| 3 | Save project | Save action completes with success state |  | Pending |
| 4 | Hard refresh page | Project remains recoverable |  | Pending |
| 5 | Export project JSON | JSON downloads and parses |  | Pending |
| 6 | Import exported JSON | Imported project matches saved state |  | Pending |
| 7 | Compare wall/opening counts | Counts match before and after import |  | Pending |

## Required Evidence

- Screenshot before save.
- Screenshot after reload.
- Exported JSON filename and checksum.
- Wall count before/after.
- Opening count before/after.
- Any console errors copied below.

## Console Errors

```txt
<none / paste errors>
```

## Verdict

```txt
PASS / FAIL / PARTIAL — explain why.
```
