# Apply Supabase Migrations (Operator)

Production Vercel env points at Supabase project **`amjlqwcauqeggrmkntlw`** (`https://amjlqwcauqeggrmkntlw.supabase.co`). Auth redirect on https://vishvakarma-os.vercel.app works with this project; schema migrations must be applied in the Supabase dashboard for that project.

## Why CLI/MCP could not apply (2026-05-31)

| Method | Result |
|--------|--------|
| `supabase link --project-ref amjlqwcauqeggrmkntlw` | Access denied — project not in logged-in org |
| Supabase MCP `list_migrations` / `apply_migration` | Permission denied for `amjlqwcauqeggrmkntlw` |
| Org project `jyocvwipthswfcmvqgqe` (Vishvakarma.OS) | Paused; restore blocked by free-tier active project limit |

Automated apply requires dashboard access to **`amjlqwcauqeggrmkntlw`** or migrating Vercel env to an org-owned project after restore.

## Apply via SQL Editor (recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **`amjlqwcauqeggrmkntlw`**.
2. **SQL Editor → New query**.
3. Run migrations **in order** (paste full file contents):

   | Order | File |
   |-------|------|
   | 1 | [`supabase/migrations/00001_create_core_tables.sql`](../../supabase/migrations/00001_create_core_tables.sql) |
   | 2 | [`supabase/migrations/20260521000100_auth_profiles_rls.sql`](../../supabase/migrations/20260521000100_auth_profiles_rls.sql) |

4. Confirm no errors; re-run if objects already exist (second migration uses `if not exists` / `drop policy if exists` where safe).

## Verify after apply

Follow [`SUPABASE_RLS_EVIDENCE.md`](SUPABASE_RLS_EVIDENCE.md) — run RLS queries and sign up once via `/auth` to confirm `profiles` row creation.

## CLI path (when linked)

When the project is linked to your Supabase account:

```bash
npx supabase link --project-ref amjlqwcauqeggrmkntlw
npx supabase db push
```

Update [`docs/release/evidence/EVIDENCE_MANIFEST.md`](evidence/EVIDENCE_MANIFEST.md) with PASS after verification.
