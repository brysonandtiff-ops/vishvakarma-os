# Vishvakarma.OS Documentation

**Product version:** v1.5.0  
**Index refreshed:** 2026-11-19 (authoritative entry points updated; historical files retain their own dates)  
**Active Cloudflare custom domain:** https://vishvakarmaos.app (www also active; retired hyphenated lookalike returns 404)  

Documentation hub for the original Vishvakarma.OS architectural design studio. Source features, real browser operation and production release have different evidence levels.

**Backend source:** Supabase Auth, Postgres/RLS and Storage; real sign-in, tenant isolation and save/reopen on the newest review are NOT independently verified. See [current architecture](./CURRENT_PRODUCTION_ARCHITECTURE.md).

All application code, migrations, documentation, and development commands live at the repository root.

## Current source/release authority

**BLOCKED at 19 November 2026:** consult [CURRENT_RELEASE_STATUS.md](./release/CURRENT_RELEASE_STATUS.md), the [read-only UI audit](./release/evidence/VISHVAKARMA_SIRE_RELEASE_AUDIT_2026-11-19.md), and the [owner vision acceptance](./design/OWNER_VISION_ACCEPTANCE.md). Exact Git and real immutable runtime evidence take precedence over historical documentation. The official visual logo and style remain locked by [BRAND_LOCK.md](./BRAND_LOCK.md).

## Start with current proof, not historical assumptions

- [Professional project overview](../README.md)
- [Audited source-of-truth matrix](./repository/SOURCE_OF_TRUTH_20261119.md)
- [Current release BLOCKED decision](./release/CURRENT_RELEASE_STATUS.md)
- [November source and browser evidence](./release/evidence/REVIEW_VERIFICATION_LEDGER_20261119.md)
- [Remaining documentation debt](./repository/DOCUMENTATION_DEBT_20261119.md)
- [Evidence-writing standards](./DOCUMENTATION_STANDARDS.md)

**Caution:** The deeper handoff documents, generated appendices and older release reports may describe earlier source commits. Validate their dates and SHA before repeating them as current capabilities.

## Choose your path

### New developer

1. [developer/ONBOARDING.md](./developer/ONBOARDING.md) — setup and first change
2. [developer/ARCHITECTURE.md](./developer/ARCHITECTURE.md) — SPA, Supabase gateways, module graph
3. [developer/API.md](./developer/API.md) — persistence facade and serverless routes
4. [developer/TESTING.md](./developer/TESTING.md) — Vitest and Playwright
5. [developer/CI_CD.md](./developer/CI_CD.md) — local verification and deployment policy
6. [CONTRIBUTING.md](../CONTRIBUTING.md) — PR expectations

Deep dive: [handoff/03-architecture-and-data-flow.md](./handoff/03-architecture-and-data-flow.md)

### Operator / DevOps

1. [operations/README.md](./operations/README.md) — operations portal
2. [operations/DEPLOYMENT_RUNBOOK.md](./operations/DEPLOYMENT_RUNBOOK.md) — production deploy
3. [operations/INCIDENT_RESPONSE.md](./operations/INCIDENT_RESPONSE.md) — severity and escalation
4. [release/OPERATOR_CHECKLIST.md](./release/OPERATOR_CHECKLIST.md) — launch gates
5. [release/DEPLOYMENT.md](./release/DEPLOYMENT.md) — Cloudflare hosting and environment holds

### End user

1. [user/README.md](./user/README.md) — user portal index
2. [user/GETTING_STARTED.md](./user/GETTING_STARTED.md) — account, first project, editor tour
3. [user/WORKFLOWS.md](./user/WORKFLOWS.md) — common tasks
4. [user/TOOL_REFERENCE.md](./user/TOOL_REFERENCE.md) — editor tools
5. [user/BILLING_AND_PLANS.md](./user/BILLING_AND_PLANS.md) — plans and billing

### Due diligence / acquisition

1. [handoff/HANDOFF.md](./handoff/HANDOFF.md) — master index
2. [handoff/CHATGPT_HANDOFF.md](./handoff/CHATGPT_HANDOFF.md) — AI context
3. [SOFTWARE_INVENTORY.md](./SOFTWARE_INVENTORY.md) — technical inventory
4. [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md) — audited feature brief

Regenerate inventories with pnpm run handoff:generate only after actual source changes; inspect and verify the generated diff before relying on it.

### AI assistants

Start with [AGENTS.md](../AGENTS.md), then use the handoff documents and repository-root tooling. Do not enter or reference the retired `vishvakarma-os-live/` wrapper path.

## Current state references

| Document | Description |
|---|---|
| [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md) | Supabase production architecture |
| [SOFTWARE_INVENTORY.md](./SOFTWARE_INVENTORY.md) | Technical inventory |
| [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md) | Audited feature brief |
| [handoff/appendices/](./handoff/appendices/) | Generated routes, environment, schema, and test appendices |

## Specifications and governance

| Document | Description |
|---|---|
| [roadmap/WORLD_CLASS_PLAN.md](./roadmap/WORLD_CLASS_PLAN.md) | Long-range architecture plan |
| [specs/](./specs/) | Locked feature specifications |
| [GOVERNANCE_QUICKSTART.md](./GOVERNANCE_QUICKSTART.md) | Governance workflow |
| [project-manifest-schema.md](./project-manifest-schema.md) | Manifest JSON schema |
| [adr/README.md](./adr/README.md) | Architecture Decision Records |
| [rfc/README.md](./rfc/README.md) | Proposed features |

## Compliance and security

| Document | Description |
|---|---|
| [../SECURITY.md](../SECURITY.md) | Security policy |
| [compliance/PRIVACY.md](./compliance/PRIVACY.md) | Privacy overview |
| [compliance/DATA_PROCESSING.md](./compliance/DATA_PROCESSING.md) | Subprocessors |
| [compliance/SUPPORT_MATRIX.md](./compliance/SUPPORT_MATRIX.md) | Browser and version support |
| [PROPRIETARY_NOTICE.md](./PROPRIETARY_NOTICE.md) | IP and licensing posture |

## Release and evidence

| Document | Description |
|---|---|
| [release/DEPLOYMENT.md](./release/DEPLOYMENT.md) | Production deployment |
| [release/VERIFY_COMMANDS.md](./release/VERIFY_COMMANDS.md) | Verification command reference |
| [release/evidence/](./release/evidence/) | SHA-bound launch proof artifacts |
| [release/evidence/production-closeout-2026-07-16.md](./release/evidence/production-closeout-2026-07-16.md) | Historical July closeout; not current November release certification |
| [release/CURRENT_RELEASE_STATUS.md](./release/CURRENT_RELEASE_STATUS.md) | Current dated BLOCKED status and exact source identities |
| [release/evidence/VISHVAKARMA_SIRE_RELEASE_AUDIT_2026-11-19.md](./release/evidence/VISHVAKARMA_SIRE_RELEASE_AUDIT_2026-11-19.md) | S.I.R.E. public browser and repository audit |

## Maintenance

- Standards: [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)
- Verify docs: `pnpm run docs:verify`
- Verify handoff: `pnpm run handoff:verify`
