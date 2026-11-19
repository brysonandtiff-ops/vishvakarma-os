# Vishvakarma.OS — owner vision and real acceptance tests
Owner's intended gift: a simple, accurate 2D house-to-3D building tool that a nontechnical family member can use on an iPad, phone or computer.

## Canonical visual identity — no redesign without approval
Owner-supplied official swan/V artwork is immutable by default. Respect docs/BRAND_LOCK.md: black/gold auth and branding, cream drawing paper, compact black tool rails, readable gold highlights, 44-pixel or larger touch areas, iPad-first layout. Images/infographics are design references, never runtime evidence. Do not call AI-generated concepts production screenshots.

## Core user journey (must be proven, not just represented in source)
1. **Draw:** open the main editor; use finger, Apple Pencil, mouse or keyboard to draw precise walls, windows, doors, room labels and dimensions. Undo/redo, zoom and pan actually work.
2. **Build in 3D:** convert the exact 2D house into measurable 3D walls/openings/rooms/floors without losing edits. Round-trip 2D edits must update 3D.
3. **Walk through:** real interactive first-person view on a supported pointer/keyboard platform; safe accessible touch or controller alternative on mobile/iPad, with clear fallback when WebGL unavailable.
4. **Save and reopen:** give a visible save receipt, close/reload, reopen the exact same geometry, and offer a safe local recovery path if cloud sign-in fails.
5. **Share:** explicit opt-in export/share. Verify returned JSON/PNG/PDF/DXF/SVG as supported by the current source; preserve author ownership and protect private plans.

## Acceptance checklist
- [ ] Genuine screen/video showing the new-user flow, draw wall and door, valid 2D measurements, live matching 3D geometry, walkthrough and 2D edit update.
- [ ] Authenticated isolated cloud save/reload plus local draft fallback/recovery tests; no cross-account data leakage.
- [ ] Source-bound regression, security, build, PWA/offline, accessibility and error-recovery tests on immutable candidate SHA.
- [ ] Genuine screenshots and a short real interaction recording across iPad landscape, Fold folded/unfolded, iPhone portrait and desktop browser; note which were emulated vs physical.
- [ ] Branding compared with original approved art without replacement, owner signoff recorded.
- [ ] Canonical production domain and credentials verified after the security/backup holds are closed.
- [ ] Any billed external service or paid quota requires separate explicit cost approval.

## Specialist work order (roles, not evidence of active agents)
AXIOM G.A.I.S. is the single command authority. Planned assignments: architectural UX and original-art guard, 2D drawing engineer, 3D/Three.js engineer, Supabase security engineer, accessibility/device QA, release/operations verifier, evidence custodian and phone-storage integration specialist. Each must publish real source changes, tests and proof before being marked complete. No standalone duplicate S.I.R.E. master plugin should be created.

## Delivery order
Protect canonical art and actual existing architecture; fix release safety and source-of-truth first, then one genuine end-to-end working feature with tests and runtime media, then device compatibility. No decorative replacement for a functioning editor. Release status remains BLOCKED as documented in docs/release/CURRENT_RELEASE_STATUS.md.
