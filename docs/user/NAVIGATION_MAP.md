# Navigation Map

**Product version:** v1.5.0  
**Last verified:** 2026-06-20  
**Audience:** user  

This map explains where to go in Vishvakarma.OS and what to search in the command palette.

---

## Fastest path

1. Press `Ctrl+K` / `Cmd+K`.
2. Type a route, page name, tool, or tutorial name.
3. Choose a result from **Navigate** or **Learn**.

The workspace sidebar remains the main visual map. The command palette is fastest for repeat users and keyboard users.

---

## Workspace routes

| Route | Sidebar label | Use it for | Search terms |
|-------|---------------|------------|--------------|
| `/editor` | Blueprint Editor | Draft walls/openings, use tools, preview 3D, save/export | editor, wall, 3D, export, canvas |
| `/projects` | Projects | Search, duplicate, archive, and reopen saved blueprints | projects, library, duplicate, archive |
| `/optimization` | Design Optimization | Generate and compare scored layout candidates | optimization, AI, candidates, budget |
| `/profile` | Profile | Account, plan, billing, and session status | profile, billing, account, plan |
| `/spec-center` | Spec Center | Review locked specifications and hashes | spec, locked, hash, governance |
| `/registry` | Registry Center | Inspect component and feature inventory | registry, inventory, components |
| `/change-requests` | Change Requests | Propose and track governed changes | CR, change request, workflow |
| `/releases` | Release Center | Review release gates and stop-ship status | release, gates, launch |
| `/world-records` | World Records | Review measurement artifact and gate-count proof | world records, measurement, proof |
| `/audit` | Audit Log | Trace project and governance events | audit, history, events |

---

## Learn routes

| Tutorial | Starts at | Best for |
|----------|-----------|----------|
| Essentials | `/editor` | First-session orientation, wall, opening, 3D, Project Proof |
| Your First Floor Plan | `/editor` | Building a simple closed room |
| Sacred 3D View | `/editor` | Orbit, solar timeline, and walk mode |
| Labels & Export | `/editor` | Annotations and deliverables |
| Materials & Interior | `/editor` | Interior mode, materials, furniture |
| Cloud Save & Local Draft | `/editor` | Save badges and recovery |
| Vastu Harmony | `/editor` | Eight-sector overlay and north orientation |
| India Locale & NBC | `/editor` | Region context and advisory pre-check |
| MEP Routing | `/editor` | Mechanical/electrical/plumbing symbols |
| Projects Library | `/projects` | Project search, duplicate, archive, reopen |
| Design Optimization | `/optimization` | Candidate scoring and promotion |
| Governance OS | `/spec-center` | Spec Center, CRs, releases, audit trail |

---

## iPad navigation tips

- Use the floating menu button to open the sidebar when the editor is immersive.
- Keep touch targets clear of Safari chrome by using Add to Home Screen for the PWA experience.
- Use the Tutorial hub when a control is unfamiliar; each track highlights the current control where available.
- If a highlighted control is hidden, expand the sidebar or open the mobile menu.

---

## Troubleshooting navigation

| Symptom | Try this |
|---------|----------|
| Cannot find a route | Press `Ctrl+K` / `Cmd+K` and search the route name |
| Tutorial highlight points off-screen | Expand the sidebar, open mobile navigation, or rotate iPad landscape |
| 3D route feels blank | Return to `/editor`, draw walls, then toggle 3D from the editor |
| Billing controls missing | Go to `/profile`; plan controls depend on auth and Stripe configuration |

For device and WebGL issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
