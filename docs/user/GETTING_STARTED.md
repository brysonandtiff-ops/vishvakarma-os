# Getting Started

**Product version:** v1.5.0  
**Last verified:** 2026-06-20  
**Audience:** user  

Welcome to Vishvakarma.OS — an iPad-first architectural workstation for 2D blueprints, live 3D visualization, and governed project delivery.

**Production URL:** https://vishvakarma-os.app

---

## Create an account

1. Open https://vishvakarma-os.app/auth
2. Sign in with **email magic link** or **Google OAuth**
3. After sign-in you are redirected to the **Blueprint Editor** (`/editor`) or your last workspace

Password reset is available at `/reset-password` when configured.

---

## Your first project

1. Go to **Projects** (`/projects`) from the navigation menu
2. Click **New Project** and enter a name
3. Open the project — the editor loads with an empty canvas and 3D viewport
4. Changes save to the cloud when Supabase is configured (Studio tier and above for unlimited projects)

**Starter tier:** 1 active project. **Studio / Enterprise:** unlimited cloud projects.

---

## Editor tour

Open **Tutorials** from the editor help button (?), workspace sidebar, or command palette (`Ctrl+K` / `Cmd+K` → Learn). The in-app tutorial system includes:

- **Essentials** — hands-on walkthrough: draw walls, place openings, toggle 3D, read Project Proof
- **Topic tours** — export, interior materials, Vastu, NBC compliance, MEP, projects library, optimization, governance
- **Video-ready walkthroughs** — matching scripts for short recorded guides in [VIDEO_TUTORIAL_SCRIPTS.md](./VIDEO_TUTORIAL_SCRIPTS.md)

First visit: choose **New project** or **Load sample** on the welcome screen to auto-start Essentials (once per browser).

| Region | Purpose |
|--------|---------|
| **Tool rail** (left) | Wall, door, window, measure, label, dimension, room, MEP, furniture, landscape, terrain, Vastu tools |
| **2D canvas** (center) | Floor plan drafting with snap-to-grid |
| **3D viewport** (right or toggle) | Live extrusion of walls, materials, solar lighting |
| **Properties panel** | Selected entity dimensions, materials, mode-specific controls, and project proof |
| **Top bar** | Project name, save status, export, view modes |
| **Command palette** | Route jump, tutorial launch, and workspace search (`Ctrl+K` / `Cmd+K`) |

Toggle 3D with the viewport control. Adjust solar time with the lighting scrubber.

Marketing guides on [/features](https://vishvakarma-os.app/features) deep-link into the matching in-app tour.

---

## Navigate the workspace

Use [NAVIGATION_MAP.md](./NAVIGATION_MAP.md) as the route map.

| Need | Go to |
|------|-------|
| Draft or inspect a plan | `/editor` — Blueprint Editor |
| Reopen, duplicate, or archive work | `/projects` — Projects Library |
| Run AI candidate scoring | `/optimization` — Design Optimization |
| Manage account and plan | `/profile` — Profile |
| Review governed specifications | `/spec-center` — Spec Center |
| Trace changes and releases | `/change-requests`, `/releases`, `/audit` |

---

## Save and load

- **Auto-save:** Manifest changes persist to Supabase when signed in and backend is configured
- **Local draft:** If offline or unconfigured, drafts recover from browser `localStorage`
- **Open project:** Projects → select from your library

See [WORKFLOWS.md](./WORKFLOWS.md) for export, optimization, and compliance tasks.

---

## Plans and billing

| Plan | Highlights |
|------|------------|
| **Starter** | Free — 1 project, 2D tools, PNG export |
| **Studio** | $499/mo — unlimited projects, full export package, cloud save, Vastu, NBC pre-check |
| **Enterprise** | $1,000/mo — SSO, API access, dedicated onboarding (collaboration planned) |

Details: [BILLING_AND_PLANS.md](./BILLING_AND_PLANS.md). Manage billing at `/profile`.

---

## iPad and PWA

Install from Safari **Add to Home Screen** for a full-screen workstation experience. Minimum touch targets are 44×44 px. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for WebGL and touch issues.

---

## Next steps

- [VIDEO_TUTORIAL_SCRIPTS.md](./VIDEO_TUTORIAL_SCRIPTS.md) — watch/record the guided tutorial flow
- [WORKFLOWS.md](./WORKFLOWS.md) — common tasks
- [TOOL_REFERENCE.md](./TOOL_REFERENCE.md) — every editor tool
- [NAVIGATION_MAP.md](./NAVIGATION_MAP.md) — workspace routes
- [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) — shortcuts
- [FAQ.md](./FAQ.md) — frequently asked questions

---

## Developer setup

If you are setting up the codebase locally (not using the hosted app), see [developer/ONBOARDING.md](../developer/ONBOARDING.md).
