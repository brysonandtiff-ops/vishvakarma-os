# Vishvakarma.OS Documentation

## Overview

Vishvakarma.OS is an iPad-first, browser-native architectural blueprint and live 3D studio with strict governance framework. The system provides a unified workspace for 2D blueprint editing with real-time 3D visualization, material application, and solar lighting simulation.

**Product capabilities (audited):** [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md)

**Software inventory (valuation / due diligence):** [SOFTWARE_INVENTORY.md](./SOFTWARE_INVENTORY.md)

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
  sunAzimuth: number; // 0-360 degrees
  sunElevation: number; // 0-90 degrees
  timeOfDay: number; // 0-24 hours
  intensity: number; // 0-1
}
```

## Route Manifest

All routes are defined in the database `route_manifest` table:

```sql
CREATE TABLE route_manifest (
  id UUID PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  component TEXT NOT NULL,
  category TEXT NOT NULL, -- editor, governance, system
  visible BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0
);
```

**No ad-hoc page creation is allowed.** All routes must be registered in the Route Manifest.

## Development Workflow

### Required Process for All Features

1. **Spec Entry** - Create specification in Spec Center
2. **Implementation** - Develop the feature
3. **Registry Entry** - Register component/feature in Registry Center
4. **Test/Evidence** - Create evidence pack
5. **Change Request** - Create and approve change request
6. **Release Gate** - Include in release with evidence

### Stop-Ship Enforcement

The following violations will cause stop-ship:
- Ad-hoc page creation without Route Manifest entry
- Features without corresponding specs
- Changes without approved change requests
- Releases without evidence packs
- Missing audit log entries

## Material System

### Preset Materials

1. **Paint**
   - Color: #FFFFFF
   - Roughness: 0.8
   - Type: paint

2. **Wood**
   - Color: #8B4513
   - Roughness: 0.6
   - Type: wood

3. **Concrete**
   - Color: #808080
   - Roughness: 0.9
   - Type: concrete

## 3D Rendering

### Technology Stack
- React Three Fiber
- Three.js
- @react-three/drei

### Coordinate System
- 2D canvas coordinates are converted to 3D world space
- Y-axis is vertical (height)
- Grid helper shows major grid lines

### Lighting Model
- Ambient light (base illumination)
- Directional light (sun)
- Sun position calculated from azimuth and elevation
- Real-time updates based on solar timeline

## iPad Optimization

### Touch Targets
All interactive elements use `.touch-target` class with minimum 44px size.

### Apple Pencil Support
- Precise cursor for drawing tools
- Canvas supports touch and pencil input
- Pressure sensitivity ready (future enhancement)

### Responsive Layout
- Desktop: Full sidebar navigation
- Mobile/Tablet: Hamburger menu with sheet overlay
- 3D viewport toggleable to maximize canvas space

## Quality Assurance

### Smoke Tests
Critical paths to test:
1. Create new project
2. Draw walls on canvas
3. Toggle 3D view
4. Apply materials
5. Adjust solar lighting
6. Save project
7. Load project
8. Export JSON

### Evidence Pack
Each release must include:
- Test results
- Smoke test validation
- Feature checklist
- Known issues

## Version History

### v1.0.0 (Initial Release)
- 2D blueprint editor with grid
- Wall drawing tool
- Door and window placement
- Live 3D visualization
- Material system (3 presets)
- Solar lighting simulation
- Project save/load
- JSON export
- Governance framework (Spec Center, Registry, Change Requests, Releases)
- Audit log system
- Route manifest

## Explicitly Out of Scope for v1.0.0

- Full BIM capabilities
- Structural engineering calculations
- Plumbing and HVAC systems
- Terrain modeling
- Multi-story buildings
- Photoreal path tracing
- User authentication
- Collaborative editing
- Cloud sync

## Future Enhancements (Post v1.0.0)

- Multi-story support
- Advanced material editor
- Furniture placement
- Dimension annotations
- PDF export
- DXF/DWG import
- Collaborative features
- Cloud storage
- Mobile app
