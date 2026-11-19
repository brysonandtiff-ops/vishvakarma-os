# Navigation Map

**Product version:** v1.5.0

**Studio candidate verified in local Chromium:** 2026-11-19

**Audience:** user


This map explains where to go in Vishvakarma.OS and what to search in the command palette.

---

## Fastest path

1. Press `Ctrl+K` / `Cmd+K`.
2. Type a route, page name, tool, or tutorial name.
3. Choose a result from **Navigate** or **Learn**.

**Projects** and **Studio** sit in the main navigation. Use the menu to open other design and governance tools. See the [release decision](../release/CURRENT_RELEASE_STATUS.md) for the version currently live.

---

## Workspace routes

| Route | Navigation label | Use it for | Search terms |
|-------|---------------|------------|--------------|
| `/projects` | Projects | Create, import, search, and reopen designs. Open Atrium Wing in 3D or Walk. | projects, library, sample, import |
| `/editor` | Studio | Switch among Blueprint, 3D, and Walk. Use File, Tools, Save, Export, and Details. | studio, editor, wall, 3D, export |
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

- Use Projects and Studio in the header. Open the workspace menu for secondary tools.
- In Walk, drag the view to look and hold the on-screen arrows to move.
- Use the Tutorial hub when a control is unfamiliar; each track highlights the current control where available.
- Open **File** or **Tools** in Studio when the tutorial highlights a secondary action.

---

## Troubleshooting navigation

| Symptom | Try this |
|---------|----------|
| Cannot find a route | Press `Ctrl+K` / `Cmd+K` and search the route name |
| Tutorial highlight points off-screen | Open the relevant Studio menu or rotate to landscape |
| 3D view feels blank | Open a project with geometry, draw in Blueprint, or open the Atrium Wing sample in Projects |
| Billing controls missing | Go to `/profile`; plan controls depend on auth and Stripe configuration |

For device and WebGL issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
