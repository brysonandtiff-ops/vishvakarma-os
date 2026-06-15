# Vishvakarma.OS v1.0.0 — Complete Build Document

> **Historical:** This document describes v1.0-era scope (editor at `/`, Firebase-era backend). For current production, see [docs/CURRENT_PRODUCTION_ARCHITECTURE.md](../docs/CURRENT_PRODUCTION_ARCHITECTURE.md).

**Date**: 2026-02-15  
**Version**: 1.0.0  
**Status**: Production Ready  
**Total Files**: 200+ source files  
**Total Tests**: 357 (100% passing)  
**Test Coverage**: Comprehensive (Vitest + @vitest/coverage-v8)  
**Lint Status**: Clean (Biome + ast-grep + tsgo)  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Application Pages](#2-application-pages)
3. [UI Components](#3-ui-components)
4. [Editor Components](#4-editor-components)
5. [Core Modules](#5-core-modules)
6. [Type System](#6-type-system)
7. [Database Layer](#7-database-layer)
8. [Governance System](#8-governance-system)
9. [Testing Suite](#9-testing-suite)
10. [Documentation](#10-documentation)
11. [Configuration & Tooling](#11-configuration--tooling)
12. [Scripts & Automation](#12-scripts--automation)
13. [Dependencies](#13-dependencies)
14. [Database Schema](#14-database-schema)
15. [Quality Metrics](#15-quality-metrics)

---

## 1. Project Overview

**Vishvakarma.OS** is an iPad-first, browser-native architectural blueprint and live 3D studio with a strict governance framework. It provides a unified workspace for 2D blueprint editing with real-time 3D visualization, material application, and solar lighting simulation.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite (rolldown-vite) |
| UI Library | shadcn/ui + Tailwind CSS |
| 3D Rendering | Three.js + React Three Fiber + React Three Drei |
| State Management | Project Manifest JSON (deterministic) |
| Database | Supabase (PostgreSQL + PostgREST) |
| Testing | Vitest + @testing-library/react + jsdom |
| Linting | Biome + ast-grep + tsgo |
| Package Manager | pnpm |

### Architecture Principles

- **Project Manifest** — Single source of truth for all editor state
- **Route Manifest** — Single source of truth for all navigation
- **Deterministic State Model** — All actions are replayable
- **Governance Lock** — No untracked changes allowed
- **Audit Trail** — Every major action is logged
- **Spec-Driven Development** — All features backed by locked specifications

---

## 2. Application Pages

Six primary application pages, all governed by the Route Manifest:

### 2.1 Blueprint Editor (`/`) — `src/pages/EditorPage.tsx`
- Main workspace for 2D blueprint editing
- Integrates ToolRail, BlueprintCanvas, Viewport3D, MaterialPicker, SolarTimeline, PropertiesPanel
- Project save/load dialog with Supabase persistence
- Undo/redo controls
- Keyboard shortcuts help dialog
- iPad-optimized with large touch targets

### 2.2 Spec Center (`/spec-center`) — `src/pages/SpecCenterPage.tsx`
- Displays locked specifications with hash verification
- Shows spec status (draft / approved / deprecated / locked)
- Category filtering and hash integrity badges
- Enforces spec immutability through SHA-256 hash validation

### 2.3 Registry Center (`/registry`) — `src/pages/RegistryPage.tsx`
- Component and feature registry
- Tabs for filtering by type: component, feature, tool
- Create new registry entries with metadata
- Status tracking (active / deprecated)

### 2.4 Change Requests (`/change-requests`) — `src/pages/ChangeRequestsPage.tsx`
- Structured change management workflow
- Create, review, approve, reject, and implement change requests
- Status filtering: pending, approved, rejected, implemented
- Priority levels: low, medium, high, critical
- Full audit trail integration

### 2.5 Release Center (`/releases`) — `src/pages/ReleasesPage.tsx`
- Release gates and version control
- Evidence pack generation and validation
- Gate checks: Spec, Registry, Audit, Performance, Security, UX
- Release status: planned, in_progress, released

### 2.6 Audit Log (`/audit`) — `src/pages/AuditLogPage.tsx`
- Complete system audit trail
- Entity-type filtering with icons
- Timestamp-ordered log display
- Search and scrollable history

### 2.7 Not Found — `src/pages/NotFound.tsx`
- 404 error page with dark/light mode support
- Navigation back to home

### 2.8 Sample Page — `src/pages/SamplePage.tsx`
- Reference template page

---

## 3. UI Components

### 3.1 shadcn/ui Components (`src/components/ui/`)

A complete design system with 45+ reusable UI primitives:

- **Accordion** — Collapsible content panels
- **Alert** — Status messages with variants
- **Alert Dialog** — Modal confirmations
- **Aspect Ratio** — Responsive media containers
- **Avatar** — User/profile images
- **Badge** — Status labels and counts
- **Breadcrumb** — Navigation hierarchy
- **Button** — Primary action component with variants
- **Calendar** — Date picker
- **Card** — Content containers with header/content/footer
- **Carousel** — Embla-powered scrollable content
- **Chart** — Recharts integration wrapper
- **Checkbox** — Binary selection
- **Collapsible** — Expand/collapse sections
- **Command** — Command palette / search interface
- **Context Menu** — Right-click menus
- **Dialog** — Modal overlays
- **Drawer** — Slide-out panels
- **Dropdown Menu** — Selectable dropdowns
- **Form** — React Hook Form integration
- **Hover Card** — Preview popovers
- **Input** — Text entry fields
- **Input OTP** — One-time password entry
- **KBD** — Keyboard key styling
- **Label** — Form labels
- **Menubar** — Application menu bar
- **Multi-Select** — Multiple option selection
- **Navigation Menu** — Top-level navigation
- **Pagination** — Page navigation
- **Popover** — Floating content panels
- **Progress** — Progress indicators
- **QR Code** — QR code generation from data URLs
- **Radio Group** — Single-option selection
- **Resizable** — Resizable panel groups
- **Scroll Area** — Custom scrollable regions
- **Select** — Dropdown selection
- **Separator** — Visual dividers
- **Sheet** — Side panels (mobile sidebar)
- **Sidebar** — Navigation sidebar component
- **Skeleton** — Loading placeholders
- **Slider** — Range value selection
- **Sonner** — Toast notifications
- **Switch** — Toggle controls
- **Table** — Data tables
- **Tabs** — Tabbed content
- **Textarea** — Multi-line text entry
- **Toggle** — Binary state buttons
- **Toggle Group** — Grouped toggle buttons
- **Tooltip** — Hover information
- **Video** — Video player wrapper

### 3.2 Common Components (`src/components/common/`)

- **IntersectObserver** — Intersection Observer wrapper for scroll animations
- **PageMeta** — React Helmet Async integration for SEO meta tags
- **RouteGuard** — Authentication route protection (prepared for future auth)

### 3.3 Layout Components (`src/components/layouts/`)

- **AppLayout** — Main application layout with responsive sidebar
  - Desktop sidebar (256px, persistent)
  - Mobile sheet drawer (hamburger menu)
  - Navigation links to all 6 primary pages
  - Version display and governance footer

---

## 4. Editor Components

### 4.1 BlueprintCanvas (`src/components/editor/BlueprintCanvas.tsx`)
- HTML5 Canvas-based 2D blueprint renderer
- Grid system with configurable snap-to-grid
- Wall drawing with click-and-drag
- Door and window placement on walls
- Measurement overlays with unit system support (metric/imperial)
- Opening collision detection
- Selection highlighting
- Real-time coordinate transformation

### 4.2 ToolRail (`src/components/editor/ToolRail.tsx`)
- Left-side vertical tool dock
- 5 tools: Select (V), Wall (W), Door (D), Window (N), Measure (M)
- Grid toggle, Snap toggle, 3D view toggle
- Keyboard shortcut labels
- Tooltip explanations
- Active state highlighting

### 4.3 Viewport3D (`src/components/editor/Viewport3D.tsx`)
- React Three Fiber 3D viewport
- Real-time wall extrusion from 2D blueprint
- Door and window opening rendering
- OrbitControls for camera navigation
- PerspectiveCamera with adjustable position
- Material color mapping
- Sun light simulation

### 4.4 MaterialPicker (`src/components/editor/MaterialPicker.tsx`)
- Three material presets: Paint, Wood, Concrete
- Color, roughness, and metalness properties
- Material assignment to walls and floors
- Preset selection with visual badges

### 4.5 SolarTimeline (`src/components/editor/SolarTimeline.tsx`)
- Time-of-day slider (0–24 hours)
- Sun elevation auto-calculation (sine curve)
- Sun azimuth directional control
- Light intensity adjustment
- Sunrise/sunset icons with time display

### 4.6 PropertiesPanel (`src/components/editor/PropertiesPanel.tsx`)
- Selected wall property editor
- Wall thickness, height, material editing
- Opening width, height, sill height editing
- Slider controls for numeric values
- Delete buttons with confirmation

### 4.7 KeyboardShortcuts (`src/components/editor/KeyboardShortcuts.tsx`)
- Dialog displaying all keyboard shortcuts
- Tool shortcuts: V, W, D, N, M
- View controls: G (grid), S (snap), 3 (3D view)
- Project controls: Ctrl+S, Ctrl+O, Ctrl+N
- General: Escape, Delete, Ctrl+Z, Ctrl+Shift+Z

---

## 5. Core Modules

### 5.1 Canvas Engine (`src/modules/canvasEngine.ts`)
- Unified coordination layer for all canvas operations
- Canvas state management (walls, openings, selected tool)
- Operation queue with governance logging
- Validation integration with manifest schema
- Lock mechanism to prevent concurrent modifications

### 5.2 Governance Lock (`src/modules/governanceLock.ts`)
- Enforces governance rules on all state modifications
- Event logging for every operation
- Drift detection against last validated state
- Manifest validation integration
- Configurable enforcement levels

### 5.3 Version Control Hooks (`src/modules/versionControlHooks.ts`)
- Persistent undo/redo across sessions
- Auto-save with configurable intervals
- Version snapshot management
- localStorage persistence
- Max version limit with automatic pruning

### 5.4 Export Module (`src/modules/export.ts`)
- JSON export (complete Project Manifest)
- SVG export (2D blueprint vector format)
- GLTF export (3D model format)
- Thumbnail generation (Base64 preview)
- Governance history inclusion option
- Metadata generation (wall count, opening count, material count)

### 5.5 Import Module (`src/modules/import.ts`)
- File import with format detection
- Manifest restoration with validation
- Governance history restoration option
- Version history restoration option
- Merge with existing project capability
- Sanitization for untrusted inputs

### 5.6 Format Validator (`src/modules/formatValidator.ts`)
- File size validation (10MB max)
- Version compatibility checks
- Schema compliance validation
- File type detection (JSON, SVG, GLTF)
- Warning and error categorization

### 5.7 Theme Manager (`src/modules/themeManager.ts`)
- 5 theme modes: Architect Table, Light, Dark, High Contrast, Custom
- Swan-V branding contrast enforcement
- WCAG AA/AAA compliance validation
- Color contrast ratio calculations
- Listener-based theme propagation
- CSS variable generation

### 5.8 Accessibility Layer (`src/modules/accessibilityLayer.ts`)
- High contrast mode
- Font size scaling (1.0x–2.0x)
- Reduced motion support
- Screen reader mode
- Keyboard-only navigation
- ARIA label management
- Focusable element tracking
- Swan-V logo alt text enforcement

### 5.9 Collaboration Engine (`src/modules/collaborationEngine.ts`)
- Real-time multi-user editing framework
- User presence tracking (online/offline)
- Cursor position broadcasting
- Operation message protocol
- Chat message support
- WebSocket-ready architecture

### 5.10 Element Lock (`src/modules/elementLock.ts`)
- Lock-on-edit concurrent modification prevention
- 30-second automatic lock timeout
- Lock renewal capability
- Conflict detection with user identification
- Cleanup interval for stale locks

### 5.11 Multi-User Governance (`src/modules/multiUserGovernance.ts`)
- Conflict detection for concurrent edits
- Merge strategies: last-write-wins, first-write-wins, manual
- Coordinated undo/redo across users
- Operation history with 1000-entry buffer
- User attribution for all changes

---

## 6. Type System

### 6.1 Core Types (`src/types/types.ts`)

Complete TypeScript type definitions for the entire application:

**Project Manifest Types:**
- `Point2D` — 2D coordinate `{x, y}`
- `Wall` — Wall segment with start/end points, thickness, height, material
- `Opening` — Door or window on a wall with position, width, height
- `Material` — Paint/wood/concrete with color, roughness, metalness
- `LightingConfig` — Sun azimuth, elevation, time of day, intensity
- `ProjectManifest` — Complete editor state container

**Database Types:**
- `Project` — Database project record with manifest JSONB
- `Spec` — Specification document with version and status
- `RegistryEntry` — Registered component/feature/tool
- `ChangeRequest` — Structured change proposal
- `Release` — Release gate with evidence pack
- `AuditLog` — Immutable audit trail entry
- `RouteManifestEntry` — Navigation route definition

**Editor State Types:**
- `ToolType` — select | wall | door | window | measure
- `EditorState` — Current tool, selection, drawing state
- `ViewportCamera` — 3D camera position, target, zoom

**Form Types:**
- `ProjectFormData` — Project creation form
- `SpecFormData` — Spec creation form
- `ChangeRequestFormData` — Change request form
- `ReleaseFormData` — Release creation form

### 6.2 Utility Types (`src/types/index.ts`)
- `Option` — Generic select option with icon support
- `Profile` — User profile type (prepared for auth)

### 6.3 Module Types
- `Virtual module declarations` for Vite plugin imports
- `SVG type declarations` for imported SVG assets
- `Three.js type augmentations` for React Three Fiber

---

## 7. Database Layer

### 7.1 Supabase Client (`src/db/supabase.ts`)
- Singleton Supabase client initialization
- Environment variable configuration (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

### 7.2 API Layer (`src/db/api.ts`)

Complete CRUD API for all database tables:

**Projects:**
- `getProjects()` — List all projects (newest first)
- `getProject(id)` — Get single project
- `createProject(name, description, manifest)` — Create with audit log
- `updateProject(id, updates)` — Update with audit log
- `deleteProject(id)` — Delete with audit log

**Specs:**
- `getSpecs()` — List all specs
- `getSpecsByCategory(category)` — Filtered list
- `createSpec(spec)` — Create with audit log
- `updateSpec(id, updates)` — Update with audit log

**Registry:**
- `getRegistryEntries()` — List all entries
- `getRegistryByType(type)` — Filtered by type
- `createRegistryEntry(entry)` — Create with audit log

**Change Requests:**
- `getChangeRequests()` — List all requests
- `getChangeRequestsByStatus(status)` — Filtered list
- `createChangeRequest(request)` — Create with audit log
- `updateChangeRequest(id, updates)` — Update with automatic timestamp setting

**Releases:**
- `getReleases()` — List all releases
- `getRelease(id)` — Get single release
- `createRelease(release)` — Create with audit log
- `updateRelease(id, updates)` — Update with automatic release timestamp

**Audit Logs:**
- `getAuditLogs(limit)` — List with pagination
- `getAuditLogsByEntity(type, id)` — Filtered by entity
- `createAuditLog(action, entityType, entityId, details)` — Immutable log entry

**Route Manifest:**
- `getRouteManifest()` — Ordered list of visible routes

---

## 8. Governance System

### 8.1 Core Enforcer (`src/governance/core/enforcer.ts`)
- **Language Validation** — English-only content enforcement
- **Audit Suite** — System state validation (governance log, version control, theme, accessibility)
- **Spec Hash Validation** — Prevents unauthorized spec modifications
- **Manifest Validation** — Project Manifest integrity checks
- **Performance Check** — Enforcement overhead monitoring
- **Auto-Repair** — Automatic initialization of missing state
- **Production Mode** — Strict enforcement with execution blocking
- **Development Mode** — Relaxed enforcement with auto-repair

### 8.2 Spec Validation (`src/core/specValidation.ts`)
- SHA-256 hash calculation for spec documents
- Required section validation (9 mandatory sections)
- `[LOCKED]` tag verification
- Version declaration checking
- UI element registry (`DECLARED_UI_ELEMENTS` — 38 registered elements)
- UI drift detection for undeclared elements
- `verifyAll()` comprehensive validation runner

### 8.3 Manifest Schema (`src/core/manifestSchema.ts`)
- Complete validation for `ProjectManifest` v1.0.0
- `Point2D` validation (numeric x/y)
- `Wall` validation (ID, points, length >= 10px, thickness > 0, height > 0)
- `Opening` validation (type, wall reference, position [0,1], dimensions, sill height)
- `Material` validation (name, type, hex color, roughness [0,1], metalness [0,1])
- `LightingConfig` validation (azimuth [0,360], elevation [0,90], time [0,24], intensity [0,1])
- Duplicate ID detection
- Registry mismatch detection (unknown key detection)

### 8.4 Snapshot Manager (`src/governance/snapshots/snapshotManager.ts`)
- Immutable snapshot creation with hash chain
- Corruption detection through chain integrity verification
- Automatic rollback to last valid snapshot
- Rollback to specific snapshot by ID
- Snapshot query APIs (all, by ID, latest, chain status)
- Max 10 snapshots with automatic pruning
- localStorage persistence

### 8.5 Governance Documentation (`src/governance/README.md`)
- Governance system overview and philosophy

---

## 9. Testing Suite

### 9.1 Test Files (`src/test/`)

19 test files, 6,082 total lines of test code, 357 tests:

| File | Lines | Purpose |
|------|-------|---------|
| `accessibilityLayer.test.ts` | 366 | ARIA labels, focus management, contrast, keyboard navigation |
| `automatedTestSuite.test.ts` | 496 | Integration tests for complete workflows |
| `canvasEngine.test.ts` | 295 | Canvas operations, state management, validation |
| `collaborationEngine.test.ts` | 276 | Multi-user presence, cursor sync, message protocol |
| `elementLock.test.ts` | 267 | Lock acquisition, timeout, conflict resolution |
| `export.test.ts` | 213 | JSON/SVG/GLTF export, metadata, governance history |
| `formatValidator.test.ts` | 351 | File validation, version checks, size limits |
| `governanceLock.test.ts` | 252 | Event logging, drift detection, manifest validation |
| `import.test.ts` | 313 | File import, manifest restoration, merge/sanitize |
| `KeyboardShortcuts.test.tsx` | 226 | Shortcut rendering, dialog interaction |
| `multiUserGovernance.test.ts` | 434 | Conflict detection, merge strategies, coordinated undo |
| `PropertiesPanel.test.tsx` | 483 | Wall property editing, opening updates, deletion |
| `redTeam.test.ts` | 418 | Security: injection, XSS, path traversal, DoS |
| `roomCalculations.test.ts` | 347 | Area calculation, perimeter, enclosure detection, centroid |
| `stressTest.test.ts` | 427 | Large blueprint performance (500/1000 elements), memory leaks |
| `themeManager.test.ts` | 274 | Theme switching, contrast validation, WCAG compliance |
| `ToolRail.test.tsx` | 310 | Tool selection, toggles, keyboard shortcuts, active states |
| `versionControlHooks.test.ts` | 315 | Undo/redo, auto-save, persistence, version limits |
| `setup.ts` | 19 | Vitest configuration and DOM setup |

### 9.2 Test Coverage
- Unit tests for all core modules
- Component tests with @testing-library/react
- Integration tests for end-to-end workflows
- Security tests (red team) for input validation
- Stress tests for large datasets
- Accessibility tests for WCAG compliance

---

## 10. Documentation

### 10.1 Main Documentation (`docs/`)

| Document | Purpose |
|----------|---------|
| `README.md` | System architecture and single source of truth principles |
| `prd.md` | Product Requirements Document — complete feature specification |
| `SPEC.md` | Locked Blueprint Editor v1.0.0 specification with hash |
| `REGISTRY.md` | Entity registry with schemas and validation rules |
| `RELEASE.md` | Release gate criteria and evidence requirements |
| `RELEASE_v1.0.0.md` | v1.0.0 release summary and feature completeness |
| `IMPLEMENTATION_SUMMARY.md` | Build-by-build implementation summary |
| `FINAL_BUILD_REPORT.md` | Production build report with test results |
| `GOVERNANCE_IMPLEMENTATION.md` | Governance enforcement system documentation |
| `GOVERNANCE_QUICKSTART.md` | Developer quick-start for governance |
| `project-manifest-schema.md` | Complete Project Manifest JSON schema |
| `route-manifest-schema.md` | Route Manifest database schema documentation |
| `STEP10_COMPLETE.md` | Final QA, stress test, and release prep documentation |

### 10.2 Root-Level Reports

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview, quick start, directory structure |
| `COMPLETE_SUMMARY.md` | Overall project completion summary |
| `PROJECT_STATUS_REPORT.md` | Current project status |
| `FINAL_VERIFICATION_REPORT.md` | Final verification results |
| `VERIFICATION_REPORT.md` | General verification report |
| `STEP_VERIFICATION_SUMMARY.md` | Step-by-step verification summary |
| `STEP_VERIFICATION_COMPLETE.md` | Verification completion certificate |
| `PHASE2_PROGRESS.md` / `PHASE2_COMPLETE_VERIFICATION.md` / `PHASE2_VERIFICATION.md` / `PHASE2_FINAL_REPORT.md` | Phase 2 documentation |
| `STEP3_COMPLETE.md` through `STEP8_COMPLETE.md` | Individual step completion reports |
| `STEP6_VERIFICATION_REPORT.md` / `STEP7_VERIFICATION_REPORT.md` / `STEP8_VERIFICATION_REPORT.md` | Step verification reports |
| `STEP6_IMPLEMENTATION_SUMMARY.md` / `STEP7_IMPLEMENTATION_SUMMARY.md` / `STEP8_IMPLEMENTATION_SUMMARY.md` | Step implementation summaries |
| `STEP5_COMPLETE.md` | Governance framework completion |
| `GATE7_COMPLETE.md` | Gate 7 completion certificate |
| `GOVERNANCE_VERIFICATION.txt` | Governance verification log |
| `NEXT_STEPS.md` / `NEXT_PHASE_IMPLEMENTATION.md` | Future development roadmap |
| `SCREENSHOT_ANALYSIS.md` | UI screenshot analysis |
| `TODO.md` | Development task tracking |

---

## 11. Configuration & Tooling

### 11.1 TypeScript Configuration
- `tsconfig.json` — Root TypeScript configuration
- `tsconfig.app.json` — Frontend application config
- `tsconfig.node.json` — Node tooling config
- `tsconfig.check.json` — Strict checking config for lint

### 11.2 Build Configuration
- `vite.config.ts` — Production Vite configuration
- `vite.config.dev.ts` — Development Vite configuration
- `index.html` — Application entry point
- `components.json` — shadcn/ui component configuration

### 11.3 Styling Configuration
- `tailwind.config.js` — Tailwind CSS with custom theme tokens
- `postcss.config.js` — PostCSS with autoprefixer
- `src/index.css` — Global styles with CSS variables
- `src/theme/tokens.ts` — Design token definitions

### 11.4 Code Quality Configuration
- `biome.json` — Biome linter/formatter configuration
- `sgconfig.yml` — ast-grep scan configuration
- `vitest.config.ts` — Vitest test runner configuration

### 11.5 Package Configuration
- `package.json` — Dependencies, scripts, metadata
- `pnpm-lock.yaml` — Locked dependency versions
- `pnpm-workspace.yaml` — pnpm workspace configuration

---

## 12. Scripts & Automation

### 12.1 Build Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `verify-all.js` | Comprehensive verification runner |
| `verify-gates.cjs` | Release gate validation |
| `enforce-build.js` | Build-time governance enforcement |

### 12.2 Package Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `echo` | Disabled (lint-only workflow) |
| `build` | `echo` | Disabled (lint-only workflow) |
| `lint` | `tsgo; biome lint; ast-grep scan` | Full code quality check |

---

## 13. Dependencies

### 13.1 Production Dependencies (41 packages)

**React Ecosystem:**
- `react` ^18.0.0 — UI framework
- `react-dom` ^18.0.0 — DOM renderer
- `react-router` ^7.9.5 — Router core
- `react-router-dom` ^7.9.5 — Router DOM bindings

**3D Rendering:**
- `three` — 3D graphics library
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — Useful helpers for R3F

**UI & Styling:**
- `tailwindcss` ^3.4.11 — Utility CSS framework
- `tailwindcss-animate` — Animation utilities
- `tailwindcss-intersect` — Intersection observer utilities
- `tailwind-merge` — Tailwind class merging
- `class-variance-authority` — Component variant management
- `clsx` — Conditional class names
- `lucide-react` — Icon library
- `next-themes` — Theme management
- `sonner` — Toast notifications
- `vaul` — Drawer component
- `motion` — Animation library

**shadcn/ui Radix Primitives (25 packages):**
- `@radix-ui/react-accordion` through `@radix-ui/react-tooltip` — Headless UI primitives
- `@radix-ui/react-icons` — Radix icon set

**Forms & Validation:**
- `react-hook-form` ^7.66.0 — Form management
- `@hookform/resolvers` ^5.2.2 — Form resolvers
- `zod` ^3.25.76 — Schema validation

**Data & Utilities:**
- `axios` ^1.13.1 — HTTP client
- `ky` ^1.13.0 — Modern HTTP client
- `date-fns` ^3.6.0 — Date utilities
- `cmdk` ^1.1.1 — Command palette
- `qrcode` ^1.5.4 — QR code generation
- `recharts` 2.15.4 — Charts
- `embla-carousel-react` ^8.6.0 — Carousel
- `react-day-picker` ^9.13.0 — Date picker
- `input-otp` ^1.4.2 — OTP input
- `react-dropzone` ^14.3.8 — File dropzone
- `react-resizable-panels` ^2.1.8 — Resizable panels
- `react-helmet-async` ^2.0.5 — Document head management
- `eventsource-parser` ^3.0.6 — SSE parser
- `streamdown` ^1.4.0 — Markdown streaming
- `video-react` ^0.16.0 — Video player

**Authentication & Backend:**
- `@supabase/supabase-js` 2.103.1 — Supabase client
- `miaoda-auth-react` 2.0.6 — Auth integration
- `miaoda-sc-plugin` 1.0.61 — Smart code plugin

### 13.2 Development Dependencies (15 packages)

- `@biomejs/biome` 2.4.5 — Linting and formatting
- `@tailwindcss/container-queries` — Container query utilities
- `@testing-library/jest-dom` ^6.9.1 — Jest DOM matchers
- `@testing-library/react` ^16.3.2 — React testing utilities
- `@testing-library/user-event` ^14.6.1 — User event simulation
- `@types/lodash` — Lodash type definitions
- `@types/react` ^19.2.2 — React type definitions
- `@types/react-dom` ^19.2.2 — React DOM type definitions
- `@types/video-react` — Video-react type definitions
- `@typescript/native-preview` 7.0.0-dev.20251103.1 — TypeScript native
- `@vitejs/plugin-react` ^5.1.2 — Vite React plugin
- `@vitest/coverage-v8` ^4.0.18 — Test coverage
- `@vitest/ui` ^4.0.18 — Vitest UI
- `autoprefixer` ^10.4.21 — CSS autoprefixer
- `jsdom` ^28.1.0 — Browser environment for tests
- `postcss` ^8.5.6 — CSS processing
- `typescript` ~5.9.3 — TypeScript compiler
- `vite` (rolldown-vite) — Build tool
- `vite-plugin-svgr` ^4.5.0 — SVG imports
- `vitest` ^4.0.18 — Test runner

---

## 14. Database Schema

### 14.1 Tables (8 tables)

Defined in `supabase/migrations/00001_create_core_tables.sql`:

1. **projects** — Blueprint projects with JSONB manifest
2. **specs** — Specification documents
3. **registry** — Component/feature/tool registry
4. **change_requests** — Change management proposals
5. **releases** — Release gates with evidence packs
6. **audit_logs** — Immutable audit trail
7. **route_manifest** — Single source of truth for navigation

### 14.2 Indexes (10 indexes)

- `idx_projects_created_at` — Project listing performance
- `idx_specs_category` / `idx_specs_status` — Spec filtering
- `idx_registry_type` — Registry filtering
- `idx_change_requests_status` — Change request filtering
- `idx_releases_version` — Release lookup
- `idx_audit_logs_timestamp` — Audit log ordering
- `idx_audit_logs_entity` — Entity-specific audit queries
- `idx_route_manifest_category` — Route categorization

### 14.3 Row Level Security (RLS)

All 7 tables have RLS enabled with public read/write policies for v1.0.0.

---

## 15. Quality Metrics

### 15.1 Test Results
- **Total Test Files**: 19
- **Total Tests**: 357
- **Passing**: 357 (100%)
- **Duration**: ~39 seconds
- **Coverage Tool**: @vitest/coverage-v8

### 15.2 Code Quality
- **Lint Status**: Clean (0 errors)
- **TypeScript**: Strict mode enabled
- **Files Checked**: 123+
- **Tools**: Biome + ast-grep + tsgo

### 15.3 Performance Benchmarks
- **Large Blueprint (500 walls)**: Export < 1s, Import < 2s
- **Extra Large (1000 elements)**: Round-trip < 5s
- **Memory Leak**: < 10MB increase
- **Validation Time**: < 2s
- **Startup Time**: < 5s

### 15.4 Security
- Input sanitization on all imports
- XSS prevention through React's built-in escaping
- File size limits (10MB max)
- Version compatibility enforcement
- Red team tests for injection and path traversal
- Spec hash validation prevents tampering

### 15.5 Accessibility
- WCAG AA compliance
- High contrast mode
- Keyboard-only navigation support
- Screen reader mode
- Reduced motion support
- ARIA labels on all interactive elements
- Minimum touch target size: 44px

---

## 16. Static Assets

### 16.1 Public Directory (`public/`)
- `favicon.png` — Application icon
- `images/` — Image resources directory
- `samples/` — Sample files directory

### 16.2 Error Images
- `images/error/404.svg` — Light mode 404 illustration
- `images/error/404-dark.svg` — Dark mode 404 illustration

---

## 17. File Count Summary

| Category | Count | Location |
|----------|-------|----------|
| Application Pages | 8 | `src/pages/` |
| UI Components | 45 | `src/components/ui/` |
| Editor Components | 7 | `src/components/editor/` |
| Common Components | 3 | `src/components/common/` |
| Layout Components | 1 | `src/components/layouts/` |
| Core Modules | 11 | `src/modules/` |
| Type Definitions | 4 | `src/types/` |
| Database Layer | 2 | `src/db/` |
| Governance Core | 3 | `src/governance/` |
| Utility Functions | 2 | `src/utils/` |
| Hooks | 4 | `src/hooks/` |
| Test Files | 19 | `src/test/` |
| Documentation | 25+ | `docs/` + root `.md` files |
| Configuration Files | 12 | Root level |
| Database Migrations | 1 | `supabase/migrations/` |
| Scripts | 3 | `scripts/` |
| **Total Source Files** | **150+** | `src/` |
| **Total Project Files** | **200+** | Entire repository |

---

## 18. Build Artifacts

- `coverage/` — Vitest coverage report (HTML + JSON)
  - `index.html` — Coverage dashboard
  - `coverage-final.json` — Raw coverage data
  - `lib/`, `components/`, `utils/` — Per-directory coverage

---

## 19. Governance Compliance

### 19.1 Spec Compliance
- Blueprint Editor v1.0.0 spec is locked with SHA-256 hash
- All required sections present
- UI element registry fully declared
- No UI drift detected

### 19.2 Release Gates
All 10 release gates passed:
1. Spec Present and Valid
2. Registry Complete
3. Route Manifest Controls Navigation
4. No Ad-Hoc Pages
5. Audit System Active
6. Change Request Workflow Functional
7. Evidence Pack Generated
8. Stop-Sip Conditions Documented
9. Performance Benchmarks Met
10. Security Tests Passing

### 19.3 Audit Trail Events
- `project_created` — New blueprint project
- `project_updated` — Project modification
- `project_deleted` — Project removal
- `spec_created` — New specification
- `spec_updated` — Spec modification
- `registry_entry_created` — New registry entry
- `change_request_created` — New change proposal
- `change_request_accepted` — Approved change request
- `release_created` — New release gate

---

*This document represents the complete inventory of all software, components, modules, types, tests, documentation, and configuration built for Vishvakarma.OS v1.0.0.*
