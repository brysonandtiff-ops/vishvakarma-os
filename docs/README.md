# Vishvakarma.OS Documentation

## Overview

Vishvakarma.OS is an iPad-first, browser-native architectural blueprint and live 3D studio with strict governance framework. The system provides a unified workspace for 2D blueprint editing with real-time 3D visualization, material application, and solar lighting simulation.

**Current production architecture:** [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md)

**Product capabilities (audited):** [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md)

**Software inventory (valuation / due diligence):** [SOFTWARE_INVENTORY.md](./SOFTWARE_INVENTORY.md)

> **Current-state note:** If older inventory or release documents mention Firebase/Supabase as the active dual-backend production path, treat [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md) as the superseding current-state addendum. Current production is Supabase-first/Supabase-only unless a later commit explicitly restores Firebase runtime selection.

## Architecture

### Single Source of Truth Principle

The system follows a strict "single source of truth" architecture:

1. **Project Manifest** - Complete editor state (walls, openings, materials, lighting)
2. **Route Manifest** - All navigation paths (stored in database)
3. **/docs Directory** - All specifications and documentation

### Deterministic State Model

All major actions are logged in the audit system, creating a replayable history:
- Project creation
- Change request acceptance
- Release creation
- Specification updates
- Registry modifications

## Core Components

### 1. Blueprint Editor

**Location**: `/` (root route)

**Features**:
- 2D blueprint canvas with grid system
- Snap-to-grid functionality
- Wall drawing tool
- Door and window placement
- Measurement tool
- Live 3D viewport (toggleable)
- Material picker
- Solar timeline scrubber

**State Management**:
All editor state is stored in the Project Manifest JSON:
```json
{
  "version": "1.0.0",
  "name": "Project Name",
  "walls": [...],
  "openings": [...],
  "materials": [...],
  "lighting": {...},
  "gridSize": 20,
  "snapToGrid": true,
  "metadata": {...}
}
```

### 2. Governance Framework

#### Spec Center (`/spec-center`)
Centralized specification management. All features must have corresponding specs.

**Categories**:
- data-model
- feature
- process
- architecture

**Status**:
- draft
- approved
- deprecated

#### Registry Center (`/registry`)
Component and feature registry tracking all system elements.

**Types**:
- component
- feature
- tool

#### Change Requests (`/change-requests`)
Structured change management workflow. No ad-hoc changes allowed.

**Workflow**:
1. Create change request
2. Review (approve/reject)
3. Implement
4. Include in release

**Priority Levels**:
- low
- medium
- high
- critical

#### Release Center (`/releases`)
Release gate and version control with evidence packs.

**Status**:
- planned
- in_progress
- released

**Requirements**:
- Must include implemented change requests
- Evidence pack for validation
- Version number

#### Audit Log (`/audit`)
Complete audit trail of all system actions.

**Tracked Actions**:
- project_created
- project_updated
- spec_created
- registry_entry_created
- change_request_created
- change_request_accepted
- release_created

## Data Models

### Project Manifest Schema

```typescript
interface ProjectManifest {
  version: string;
  name: string;
  description?: string;
  walls: Wall[];
  openings: Opening[];
  materials: Material[];
  floorMaterial: string;
  lighting: LightingConfig;
  gridSize: number;
  snapToGrid: boolean;
  metadata: {
    created: string;
    modified: string;
    author?: string;
  };
}
```

### Wall Schema

```typescript
interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number;
  height: number;
  material: string;
}
```

### Opening Schema

```typescript
interface Opening {
  id: string;
  type: 'door' | 'window';
  wallId: string;
  position: number; // 0-1 along wall
  width: number;
  height: number;
  sillHeight?: number; // For windows
}
```

### Lighting Configuration Schema

```typescript
interface LightingConfig {
  sunAzimuth: number;
  sunElevation: number;
  timeOfDay: number;
  intensity: number;
}
```
