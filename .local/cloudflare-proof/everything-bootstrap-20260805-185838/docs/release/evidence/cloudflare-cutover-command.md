# Cloudflare cutover command

Run from PowerShell 7.6.4 on Windows:

```powershell
cd "C:\Users\bryso\dev\FUTURE PROJECTS\vishvakarma-os"
git fetch origin
git switch agent/cloudflare-pages-workers-migration
git pull --ff-only
Set-ExecutionPolicy -Scope Process Bypass -Force
.\RUN_CLOUDFLARE_CUTOVER_GATES.ps1
```

The runner is fail-closed. It pushes the committed Supabase callback configuration when `SUPABASE_ACCESS_TOKEN` is present, runs repository/build/auth/PWA/performance/deep-route gates, verifies the live Cloudflare health and headers, checks Stripe account/price configuration, and sends a harmless correctly signed webhook probe.

Never paste `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` into issue comments, screenshots, or chat.
