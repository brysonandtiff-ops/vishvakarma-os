# API Reference

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** developer  

Vishvakarma.OS uses a **Supabase-backed persistence facade** on the client and **Vercel serverless functions** for billing and AI. UI and editor code should call `src/db/api.ts` for persistence — not Supabase clients directly.

Live route inventory: [handoff/appendices/A-routes-and-api.md](../handoff/appendices/A-routes-and-api.md)

When Supabase env vars are missing, read operations return empty arrays and write operations throw with a configuration error. Optimization batches fall back to `localStorage`.

---

## Client persistence API — `src/db/api.ts`

All functions require a configured Supabase backend for writes unless noted.

### Projects

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getProjects()` | — | `Promise<Project[]>` | List projects for the signed-in user |
| `getProject(id)` | `id: string` | `Promise<Project \| null>` | Fetch a single project |
| `createProject(name, description, manifest)` | name, optional description, `ProjectManifest` | `Promise<Project>` | Create project + audit log |
| `updateProject(id, updates)` | id, partial `{ name, description, manifest }` | `Promise<Project>` | Update metadata/manifest + audit log |
| `deleteProject(id)` | `id: string` | `Promise<void>` | Delete project + audit log |

### Optimization batches

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `saveOptimizationBatch(batch)` | `OptimizationBatch` | `Promise<OptimizationBatchRecord>` | Persist batch summary (Supabase or localStorage) |
| `getOptimizationBatches(limit?)` | limit default 20 | `Promise<OptimizationBatchRecord[]>` | Recent optimization runs |
| `linkOptimizationBatchToProject(batchId, projectId, details?)` | batch id, project id, optional metadata | `Promise<OptimizationBatchRecord \| null>` | Link winner to project + audit log |

### Governance — specs, registry, change requests, releases, audit

| Domain | Read | Write |
|--------|------|-------|
| Specs | `getSpecs()`, `getSpecsByCategory(category)` | `createSpec()`, `updateSpec()` |
| Registry | `getRegistryEntries()`, `getRegistryByType(type)` | `createRegistryEntry()` |
| Change requests | `getChangeRequests()`, `getChangeRequestsByStatus(status)` | `createChangeRequest()`, `updateChangeRequest()` |
| Releases | `getReleases()`, `getRelease(id)` | `createRelease()`, `updateRelease()` |
| Audit | `getAuditLogs(limit?)`, `getAuditLogsByEntity(type, id)` | `createAuditLog()` (internal) |
| Routes | `getRouteManifest()` | — |

Implementation: `src/backend/supabase/supabaseGovernanceGateway.ts`, `supabaseProjectGateway.ts`, `supabaseOptimizationGateway.ts`.

---

## Serverless API — `api/`

All authenticated routes verify the Supabase JWT via `api/_lib/verifySupabaseToken.ts` or `verifyAuthToken.ts`.

### AI routes

#### `POST /api/ai/extract-requirements`

Extract structured building requirements from natural language.

**Auth:** None (public; rate-limit at edge in production recommended)

**Request body:**

```json
{
  "prompt": "3 bedroom house with north-facing living room",
  "parcelOverride": {}
}
```

**Response (200):**

```json
{
  "request": { /* BuildingRequest schema */ },
  "source": "gemini" | "fallback"
}
```

Uses `GEMINI_API_KEY` when set; falls back to local parser when Gemini is unavailable.

**Handler:** `api/ai/extract-requirements.ts`

#### `POST /api/ai/parse-site-documents`

Parse uploaded site documents (plans, surveys) into structured data.

**Auth:** Bearer Supabase JWT

**Request body:** Document payload (see handler for current schema)

**Handler:** `api/ai/parse-site-documents.ts`

### Stripe routes

#### `POST /api/stripe/create-checkout-session`

Create a Stripe Checkout session for Studio or Enterprise subscription.

**Auth:** Bearer Supabase JWT (401 if missing)

**Request body:**

```json
{
  "plan": "studio" | "enterprise",
  "origin": "https://vishvakarma-os.app"
}
```

**Response (200):**

```json
{ "url": "https://checkout.stripe.com/..." }
```

Studio plans include a 14-day trial (`STUDIO_TRIAL_DAYS`).

**Handler:** `api/stripe/create-checkout-session.ts`

#### `POST /api/stripe/create-portal-session`

Create a Stripe Customer Portal session for billing management.

**Auth:** Bearer Supabase JWT

**Response (200):**

```json
{ "url": "https://billing.stripe.com/..." }
```

**Handler:** `api/stripe/create-portal-session.ts`

#### `POST /api/stripe/webhook`

Stripe webhook endpoint. Requires raw body and `STRIPE_WEBHOOK_SECRET`.

**Events handled:** subscription lifecycle, invoice payment — updates billing entitlements in Supabase via `api/_lib/billingSupabase.ts`.

**Handler:** `api/stripe/webhook.ts`

---

## Shared API libraries

| File | Purpose |
|------|---------|
| `api/_lib/verifySupabaseToken.ts` | JWT verification |
| `api/_lib/verifyAuthToken.ts` | Auth token resolution |
| `api/_lib/stripeClient.ts` | Stripe client and price IDs |
| `api/_lib/billingBackend.ts` | Billing record abstraction |
| `api/_lib/billingSupabase.ts` | Supabase billing persistence |
| `api/_lib/stripeInvoice.ts` | Invoice helpers |

---

## OpenAPI

Machine-readable stub: [openapi.yaml](./openapi.yaml)

---

## Related

- [DATA_MODEL.md](./DATA_MODEL.md) — Postgres tables and manifest schema
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system overview
- [handoff/appendices/B-environment-variables.md](../handoff/appendices/B-environment-variables.md) — env vars
