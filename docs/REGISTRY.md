# REGISTRY.md - Entity Registry and Schema Definitions

## Overview

The Registry defines all canonical entities in Vishvakarma.OS. Every entity must be registered here with complete schema, default values, and validation rules.

**Registry Version**: 1.0.0  
**Manifest Version**: 1.0.0  
**Last Updated**: 2026-02-15

## Registered Entities

### 1. Project

**Purpose**: Top-level container for a blueprint project

**Schema**:
```typescript
interface Project {
  id: string;                    // UUID, auto-generated
  name: string;                  // Required, 1-200 chars
  description?: string;          // Optional, max 1000 chars
  manifest: ProjectManifest;     // Required, see ProjectManifest
  created_at: string;            // ISO8601, auto-generated
  updated_at: string;            // ISO8601, auto-updated
}
```

**Defaults**:
```json
{
  "name": "Untitled Project",
  "description": null,
  "manifest": { /* see ProjectManifest defaults */ }
}
```

**Validation**:
- `name`: non-empty, max 200 chars
- `manifest`: must validate against ProjectManifest schema
- `created_at`, `updated_at`: valid ISO8601

---

### 2. ProjectManifest

**Purpose**: Complete editor state snapshot

**Schema**:
```typescript
interface ProjectManifest {
  version: string;               // Semantic version, e.g., "1.0.0"
  name: string;                  // Project name
  description?: string;          // Optional description
  walls: Wall[];                 // Array of wall segments
  openings: Opening[];           // Array of doors/windows
  materials: Material[];         // Custom materials (presets excluded)
  floorMaterial: string;         // Material ID for floor
  lighting: LightingConfig;      // Solar lighting state
  gridSettings: GridSettings;    // Grid configuration
  viewportState: ViewportState;  // Camera and view state
  metadata: ProjectMetadata;     // Timestamps and author
}
```

**Defaults**:
```json
{
  "version": "1.0.0",
  "name": "Untitled Project",
  "description": null,
  "walls": [],
  "openings": [],
  "materials": [],
  "floorMaterial": "material-concrete",
  "lighting": { /* see LightingConfig defaults */ },
  "gridSettings": { /* see GridSettings defaults */ },
  "viewportState": { /* see ViewportState defaults */ },
  "metadata": {
    "created": "2026-02-15T00:00:00Z",
    "modified": "2026-02-15T00:00:00Z",
    "author": null
  }
}
```

**Validation**:
- `version`: must match supported versions (currently "1.0.0")
- `walls`: each must validate against Wall schema
- `openings`: each must validate against Opening schema
- `materials`: each must validate against Material schema
- `floorMaterial`: must reference valid material ID
- All nested objects must validate against their schemas

---

### 3. GridSettings

**Purpose**: Grid display and snap configuration

**Schema**:
```typescript
interface GridSettings {
  gridSize: number;              // Grid cell size in pixels
  snapToGrid: boolean;           // Enable snap-to-grid
  gridVisible: boolean;          // Show grid overlay
  majorGridInterval: number;     // Major grid line interval (multiples of gridSize)
}
```

**Defaults**:
```json
{
  "gridSize": 20,
  "snapToGrid": true,
  "gridVisible": true,
  "majorGridInterval": 5
}
```

**Validation**:
- `gridSize`: > 0, typically 10-50
- `snapToGrid`: boolean
- `gridVisible`: boolean
- `majorGridInterval`: integer > 0

---

### 4. WallSegment (Wall)

**Purpose**: Single wall segment in floor plan

**Schema**:
```typescript
interface Wall {
  id: string;                    // UUID, unique within project
  start: Point2D;                // Start point in canvas coordinates
  end: Point2D;                  // End point in canvas coordinates
  thickness: number;             // Wall thickness in pixels
  height: number;                // Wall height in centimeters
  material: string;              // Material ID reference
}

interface Point2D {
  x: number;                     // X coordinate in pixels
  y: number;                     // Y coordinate in pixels
}
```

**Defaults**:
```json
{
  "id": "wall-{timestamp}",
  "start": { "x": 0, "y": 0 },
  "end": { "x": 100, "y": 0 },
  "thickness": 10,
  "height": 240,
  "material": "material-paint"
}
```

**Validation**:
- `id`: non-empty, unique
- `start`, `end`: valid Point2D
- Length (distance start to end): >= 10 pixels
- `thickness`: > 0, typically 5-20
- `height`: > 0, typically 200-300 cm
- `material`: must reference existing material

**Geometric Constraints**:
- No zero-length walls
- Coordinates quantized to grid when snap enabled
- No floating-point drift (round to 2 decimals)

---

### 5. Opening

**Purpose**: Door or window opening anchored to a wall

**Schema**:
```typescript
interface Opening {
  id: string;                    // UUID, unique within project
  type: 'door' | 'window';       // Opening type
  wallId: string;                // Reference to parent wall ID
  position: number;              // Parametric position along wall (0-1)
  width: number;                 // Opening width in centimeters
  height: number;                // Opening height in centimeters
  sillHeight?: number;           // Sill height in cm (windows only)
}
```

**Defaults (Door)**:
```json
{
  "id": "door-{timestamp}",
  "type": "door",
  "wallId": "",
  "position": 0.5,
  "width": 90,
  "height": 210,
  "sillHeight": null
}
```

**Defaults (Window)**:
```json
{
  "id": "window-{timestamp}",
  "type": "window",
  "wallId": "",
  "position": 0.5,
  "width": 120,
  "height": 120,
  "sillHeight": 90
}
```

**Validation**:
- `id`: non-empty, unique
- `type`: must be "door" or "window"
- `wallId`: must reference existing wall
- `position`: in range [0, 1]
- `width`, `height`: > 0
- `sillHeight`: >= 0 (required for windows, null for doors)

**Anchor Constraints**:
- Opening must fit within wall length
- Position clamped to valid range
- If wall deleted, opening must be deleted

---

### 6. MaterialPreset

**Purpose**: Predefined material with rendering properties

**Schema**:
```typescript
interface Material {
  id: string;                    // Unique material ID
  name: string;                  // Display name
  type: 'paint' | 'wood' | 'concrete';  // Material category
  color: string;                 // Hex color code
  roughness: number;             // Surface roughness (0-1)
  metalness?: number;            // Metallic property (0-1)
}
```

**Preset Materials**:

1. **Paint**:
```json
{
  "id": "material-paint",
  "name": "Paint",
  "type": "paint",
  "color": "#FFFFFF",
  "roughness": 0.8,
  "metalness": 0
}
```

2. **Wood**:
```json
{
  "id": "material-wood",
  "name": "Wood",
  "type": "wood",
  "color": "#8B4513",
  "roughness": 0.6,
  "metalness": 0
}
```

3. **Concrete**:
```json
{
  "id": "material-concrete",
  "name": "Concrete",
  "type": "concrete",
  "color": "#808080",
  "roughness": 0.9,
  "metalness": 0
}
```

**Validation**:
- `id`: non-empty, unique
- `name`: non-empty
- `type`: valid enum value
- `color`: valid hex color (#RRGGBB)
- `roughness`: in range [0, 1]
- `metalness`: in range [0, 1] if present

---

### 7. EnvironmentState (LightingConfig)

**Purpose**: Solar lighting and time-of-day configuration

**Schema**:
```typescript
interface LightingConfig {
  sunAzimuth: number;            // Sun direction in degrees (0-360)
  sunElevation: number;          // Sun elevation in degrees (0-90)
  timeOfDay: number;             // Time in 24-hour format (0-24)
  intensity: number;             // Light intensity (0-1)
}
```

**Defaults**:
```json
{
  "sunAzimuth": 180,
  "sunElevation": 45,
  "timeOfDay": 12,
  "intensity": 1
}
```

**Validation**:
- `sunAzimuth`: in range [0, 360]
- `sunElevation`: in range [0, 90]
- `timeOfDay`: in range [0, 24]
- `intensity`: in range [0, 1]

**Derived Values**:
- `sunElevation` calculated from `timeOfDay` using sine curve
- 0-6h: elevation = 0 (night)
- 6-18h: elevation = sin((time - 6) / 12 * π) * 90
- 18-24h: elevation = 0 (night)

---

### 8. ViewportState

**Purpose**: 2D canvas camera and view configuration

**Schema**:
```typescript
interface ViewportState {
  panX: number;                  // Pan offset X in pixels
  panY: number;                  // Pan offset Y in pixels
  zoom: number;                  // Zoom level (1.0 = 100%)
  show3DView: boolean;           // Toggle 3D viewport visibility
}
```

**Defaults**:
```json
{
  "panX": 0,
  "panY": 0,
  "zoom": 1.0,
  "show3DView": true
}
```

**Validation**:
- `panX`, `panY`: any number
- `zoom`: > 0, typically 0.1-5.0
- `show3DView`: boolean

---

## Schema Versioning

### Version History

**1.0.0** (2026-02-15):
- Initial schema definition
- 8 core entities
- Basic validation rules

### Migration Notes

**From**: N/A (initial version)  
**To**: 1.0.0

No migration required for initial version.

### Future Migration Strategy

When schema changes:
1. Increment `registry_version`
2. Document breaking changes
3. Provide migration function
4. Support previous version for 2 releases
5. Add deprecation warnings

Example migration (future):
```typescript
function migrate_1_0_to_1_1(manifest: any): ProjectManifest {
  // Add new required field with default
  manifest.newField = defaultValue;
  manifest.version = "1.1.0";
  return manifest;
}
```

---

## Runtime Validation

### Validation Levels

1. **Schema Validation**: Type checking and required fields
2. **Constraint Validation**: Range checks and business rules
3. **Reference Validation**: Foreign key integrity
4. **Geometric Validation**: Spatial constraints

### Validation Errors

**Error Format**:
```typescript
interface ValidationError {
  entity: string;                // Entity type
  field: string;                 // Field name
  value: any;                    // Invalid value
  rule: string;                  // Violated rule
  message: string;               // Human-readable error
}
```

**Example**:
```json
{
  "entity": "Wall",
  "field": "thickness",
  "value": -5,
  "rule": "thickness > 0",
  "message": "Wall thickness must be greater than 0"
}
```

### Validation Timing

- **On Load**: Validate entire manifest before accepting
- **On Save**: Validate before persisting
- **On Edit**: Validate individual entities on change
- **On Release**: Full validation suite in CI

---

## Registry Mismatch Handling

If workspace state contains keys not in schema:

1. **Block Save**: Prevent data corruption
2. **Show Error**: List unknown keys
3. **Offer Fix**: Remove unknown keys or update schema
4. **Log Warning**: Audit unknown keys for future schema updates

**Error Message**:
```
Registry Mismatch Detected

The following fields are not defined in the schema:
- walls[0].unknownField
- lighting.invalidProperty

Actions:
1. Remove these fields and save
2. Update schema to include these fields
3. Cancel and review changes
```

---

## Sample Project Validation

**Sample Project**: `public/samples/sample-house-01.json`

**Validation Requirements**:
- Must validate against all schemas
- Must load without errors
- Must render correctly in 2D and 3D
- Must save and reload identically

**CI Check**:
```bash
npm run validate:sample
# Validates sample-house-01.json against registry schemas
# Exit code 0 = pass, 1 = fail
```

---

## Evidence Requirements

For each release:
1. Registry Center screenshot showing all entities
2. Sample project validation logs
3. Schema version compatibility matrix
4. Migration test results (if applicable)
