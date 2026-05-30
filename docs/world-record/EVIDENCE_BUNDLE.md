# World Record Evidence Bundle

Reproduce Vishvakarma.OS world record proof on a clean checkout.

## Prerequisites

- Node.js ≥ 20
- pnpm 9.15.0
- Git (optional, for commit SHA in artifact)

## Steps

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Generate measurement artifact

```bash
pnpm run record:measure
```

Expected outputs:

| File | Purpose |
|---|---|
| `docs/world-record/latest-measurement.json` | Canonical evidence for manifests and release gates |
| `public/world-record/latest-measurement.json` | Runtime fetch for `/world-records` UI |

Verify fields:

- `metricGateCount` = **12**
- `gateCount` = **13**
- `gateNames` length matches manifest
- `evidenceHash` present (SHA-256 of measurement payload)

### 3. Run release gates (non-strict)

```bash
pnpm run release:gates
```

Captures gate summary embedded in measurement when step 2 runs.

### 4. Run release gates (strict, optional)

```bash
pnpm run release:gates:strict
```

Requires green unit tests and E2E locally.

### 5. View in product

```bash
pnpm run dev
```

Open `/world-records` after sign-in (or local demo mode).

### 6. Verify gate manifest alignment

```bash
node -e "const m=require('./src/governance/gates/gate-manifest.json'); console.log(m.gates.length)"
```

Expected: **13**

## Third-Party Verification Checklist

- [ ] Witness present for measurement run
- [ ] `latest-measurement.json` hash matches printed `evidenceHash`
- [ ] Gate names match [`gate-manifest.json`](../../src/governance/gates/gate-manifest.json)
- [ ] Competitor baseline reviewed ([`COMPETITOR_BASELINE.md`](COMPETITOR_BASELINE.md))
- [ ] Witness form signed ([`WITNESS_ATTESTATION.md`](WITNESS_ATTESTATION.md))

## Honesty Reminder

Do not describe this bundle as a Guinness World Records certificate. Status remains **Self-Verified Candidate** until GWR adjudication completes.
