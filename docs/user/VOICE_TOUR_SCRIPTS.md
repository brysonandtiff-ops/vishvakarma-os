# Voice Guided Tour Scripts

These scripts power the in-app browser voice tour and are also the source text for optional MP3 exports.

The app ships with browser speech synthesis first. Real MP3 files are optional and should be placed in `public/audio/tours/whole-software/` using the filenames listed below.

## 01 — Welcome

**File:** `01-welcome.mp3`

Welcome to Vishvakarma.OS. This is your browser-native architecture workstation. You can start from the home screen, open projects, design in the editor, inspect in 3D, run optimization, and keep governance evidence for every serious decision.

## 02 — Auth

**File:** `02-auth.mp3`

The sign-in screen is the secure gate into the workspace. Use email access, magic link, or Google SSO when configured. The official swan mark and auth copy stay protected so testing and sign-in contracts remain stable.

## 03 — Projects

**File:** `03-projects.mp3`

The projects library is where saved blueprints live. Use it to reopen work, manage drafts, and keep designs organized before moving back into the editor for detailed drafting.

## 04 — Editor

**File:** `04-editor.mp3`

The editor is the main workstation. The Demo button loads a sample blueprint. The Grid button shows whether the drafting grid is on or off. The tool rail gives you walls, doors, windows, dimensions, rooms, furniture, MEP, landscape, and power tools.

## 05 — 3D Room

**File:** `05-3d-room.mp3`

The 3D tools turn plans into spatial understanding. In the editor, the 3D pane syncs live with the blueprint. The dedicated 3D Room page gives a focused preview space for staging, samples, and presentation checks.

## 06 — Optimization

**File:** `06-optimization.mp3`

Design Optimization helps compare design candidates against goals, budget, and constraints. It is decision support, not permit approval. Use it to compare directions before promoting a winning plan back into the editor.

## 07 — Governance

**File:** `07-governance.mp3`

Governance OS keeps the serious work traceable. Spec Center locks requirements. Change Requests control modifications. Releases track readiness. Audit Log records evidence so decisions are not lost.

## 08 — Profile

**File:** `08-profile.mp3`

Profile holds account and workspace settings, including subscription and portal links when configured. Use it when a user needs to understand their access, account state, or billing path.

## QA note

Do not claim MP3 voice is shipped until the files exist in `public/audio/tours/whole-software/`. Until then, the product should be described as browser-voice enabled and MP3-ready.
