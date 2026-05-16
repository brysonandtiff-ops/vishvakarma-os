# SPEC.md - Vishvakarma.OS Specifications

## Blueprint Editor v1.0.0 [LOCKED]

**Version**: 1.0.0  
**Status**: LOCKED  
**Last Updated**: 2026-02-15  
**Spec Hash**: `sha256:blueprint-editor-v1.0.0`

### Overview
The Blueprint Editor is the core workspace for creating architectural floor plans with real-time 3D visualization. It follows an "Architect's Table" design philosophy with warm, tactile controls optimized for iPad use.

### Required UI Regions

1. **Left Navigation** (64px width)
   - App-wide navigation sidebar
   - Links to governance pages
   - Version display
   - Persistent across all pages

2. **Tool Dock** (64px width, left side of editor)
   - Select Tool (V)
   - Wall Tool (W)
   - Door Tool (D)
   - Window Tool (N)
   - Measure Tool (M)
   - Grid Toggle
   - Snap Toggle
   - 3D View Toggle

3. **Canvas** (flexible, center)
   - 2D blueprint drawing surface
   - Grid overlay (20px default, configurable)
   - Snap indicators
   - Wall segments with thickness
   - Opening markers
   - Selection highlights
   - Measurement overlays

4. **Properties Panel** (320px width, right side)
   - Material Picker (3 presets: paint, wood, concrete)
   - Solar Timeline Scrubber
   - Sun direction control (azimuth 0-360°)
   - Time of day slider (0-24 hours)
   - Light intensity control (0-1)

5. **Status Bar / Version Display** (top bar)
   - Current project name
   - Project ID (first 8 chars)
   - Action buttons: New, Load, Save, Export JSON
   - Spec version indicator

### Tool List

#### 1. Select Tool (V)
- **Purpose**: Select and manipulate existing elements
- **Interactions**:
  - Click wall: select wall (highlight in primary color)
  - Click opening: select opening
  - Click empty: deselect all
  - Drag selected: move element (if supported)
- **Constraints**: Cannot create new elements

#### 2. Wall Tool (W)
- **Purpose**: Draw wall segments
- **Interactions**:
  - Click canvas: start wall
  - Move mouse: preview wall with dashed line
  - Click again: end wall and commit
  - ESC: cancel current wall
- **Snap Rules**:
  - Snap to grid when enabled (default: 20px)
  - Snap to existing wall endpoints (within 10px)
  - Show snap indicator (circle) at snap points
- **Defaults**:
  - Thickness: 10px (canvas units)
  - Height: 240cm (8 feet)
  - Material: material-paint
- **Validation**:
  - Minimum length: 10px
  - No zero-length walls
  - Store exact coordinates (no floating-point drift)

#### 3. Door Tool (D)
- **Purpose**: Place door openings on walls
- **Interactions**:
  - Click wall: place door at click position
  - Drag along wall: adjust position (parametric 0-1)
  - Click opening: select for editing
- **Defaults**:
  - Width: 90cm
  - Height: 210cm
  - Type: door
- **Constraints**:
  - Must anchor to existing wall
  - Position clamped to [0, 1] along wall
  - Cannot exceed wall length

#### 4. Window Tool (N)
- **Purpose**: Place window openings on walls
- **Interactions**:
  - Click wall: place window at click position
  - Drag along wall: adjust position
- **Defaults**:
  - Width: 120cm
  - Height: 120cm
  - Sill height: 90cm
  - Type: window
- **Constraints**:
  - Must anchor to existing wall
  - Position clamped to [0, 1] along wall

#### 5. Measure Tool (M)
- **Purpose**: Display dimensions and measurements
- **Interactions**:
  - Hover wall: show length
  - Hover opening: show width × height
  - Click two points: show distance
- **Display**: Measurements in canvas pixels with conversion to real units

### Interaction Rules

#### Grid and Snap Rules
1. **Grid System**:
   - Default size: 20px
   - Major grid every 5 units (100px)
   - Minor grid lines: light gray (#E5E5E5)
   - Major grid lines: primary color at 20% opacity

2. **Snap Behavior**:
   - When enabled: quantize all points to grid
   - Snap priority: endpoints > grid > free
   - Snap threshold: 10px
   - Visual feedback: snap indicator circle (8px radius)

3. **Touch Targets**:
   - Minimum size: 44px × 44px (iPad standard)
   - Tool buttons: 48px × 48px
   - Selectable elements: 10px hit radius

#### Canvas Controls
1. **Pan**: Two-finger drag or middle mouse button
2. **Zoom**: Pinch gesture or scroll wheel
3. **Draw**: Single tap/click with active tool
4. **Select**: Single tap/click with Select tool
5. **Undo/Redo**: Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)

#### Apple Pencil Support
- Pencil treated as precise pointer
- Pressure sensitivity: reserved for future use
- Tilt: not used in v1.0.0
- Hover: shows snap preview

### File Format: Project Manifest

The Project Manifest is the single source of truth for all editor state.

**Schema Version**: 1.0.0

**Required Fields**:
```json
{
  "version": "1.0.0",
  "name": "string (required)",
  "description": "string (optional)",
  "walls": "Wall[] (required)",
  "openings": "Opening[] (required)",
  "materials": "Material[] (required)",
  "floorMaterial": "string (required)",
  "lighting": "LightingConfig (required)",
  "gridSize": "number (required)",
  "snapToGrid": "boolean (required)",
  "metadata": {
    "created": "ISO8601 string (required)",
    "modified": "ISO8601 string (required)",
    "author": "string (optional)"
  }
}
```

**Wall Schema**:
```json
{
  "id": "string (uuid)",
  "start": { "x": "number", "y": "number" },
  "end": { "x": "number", "y": "number" },
  "thickness": "number (pixels)",
  "height": "number (cm)",
  "material": "string (material ID)"
}
```

**Opening Schema**:
```json
{
  "id": "string (uuid)",
  "type": "door | window",
  "wallId": "string (wall ID reference)",
  "position": "number (0-1 parametric)",
  "width": "number (cm)",
  "height": "number (cm)",
  "sillHeight": "number (cm, windows only)"
}
```

**LightingConfig Schema**:
```json
{
  "sunAzimuth": "number (0-360 degrees)",
  "sunElevation": "number (0-90 degrees)",
  "timeOfDay": "number (0-24 hours)",
  "intensity": "number (0-1)"
}
```

### Validation Rules

1. **Schema Validation**:
   - All required fields must be present
   - Field types must match schema
   - IDs must be unique within type
   - References must resolve (wallId → wall exists)

2. **Geometric Validation**:
   - Wall length > 10px
   - Wall thickness > 0
   - Wall height > 0
   - Opening position in [0, 1]
   - Opening dimensions > 0

3. **Material Validation**:
   - Material IDs must exist (preset or custom)
   - Floor material must be valid

4. **Lighting Validation**:
   - sunAzimuth in [0, 360]
   - sunElevation in [0, 90]
   - timeOfDay in [0, 24]
   - intensity in [0, 1]

### 2D/3D Synchronization Rules

1. **Deterministic Rendering**:
   - Same manifest → identical 2D and 3D output
   - No random elements
   - No time-based variations (except lighting)

2. **Update Latency**:
   - 2D updates: immediate (< 16ms)
   - 3D updates: < 200ms
   - Debounce rapid changes

3. **Coordinate Mapping**:
   - 2D canvas: pixels from top-left
   - 3D world: meters, Y-up, centered at origin
   - Conversion: `world = (canvas - center) / 100`

### Material Presets

1. **Paint** (material-paint):
   - Color: #FFFFFF
   - Roughness: 0.8
   - Metalness: 0

2. **Wood** (material-wood):
   - Color: #8B4513
   - Roughness: 0.6
   - Metalness: 0

3. **Concrete** (material-concrete):
   - Color: #808080
   - Roughness: 0.9
   - Metalness: 0

### Stop-Ship Conditions

1. **Spec Drift**: Any UI element not declared in this spec
2. **Schema Violation**: Manifest fails validation
3. **2D/3D Mismatch**: Same manifest produces different outputs
4. **Data Loss**: Save/load does not preserve exact state
5. **Touch Target Violation**: Any interactive element < 44px
6. **Performance**: 3D update > 500ms on target hardware

### Change Control

- **Spec Changes**: Require approved Change Request
- **Version Bump**: Any breaking change increments minor version
- **Backward Compatibility**: Must support previous manifest versions
- **Migration Path**: Document upgrade process for each version

### Evidence Requirements

For each release, provide:
1. Screenshot of all UI regions
2. Sample project JSON
3. Save/load test results
4. 2D/3D parity verification
5. Touch target audit
6. Performance metrics (iPad Air 2020)

---

## Spec Hash Calculation

The spec hash is calculated from the canonical content of this Blueprint Editor section:
- Tool list
- Interaction rules
- File format schema
- Validation rules

**Current Hash**: `e8f4a2b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5`

Any change to the above sections invalidates the hash and requires:
1. New Change Request
2. Spec review and approval
3. Hash recalculation
4. Version bump
5. Release gate validation
