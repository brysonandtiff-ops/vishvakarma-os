\# VISHVAKARMA.OS — ENGINEERING CHALLENGE v2 (session-phased, evidence-grounded)



\## HOW TO RUN THIS

This challenge runs as FIVE SESSIONS, not one. Each session produces committed

artifacts that the next session consumes. Do not attempt later-session work early.



\- Session 1 — SYSTEM AUDIT (this prompt + repo ZIP)

\- Session 2 — Phase 1: Critical bugs (input: audit doc)

\- Session 3 — Phase 2+3: UX polish + performance (input: audit doc + Phase 1 diff)

\- Session 4 — Phase 4: iPad experience + demo recorder tool

\- Session 5 — Phase 5: Commercial readiness + VISHVAKARMA\_RELEASE\_REPORT.md



\## ROLE

You are the combined team: Principal Software Architect, React/TypeScript Lead,

Three.js Rendering Specialist, Apple iPad UX Designer, Enterprise SaaS Product

Engineer, QA Automation Lead, Security Engineer, Performance Engineer.



Understand the existing system first. Do not create a new app. Do not replace

architecture unnecessarily.



\## PROJECT

Vishvakarma.OS v1.5.0 — professional architectural operating system.

CAD workflows, 3D spatial design (Three.js/R3F/Drei), project management,

governance ("No Drift"), collaboration, AI assistance, iPad-first.

Stack: React + TypeScript + Vite + Zustand + Workbox PWA.

Design direction: iPadOS / Vision Pro / Final Cut / Figma / Fusion / Unreal

editor. Minimal, premium, cinematic, precise, responsive.



\## EVIDENCE INPUTS (uploaded alongside the ZIP — cite these, do not guess)

\- docs/release/evidence/<latest>/report.json   (release:champion run — 899 tests)

\- docs/release/auth-audit/auth-report.json      (auth surface audit)

\- Governance system hash + build fingerprint (BUILD\_FINGERPRINT.txt)



RULE: every score and claim in the audit must cite a file path, a line, or one

of the evidence inputs. No un-cited scores. Where evidence is missing, write

"UNVERIFIED — needs <specific check>" instead of a number.



\## SESSION 1 DELIVERABLE — VISHVAKARMA\_SYSTEM\_AUDIT.md

1\. Architecture overview (as-built, from source — not from README claims)

2\. Current capabilities (verified vs claimed)

3\. Missing features

4\. Technical debt register (file:line, severity, effort S/M/L)

5\. UX issues (Nielsen heuristics)

6\. Security concerns (auth flow, token handling, XSS surfaces, dependency risk)

7\. Performance issues (bundle, 3D memory/GPU, render churn)

8\. Production readiness score — cited, with per-area sub-scores



\### Per-page reports (every file in src/pages/)

purpose · user journey · quality /10 (cited) · missing functionality ·

UX improvements · accessibility issues · performance issues · recommended patch



\### Component audit (src/components/)

duplicated components · dead components · inconsistent styling ·

missing loading states · missing error states · a11y problems



\### Style system audit (src/styles/)

token consistency · CSS conflicts · unused styles · mobile problems ·

animation quality · performance impact



\### 3D engine audit (src/\*\*/3d\*, src/\*\*/viewport\*, src/\*\*/scene\*)

memory cleanup (dispose of geometries/materials/textures on unmount) ·

GPU efficiency · texture handling · model loading · FPS stability ·

mobile GPU behavior. Recommend: Performance Monitor, FPS counter,

GPU warning system, loading progress UI — as Phase 3/4 patches, not now.



\## SESSIONS 2–3 — MASTER HARDENING PATCHES

For every page, grouped and delivered per phase:

\- UX (Nielsen): system status visibility, error prevention, consistency, user control

\- Accessibility (WCAG 2.2): keyboard nav, ARIA, contrast, focus, screen reader

\- Engineering: error boundaries, retry systems, empty states, loading states,

&#x20; telemetry hooks

Each patch cites the audit finding it resolves. Output as unified diffs or

complete replacement files — never partial snippets of changed files.



\## SESSION 4 — iPAD-FIRST UPGRADE + DEMO RECORDER

Touch system: 44px minimum targets, gestures, pinch zoom, two-finger pan,

orientation handling, safe-area support.

Responsive modes: Desktop 1440+, Tablet 1024–1366, Mobile 390–768.



\### tools/ipad\_demo\_recorder/ — CORRECTED SPEC

Build with \*\*Playwright (Python) + FFmpeg\*\*. NOT pyautogui/OpenCV — pyautogui

drives the local desktop only and cannot see or touch an iPad; screen-scraping

is brittle and cannot run headless in CI.



\- Playwright device profile: iPad Pro 11 (viewport, touch, WebKit engine)

\- Built-in video recording per scene; FFmpeg concat + title cards + encode

\- Scripted journey: open app → login → dashboard → create project → workspace →

&#x20; load 3D environment → rotate model → change materials → tools → governance →

&#x20; export → final presentation

\- Output: Vishvakarma\_OS\_Demo\_Final.mp4

\- Files: README.md, requirements.txt, demo\_script.py, video\_pipeline.py

\- Note: true physical-iPad footage = QuickTime USB capture on macOS (manual);

&#x20; the automated pipeline is device-profile emulation and is the CI path.



\## SESSION 5 — FINAL DELIVERY

1\. Production readiness: Current / Target / Improvement (all cited)

2\. Complete changed-file list

3\. Patch groups mapped to Phases 1–5

4\. VISHVAKARMA\_RELEASE\_REPORT.md

Governance rule applies to this work itself: new tools (demo recorder, any

added audits) each get a Spec Center entry + Registry registration + tests +

evidence before they count as done.



\## DO NOT MODIFY

Governance system · route registry · spec validation · existing working features.



\## ZIP UPLOAD — VishvakarmaOS-Claude-Audit.zip

INCLUDE: package.json, vite.config.\*, tsconfig\*, eslint\*/prettier\*/tailwind\*/

postcss\*, src/ (all), tests/ | \_\_tests\_\_/ | playwright/ | vitest/, docs/, specs/,

README.md, and an ASSET MANIFEST (output of `du -h` over public/) instead of

binary assets.

EXCLUDE: node\_modules/, dist/, pnpm-lock.yaml, binary images/video/fonts in

public/ (the manifest covers their weight), coverage/.

Reason: lockfiles and binaries burn the context window the audit needs.



\## ULTIMATE GOAL

Transform Vishvakarma.OS from an impressive prototype into a professional-grade

architectural operating system competing visually and technically with modern

design platforms — with every claim backed by evidence.



