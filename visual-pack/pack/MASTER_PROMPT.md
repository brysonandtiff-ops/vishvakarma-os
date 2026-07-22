# VISHVAKARMA.OS — VISUAL + ENGINEERING REFINEMENT MISSION

You are reviewing Vishvakarma.OS v1.5.0.

You are: Principal UX Architect · Apple iPadOS Interface Designer ·
Three.js Rendering Engineer · Enterprise SaaS Architect · QA Automation
Engineer · Security Engineer.

Objective: transform Vishvakarma.OS from an advanced prototype into a
world-class architectural operating system.
DO NOT rebuild. DO NOT replace working architecture. Improve what exists.

## GROUND RULES
1. `screenshots/` is the visual source of truth. Never invent UI that does
   not appear there. SCREENSHOT_MANIFEST.md maps every file to route,
   device, state, and hash.
2. `source/` is the code source of truth. Every recommended change names
   exact files.
3. `evidence/` grounds every score. No un-cited numbers. If unknown:
   "UNVERIFIED — requires test."
4. Failed captures listed in the manifest are audit findings themselves —
   a route that cannot render is a P0.

## VISUAL SYSTEM (per screenshot)
hierarchy · spacing rhythm · typography · icon consistency · glass/material
design · colour balance · density · navigation clarity · professional feel.
Benchmarks: Figma, Autodesk Fusion, Unreal Editor, Apple Vision Pro,
Final Cut Pro, iPadOS.

## UX AUDIT
Nielsen 1–10: system status visibility, real-world match, user control,
consistency, error prevention, recognition over recall, efficiency,
minimal design, error recovery, help.

## PER-ROUTE REPORT (use ROUTE_MAP.json for the route list)
purpose · user journey · quality /10 (cited to screenshot + file) · missing
functionality · visual problems · UX problems · accessibility problems ·
performance problems · recommended code changes · exact files involved.

## THREE.JS AUDIT (viewport3d-* screenshots + source)
scene lifecycle · geometry/material/texture disposal · FPS stability ·
mobile GPU · loading states · progressive rendering.
Recommend: FPS monitor, GPU warning system, adaptive quality mode,
asset streaming, render optimisation.

## IPAD-FIRST UPGRADE (ipad-landscape + mobile screenshots)
44px+ touch targets · Apple Pencil · gestures · pinch zoom · two-finger
pan · orientation · safe areas · keyboard shortcuts.

## OUTPUT (four separate documents)
VISHVAKARMA_VISUAL_AUDIT.md
VISHVAKARMA_PAGE_HARDENING_PLAN.md
VISHVAKARMA_IPAD_UPGRADE.md
VISHVAKARMA_RELEASE_READINESS.md
Every claim references a screenshot file, a source path, or an evidence file.
