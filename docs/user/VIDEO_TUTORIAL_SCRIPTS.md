# Video Tutorial Scripts (Outline)

Short-form scripts for operator-recorded walkthroughs. Target length: 2–4 minutes each. Record on iPad Air 2020 landscape at 1180×820 when possible.

---

## 1. Your First Floor Plan (Getting Started)

**Goal:** New user draws a simple room and sees it in 3D.

1. Open Vishvakarma.OS → **Start Free** → editor loads.
2. Tap **Sample** to load the demo project, or tap **New Project**.
3. Select **Wall (W)** — tap start corner, tap end corner; repeat for a closed rectangle.
4. Select **Door (D)** — tap a wall segment to place a door.
5. Select **Window (N)** — tap another wall for a window.
6. Toggle **3D** in the top bar — orbit to confirm walls, door, and window.
7. Tap **Save** — note Firebase vs Local badge.

**Closing line:** "Every edit syncs to the live 3D chamber — no re-export step."

---

## 2. Labels, Dimensions, and Export

**Goal:** Annotate a plan and export a client-ready PDF.

1. Load an existing project with at least one enclosed room.
2. **Label (T)** — tap room center; double-click label to rename.
3. **Dimension (Shift+M)** — tap two points for a dimension line.
4. Press **Shift+D** to toggle dimension visibility.
5. Open **Export** → choose **PDF (recommended)** → download.
6. Open PDF — confirm openings, labels, and dimensions are visible.

**Closing line:** "PDF export uses the same renderer as PNG and SVG — one source of truth."

---

## 3. Materials, Furniture, and Interior Mode

**Goal:** Style walls and place furniture.

1. Switch workspace mode to **Interior**.
2. Select a wall → open **Materials** panel → pick wood or concrete preset.
3. Tap **Create custom** — upload a texture (Firebase required).
4. Press **F** or select **Furniture** — place a sofa/chair on the plan.
5. Drag furniture to reposition; undo with **Ctrl+Z**.
6. Toggle 3D — confirm material and furniture boxes render.

---

## 4. Projects and Cloud Save

**Goal:** Manage multiple projects with search and duplicate.

1. Navigate to **Projects** from the workspace sidebar.
2. Create a second project from the editor; save to cloud (sign in if prompted).
3. Return to **Projects** — search by name, duplicate a project, archive an old one.
4. Re-open duplicated project — confirm geometry intact.

---

## 5. Governance OS Tour (Power Users)

**Goal:** Show spec lock, change requests, and release gates.

1. Open **Spec Center** — point out SHA-256 hash on locked specs.
2. Open **Change Requests** — create a draft CR, show status workflow.
3. Open **Releases** — explain 13-gate pipeline and stop-ship list.
4. Open **Audit Log** — show project_created / spec_updated events.

**Closing line:** "Vishvakarma.OS is an architectural editor with an operating system for change control."

---

## Recording Checklist

- [ ] Landscape iPad or 1280×800 desktop browser
- [ ] Mic enabled; disable notification sounds
- [ ] Use demo account or local-only mode consistently
- [ ] Export final video as MP4; attach to `docs/release/evidence/` if used for launch proof
