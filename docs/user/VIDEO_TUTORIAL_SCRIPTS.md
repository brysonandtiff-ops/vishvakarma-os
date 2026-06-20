# Video Tutorial Scripts

**Product version:** v1.5.0  
**Last verified:** 2026-06-20  
**Audience:** user education / operator recording  

Short-form scripts for user-facing walkthroughs. Target length: 90 seconds to 4 minutes each. Record on iPad Air 2020 landscape at 1180×820 or a 1280×800 desktop browser when possible.

Use the same route and tutorial title as the in-app Tutorial hub so viewers can follow along from `Ctrl+K` / `Cmd+K` → **Learn**.

---

## Recording standard

- Start each video from the intended route with the workspace sidebar visible.
- Say the route out loud once, for example: “We are in Blueprint Editor at `/editor`.”
- Use a demo account or local-only mode consistently for the whole batch.
- Keep Project Proof visible when explaining save, export, or compliance state.
- For cloud save, say **Supabase cloud save**.
- End with the next recommended tutorial and the matching in-app track name.

---

## 1. Essentials

**Route:** `/editor`  
**In-app track:** Essentials  
**Goal:** New user understands the workspace, draws one wall, opens 3D, and reads Project Proof.  
**Target length:** 3–4 minutes

1. Open Vishvakarma.OS and sign in or continue with a local draft.
2. Open **Blueprint Editor** (`/editor`).
3. Point out the **tool rail**, **2D canvas**, **3D viewport toggle**, **properties panel**, **Project Proof**, and **command palette**.
4. Select **Wall (W)** and draw one wall segment.
5. Select **Door (D)** or **Window (N)** and place one opening on the wall.
6. Toggle **3D** and orbit once to show that the model updates without export.
7. Read Project Proof: save mode, structure counts, compliance status, export readiness.
8. Open `Ctrl+K` / `Cmd+K` → **Learn** and show where the viewer can restart this same track.

**Closing line:** “Every edit stays connected to the proof trail, so you can draft, inspect, and verify from one workspace.”

---

## 2. Your First Floor Plan

**Route:** `/editor`  
**In-app track:** Your First Floor Plan  
**Goal:** User creates a simple closed room with openings and confirms it in 3D.  
**Target length:** 3–5 minutes

1. Choose **Load sample** for a guided start or **New project** for a blank plan.
2. Select **Wall (W)** — tap four corners to form a rectangle.
3. Use snap-to-grid to keep the room aligned.
4. Select **Door (D)** — tap one wall segment.
5. Select **Window (N)** — tap another wall segment.
6. Toggle **3D** and orbit to confirm wall height, door placement, and window placement.
7. Save from **Project actions** and call out whether the save badge shows Supabase cloud or local draft.

**Closing line:** “Once the shell is drawn, the same project is ready for labels, dimensions, export, and 3D review.”

---

## 3. Labels, Dimensions, and Export

**Route:** `/editor`  
**In-app track:** Labels & Export  
**Goal:** Annotate a plan and export a client-review package.  
**Target length:** 2–4 minutes

1. Open a project with at least one enclosed room.
2. Select **Label (T)** — tap the room center and rename the label.
3. Select **Dimension (Shift+M)** — tap two points for a dimension line.
4. Press **Shift+D** to toggle dimension visibility.
5. Open **Project actions → Export**.
6. Explain the format choice: PDF for review, PNG/SVG for visuals, JSON for backup, DXF for CAD exchange where available.
7. Download the export and reopen it briefly.

**Closing line:** “Export uses the same project manifest, so your annotations and backup stay tied to one source of truth.”

---

## 4. Materials, Furniture, and Interior Mode

**Route:** `/editor`  
**In-app track:** Materials & Interior  
**Goal:** User understands when to switch modes and how visual styling reaches 3D.  
**Target length:** 2–4 minutes

1. Switch workspace mode to **Interior**.
2. Select a wall and open the **Materials** panel.
3. Pick a built-in material preset.
4. Select **Furniture** or press **F** and place a chair or sofa.
5. Drag the furniture to reposition.
6. Toggle **3D** and show that material and furniture placement appear in the live model.

**Closing line:** “Interior mode lets you move from structure to spatial feel without leaving the same plan.”

---

## 5. Projects Library and Navigation

**Route:** `/projects`  
**In-app track:** Projects Library  
**Goal:** User can find, duplicate, archive, and reopen saved work.  
**Target length:** 2–3 minutes

1. Open **Projects** from the sidebar or command palette.
2. Search for a project by name.
3. Duplicate a project card and explain when duplication is safer than editing the original.
4. Archive an old project if available.
5. Reopen the duplicate and confirm geometry is intact.
6. Open `Ctrl+K` / `Cmd+K` and show direct route search for Editor, Projects, Optimization, Profile, and Tutorial hub.

**Closing line:** “Projects is the library; the command palette is the fastest way to jump between work areas.”

---

## 6. Design Optimization

**Route:** `/optimization`  
**In-app track:** Design Optimization  
**Goal:** User understands generated candidates as decision-support.  
**Target length:** 3–4 minutes

1. Open **Design Optimization**.
2. Enter goals, budget, bedroom count, parcel size, and lifestyle preferences.
3. Run candidate generation.
4. Review score dimensions: cost, council, and compliance.
5. Promote a preferred candidate to a project.
6. State clearly that optimization outputs are decision-support, not permit approval.

**Closing line:** “Use optimization to compare options quickly, then verify final decisions with professionals and the governance workflow.”

---

## 7. Vastu, Locale, NBC, and MEP Tools

**Route:** `/editor`  
**In-app tracks:** Vastu Harmony, India Locale & NBC, MEP Routing  
**Goal:** User sees where advisory overlays and technical tools live.  
**Target length:** 3–5 minutes

1. Switch to **Draft** mode and select **Vastu**.
2. Place or inspect the eight-sector overlay and set north orientation.
3. Use the locale control to switch region context where available.
4. Show the NBC pre-check panel and explain advisory status.
5. Switch to **MEP** mode and place a symbol.
6. Toggle 3D to inspect placement relative to walls and rooms.

**Closing line:** “These tools help you reason earlier, but final compliance and engineering decisions still need professional review.”

---

## 8. Governance OS Tour

**Route:** `/spec-center`  
**In-app track:** Governance OS  
**Goal:** Power users understand spec locks, change requests, releases, and audit trail.  
**Target length:** 4–5 minutes

1. Open **Spec Center** and point out the locked specification hash.
2. Open **Change Requests** and create or review a draft CR.
3. Open **Release Center** and explain the 13-gate pipeline.
4. Open **Audit Log** and show system events.
5. Optional: open **World Records** to show the gate-count measurement artifact.

**Closing line:** “Vishvakarma.OS is not just a drawing surface; it is an architectural editor with an operating system for change control.”

---

## Batch checklist

- [ ] Use the same product version and demo data across every recording.
- [ ] Verify the route and in-app tutorial title before recording.
- [ ] Keep mouse/touch movement slow enough for viewers to follow.
- [ ] Mute notifications and background audio.
- [ ] Capture one clean thumbnail frame per video.
- [ ] Export final videos as MP4.
- [ ] Attach final evidence to `docs/release/evidence/` only when used for launch proof.
