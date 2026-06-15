# Documentation Standards — Vishvakarma.OS

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  

This document defines how documentation in this repository is written, maintained, and verified.

---

## Truth hierarchy

When documents conflict, use this precedence:

| Priority | Source | Role |
|----------|--------|------|
| 1 | [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md) + [handoff/HANDOFF.md](./handoff/HANDOFF.md) | Runtime truth |
| 2 | Auto-generated [handoff/appendices/](./handoff/appendices/) (A–H) | Live inventory truth |
| 3 | Audience guides (`developer/`, `operations/`, `user/`) | Curated how-to |
| 4 | [specs/](./specs/), [CHANGELOG.md](../CHANGELOG.md) | Product contract |
| 5 | [archive/](./archive/) | Historical only |

**Rule:** Do not hand-maintain inventories of routes, env vars, scripts, or schema. Link to appendices instead.

---

## Document front matter

Every new canonical document should include:

```markdown
# Title

**Product version:** v1.5.0
**Last verified:** YYYY-MM-DD
**Audience:** developer | operator | user | due-diligence
**Supersedes:** (optional — link to replaced doc)
```

---

## Stale and historical banners

### Historical (v1.0-era scope)

Use at the top of documents that remain for governance history but do not describe current production:

```markdown
> **Historical:** This document describes v1.0-era scope. For current production, see [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md).
```

### Forward-looking (not production)

Use for v2 scaffolding and RFCs:

```markdown
> **Forward-looking:** This document describes planned or preview features. For current production, see [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md).
```

---

## When to regenerate appendices

Run after changes to:

- Client routes (`src/routes.tsx`)
- Serverless API handlers (`api/`)
- Environment variable references
- `package.json` scripts or dependencies
- Supabase migrations
- Test file inventory

```bash
pnpm run handoff:generate
pnpm run handoff:verify
pnpm run docs:verify
```

---

## Verification contract

Before merging documentation-heavy PRs or shipping releases:

```bash
pnpm run handoff:generate   # after route/api/schema/script changes
pnpm run handoff:verify
pnpm run docs:verify
pnpm run lint:types
```

See [release/VERIFY_COMMANDS.md](./release/VERIFY_COMMANDS.md) for the full operator command matrix.

---

## Writing guidelines

1. **Link, don't duplicate** — appendices and handoff annexes are authoritative for inventories.
2. **Audience-first** — place docs in `developer/`, `operations/`, `user/`, or `handoff/`; update [docs/README.md](./README.md) portal links.
3. **Supabase-only runtime** — do not describe Firebase as the production backend in user or developer canonical paths. Firebase references belong only in [MIGRATION.md](../MIGRATION.md) and archive docs.
4. **Evidence on ship** — user-visible changes update [CHANGELOG.md](../CHANGELOG.md) and release evidence when applicable.
5. **No secrets** — never commit filled operator annexes, `.env` files, or API keys.

---

## Related

- [docs/README.md](./README.md) — documentation hub
- [handoff/HANDOFF.md](./handoff/HANDOFF.md) — due diligence entry point
- [PROPRIETARY_NOTICE.md](./PROPRIETARY_NOTICE.md) — IP and licensing posture
