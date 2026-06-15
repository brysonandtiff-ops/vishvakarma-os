# FAQ

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** user  

---

## How do I sign in?

Production auth uses **Supabase** — email magic link or Google OAuth at `/auth`. See [GETTING_STARTED.md](./GETTING_STARTED.md).

---

## Why are projects not saving to the cloud?

Cloud save requires Supabase configuration and a signed-in account. **Studio** tier includes unlimited cloud projects. **Starter** allows one active project.

Without cloud backend, the app uses **local draft** mode in your browser.

---

## Can I use the editor without signing in?

On the hosted production app, workspace routes require authentication. Local developers can use `VITE_ALLOW_LOCAL_DEMO=true` in development only.

---

## Is compliance output a permit approval?

**No.** NBC pre-check, cost intelligence, and council scoring are **decision-support prototypes** — not certified professional or regulatory approval. See [PRODUCT_CAPABILITIES.md](../PRODUCT_CAPABILITIES.md).

---

## PDF export looks like a summary, not a drawing

PDF export produces a printable **project summary**. Use SVG or DXF (Studio+) for vector floor plan detail. [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md)

---

## What browsers are supported?

Chrome/Edge 90+, Firefox 88+, Safari/iOS 14+. WebGL 2 preferred for 3D. [compliance/SUPPORT_MATRIX.md](../compliance/SUPPORT_MATRIX.md)

---

## How do plans and billing work?

Starter (free), Studio ($499/mo), Enterprise ($1,000/mo). [BILLING_AND_PLANS.md](./BILLING_AND_PLANS.md)

---

## How do I clear a stuck collaboration session?

Refresh the page. Collaboration is preview-only; sessions reset on disconnect.

---

## More help

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [WORKFLOWS.md](./WORKFLOWS.md)
- [TOOL_REFERENCE.md](./TOOL_REFERENCE.md)
