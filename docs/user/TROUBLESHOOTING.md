# Troubleshooting

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** user  

Common issues and fixes for Vishvakarma.OS users.

---

## Sign-in and auth

### Magic link does not arrive

- Check spam folder
- Confirm email address is correct
- Try Google OAuth instead at `/auth`
- Operator: verify Supabase Auth email provider is configured

### OAuth redirect loop or error

- Clear site cookies for `vishvakarma-os.app`
- Ensure you use the canonical URL (not an old `.vercel.app` bookmark)
- Try a private/incognito window

### "Backend is not configured"

Production requires Supabase. If you see this on the hosted app, contact support — operator env may be misconfigured.

---

## Projects and save

### Projects not saving to cloud

- Confirm you are **signed in**
- Starter tier: only **1 active project** — archive or delete others
- Check network connection
- Without cloud backend, drafts save to **browser local storage** only (same device)

### Blank editor after sign-in

- Open browser devtools console for errors
- Refresh the page
- Try `/projects` → reopen project

### Lost local draft

Local drafts are device-specific. Cloud save (Studio+) persists across devices.

---

## 3D viewport

### Blank or black 3D viewport

- **WebGL disabled:** Enable hardware acceleration in browser settings
- **Safari iPad:** Update iOS; close other heavy tabs
- App degrades to **2D-only** when WebGL is unavailable

### Poor 3D performance

- Open **Properties → More → Performance profile** and choose **Draft** (iPad default) or **Studio**
- Reduce open browser tabs
- Use Standard atmosphere mode in the 3D header if Presentation profile was selected
- Large projects with many walls may slow older iPads — wall batching activates automatically at 10+ walls outside cinematic mode

### Editor feels slow while panning

- Pan/zoom should no longer re-run compliance; if the compliance panel flickers while panning, refresh the app
- Enable the dev perf HUD with `?perf=1` to inspect geometry vs viewport revision counters

---

## iPad and PWA

### Touch targets too small

Report specific controls — minimum design target is 44×44 px. Update app via refresh after deploy.

### Add to Home Screen not full screen

Re-add PWA from Safari share sheet after clearing old icon.

### Keyboard covers editor on iPad

Current builds apply `visualViewport` keyboard inset to the canvas stage and shift inline label editors above the keyboard. Use landscape when possible; pinch-zoom and status-bar zoom buttons are available if the canvas feels cramped.

---

## Export

### PDF looks like summary not drawing

Expected — PDF is a **project summary**. Use **SVG** or **DXF** (Studio+) for vector geometry.

See [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md).

### Export button disabled

Check plan tier — some formats require Studio. View status on **Profile**.

---

## Billing

### Paid but plan not upgraded

- Wait 1–2 minutes for webhook processing
- Sign out and sign in again
- Check Profile for billing status
- Contact support with checkout email if still wrong

---

## Collaboration (preview)

Real-time collaboration is **preview only**. Refresh page to clear stuck session state.

---

## Still stuck?

See [FAQ.md](./FAQ.md) or contact the operator via support channel listed on the marketing site.
