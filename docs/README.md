# Vishvakarma.OS Documentation

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Production URL:** https://vishvakarma-os.app  

Central documentation hub for Vishvakarma.OS — an iPad-first, browser-native architectural workstation with governance, billing, and AI-assisted design tools.

**Current production backend:** Supabase (Auth, Postgres/RLS, Storage). See [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md).

---

## Choose your path

### New developer

Get running locally and understand the codebase in under 30 minutes.

1. [developer/ONBOARDING.md](./developer/ONBOARDING.md) — day-1 setup and first PR
2. [developer/ARCHITECTURE.md](./developer/ARCHITECTURE.md) — SPA, Supabase gateways, module graph
3. [developer/API.md](./developer/API.md) — persistence facade and serverless routes
4. [developer/TESTING.md](./developer/TESTING.md) — Vitest and Playwright
5. [developer/CI_CD.md](./developer/CI_CD.md) — CI workflows and verify commands
6. [CONTRIBUTING.md](../CONTRIBUTING.md) — PR expectations

Deep dive: [handoff/03-architecture-and-data-flow.md](./handoff/03-architecture-and-data-flow.md)

### Operator / DevOps

Deploy, monitor, and respond to incidents.

1. [operations/README.md](./operations/README.md) — operations portal
2. [operations/DEPLOYMENT_RUNBOOK.md](./operations/DEPLOYMENT_RUNBOOK.md) — production deploy
3. [operations/INCIDENT_RESPONSE.md](./operations/INCIDENT_RESPONSE.md) — severity and escalation
4. [release/OPERATOR_CHECKLIST.md](./release/OPERATOR_CHECKLIST.md) — launch gates (authority)
5. [release/VERCEL_ENV.md](./release/VERCEL_ENV.md) — environment matrix

Due diligence: [handoff/HANDOFF.md](./handoff/HANDOFF.md)

### End user

Product help for architects and designers using the app.

1. [user/README.md](./user/README.md) — user portal index
2. [user/GETTING_STARTED.md](./user/GETTING_STARTED.md) — account, first project, editor tour
3. [user/WORKFLOWS.md](./user/WORKFLOWS.md) — common tasks
4. [user/TOOL_REFERENCE.md](./user/TOOL_REFERENCE.md) — editor tools
5. [user/BILLING_AND_PLANS.md](./user/BILLING_AND_PLANS.md) — Starter, Studio, Enterprise

### Due diligence / acquisition

Valuation handoff pack with auto-generated appendices.

1. [handoff/HANDOFF.md](./handoff/HANDOFF.md) — master index (annexes 01–10)
2. [handoff/CHATGPT_HANDOFF.md](./handoff/CHATGPT_HANDOFF.md) — paste-ready AI context
3. [SOFTWARE_INVENTORY.md](./SOFTWARE_INVENTORY.md) — technical inventory
4. [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md) — audited feature brief

Regenerate inventories: `pnpm run handoff:generate`

### AI assistants (Cursor, ChatGPT, Codex)

Onboarding for coding agents working in this repo.

1. [handoff/CHATGPT_HANDOFF.md](./handoff/CHATGPT_HANDOFF.md) — paste-ready product and codebase context (start here)
2. [handoff/HANDOFF.md](./handoff/HANDOFF.md) — valuation handoff index, truth hierarchy, annexes
3. [.cursor/rules/](../.cursor/rules/) — Cursor agent rules (RepairBot, verify expectations)
4. [.agents/skills/](../.agents/skills/) — vendored Supabase agent skills

Work only inside `vishvakarma-os-live/`. See [AGENTS.md](../AGENTS.md) for the full agent onboarding brief.

---

## Current state references

| Document | Description |
|----------|-------------|
| [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md) | Supabase production addendum |
| [SOFTWARE_INVENTORY.md](./SOFTWARE_INVENTORY.md) | Technical inventory |
| [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md) | Audited feature brief |
| [handoff/appendices/](./handoff/appendices/) | Auto-generated routes, env, schema, tests |

---

## Specifications and governance

| Document | Description |
|----------|-------------|
| [roadmap/WORLD_CLASS_PLAN.md](./roadmap/WORLD_CLASS_PLAN.md) | World-class architecture master plan (36-month roadmap) |
| [specs/](./specs/) | Locked feature specifications |
| [GOVERNANCE_QUICKSTART.md](./GOVERNANCE_QUICKSTART.md) | Governance workflow |
| [project-manifest-schema.md](./project-manifest-schema.md) | Manifest JSON schema |
| [adr/README.md](./adr/README.md) | Architecture Decision Records |
| [rfc/README.md](./rfc/README.md) | Proposed features (pre-implementation) |

---

## Compliance and security

| Document | Description |
|----------|-------------|
| [../SECURITY.md](../SECURITY.md) | Security policy |
| [compliance/PRIVACY.md](./compliance/PRIVACY.md) | Privacy overview |
| [compliance/DATA_PROCESSING.md](./compliance/DATA_PROCESSING.md) | Subprocessors |
| [compliance/SUPPORT_MATRIX.md](./compliance/SUPPORT_MATRIX.md) | Browser and version support |
| [PROPRIETARY_NOTICE.md](./PROPRIETARY_NOTICE.md) | IP and licensing posture |

---

## Release and evidence

| Document | Description |
|----------|-------------|
| [release/DEPLOYMENT.md](./release/DEPLOYMENT.md) | Production deployment |
| [release/VERIFY_COMMANDS.md](./release/VERIFY_COMMANDS.md) | Verification cheat sheet |
| [release/evidence/](./release/evidence/) | Launch proof artifacts |

---

## Archive

Historical build snapshots and v1.0-era docs: [archive/README.md](./archive/README.md)

Historical governance docs (v1.0 scope): [SPEC.md](./SPEC.md), [REGISTRY.md](./REGISTRY.md), [prd.md](./prd.md)

---

## Maintenance

- Standards: [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)
- Verify docs: `pnpm run docs:verify`
- Verify handoff: `pnpm run handoff:verify`
