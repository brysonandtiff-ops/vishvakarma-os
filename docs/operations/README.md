# Operations Portal

**Product version:** v1.5.0  
**Portal reviewed:** 2026-11-19 (older runbooks need provider-specific verification)  
**Audience:** operator  

Runbooks for Vishvakarma.OS. **Cloudflare Pages is the active host, not the historical Vercel setup.** Check [current architecture](../CURRENT_PRODUCTION_ARCHITECTURE.md) and [release HOLD](../release/CURRENT_RELEASE_STATUS.md) before live actions.

**Due diligence depth:** [handoff/HANDOFF.md](../handoff/HANDOFF.md) (annexes 07–09)

---

## Runbooks

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) | Production deploy flow |
| [ROLLBACK.md](./ROLLBACK.md) | Cloudflare Pages rollback and data recovery |
| [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) | Severity levels and escalation |
| [MONITORING.md](./MONITORING.md) | Dashboards and alerts |
| [ACCOUNT_TRANSFER.md](./ACCOUNT_TRANSFER.md) | Operator handover and key rotation |
| [ENVIRONMENT_MATRIX.md](./ENVIRONMENT_MATRIX.md) | Local / preview / production env |

---

## Release authority

| Document | Purpose |
|----------|---------|
| [release/OPERATOR_CHECKLIST.md](../release/OPERATOR_CHECKLIST.md) | Launch gates 9–12 (authority) |
| [release/DEPLOYMENT.md](../release/DEPLOYMENT.md) | Full deployment guide |
| [release/VERIFY_COMMANDS.md](../release/VERIFY_COMMANDS.md) | Verification cheat sheet |
| [ENVIRONMENT_MATRIX.md](./ENVIRONMENT_MATRIX.md) | Complete env var matrix |
| [release/STRIPE_SETUP.md](../release/STRIPE_SETUP.md) | Stripe products and webhooks |
| [release/SUPABASE_AUTH_SETUP.md](../release/SUPABASE_AUTH_SETUP.md) | Supabase auth providers |

---

## Auto-generated inventories

Regenerate after infrastructure changes:

```bash
pnpm run handoff:generate
pnpm run handoff:verify
pnpm run docs:verify
```

- [appendices/B-environment-variables.md](../handoff/appendices/B-environment-variables.md)
- [appendices/D-database-schema.md](../handoff/appendices/D-database-schema.md)

---

## Secrets (off-repo)

Never commit filled credentials. Use [handoff/templates/OPERATOR_ANNEX.template.md](../handoff/templates/OPERATOR_ANNEX.template.md) → `docs/handoff/OPERATOR_ANNEX.md` (gitignored).
