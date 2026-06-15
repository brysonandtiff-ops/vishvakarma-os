# Privacy Overview

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** user, operator, due-diligence  

High-level privacy practices for Vishvakarma.OS. This is an internal product document — not a published legal policy. Consult counsel before external publication.

---

## Data we collect

| Category | Examples | Purpose |
|----------|----------|---------|
| Account | Email, OAuth profile name | Authentication, billing |
| Project data | Floor plans, manifests, exports | Core product functionality |
| Billing | Stripe customer ID, plan tier | Subscription management |
| Usage (optional) | Page views with consent | Product improvement |
| Errors (optional) | Stack traces via Sentry | Reliability |

---

## Where data is stored

- **Supabase** — auth identity, Postgres project rows, storage uploads
- **Stripe** — payment method metadata, subscription state (not full card numbers)
- **Browser localStorage** — local draft recovery when cloud unavailable
- **Vercel** — static assets and serverless logs (no project manifest persistence)

Subprocessors: [DATA_PROCESSING.md](./DATA_PROCESSING.md)

---

## Data we do not sell

Vishvakarma.OS does not sell personal data to third parties.

---

## AI processing

When Gemini is enabled, natural language prompts and uploaded site documents may be sent to Google’s Generative AI API for parsing. Operators control this via `GEMINI_API_KEY` deployment. Local fallback parsers run when Gemini is unavailable.

---

## Analytics consent

Product analytics require explicit opt-in via the in-app consent banner. See `src/lib/analytics.ts`.

---

## Retention

- Project data retained until user deletes project or account (operator policy)
- Audit logs retained for governance compliance
- Stripe records per Stripe retention policy
- Serverless logs per Vercel retention settings

---

## User rights

Depending on jurisdiction, users may request access, correction, or deletion of account data. Operators should process requests via Supabase admin tools and Stripe customer deletion workflows.

---

## Decision-support disclaimer

Compliance, cost, and council outputs are generated for **decision-support only** — not regulatory certification or professional advice.

---

## Related

- [DATA_PROCESSING.md](./DATA_PROCESSING.md)
- [SECURITY.md](../../SECURITY.md)
- [handoff/06-security-and-compliance.md](../handoff/06-security-and-compliance.md)
