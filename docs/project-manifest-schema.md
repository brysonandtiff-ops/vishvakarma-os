# Project Manifest Schema

## Overview

The Project Manifest is the single source of truth for all editor state in Vishvakarma.OS. It is stored as a JSONB column in the database and can be exported as a standalone JSON file.

## Schema Version

Current version: `1.0.0`

## Complete Schema

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

interface Point2D {
  x: number;
  y: number;
}

interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number;
  height: number;
  material: string;
}

interface Opening {
  id: string;
  type: 'door' | 'window';
  wallId: string;
  position: number; // 0-1 along wall
  width: number;
  height: number;
  sillHeight?: number; // For windows only
}

interface Material {
  id: string;
  name: string;
  type: 'paint' | 'wood' | 'concrete';
  color: string;
  roughness: number;
  metalness?: number;
}

interface LightingConfig {
  sunAzimuth: number; // 0-360 degrees
  sunElevation: number; // 0-90 degrees
  timeOfDay: number; // 0-24 hours
  intensity: number; // 0-1
}
```

## Field Descriptions

### Root Level

- `version` (string, required): Schema version for compatibility
- `name` (string, required): Project name
- `description` (string, optional): Project description
- `walls` (Wall[], required): Array of wall definitions
- `openings` (Opening[], required): Array of door/window openings
- `materials` (Material[], required): Custom materials (presets not included)
- `floorMaterial` (string, required): Material ID for floor
- `lighting` (LightingConfig, required): Solar lighting configuration
- `gridSize` (number, required): Grid size in pixels
- `snapToGrid` (boolean, required): Snap-to-grid enabled
- `metadata` (object, required): Project metadata

### Wall

- `id` (string, required): Unique wall identifier
- `start` (Point2D, required): Starting point in canvas coordinates
- `end` (Point2D, required): Ending point in canvas coordinates
- `thickness` (number, required): Wall thickness in pixels
- `height` (number, required): Wall height in centimeters
- `material` (string, required): Material ID reference

### Opening

- `id` (string, required): Unique opening identifier
- `type` (enum, required): 'door' or 'window'
- `wallId` (string, required): Reference to parent wall
- `position` (number, required): Position along wall (0.0 to 1.0)
- `width` (number, required): Opening width in centimeters
- `height` (number, required): Opening height in centimeters
- `sillHeight` (number, optional): Height from floor to window sill (windows only)

### Material

- `id` (string, required): Unique material identifier
- `name` (string, required): Display name
- `type` (enum, required): 'paint', 'wood', or 'concrete'
- `color` (string, required): Hex color code
- `roughness` (number, required): Surface roughness (0.0 to 1.0)
- `metalness` (number, optional): Metallic property (0.0 to 1.0)

### LightingConfig

- `sunAzimuth` (number, required): Sun direction in degrees (0-360)
- `sunElevation` (number, required): Sun elevation in degrees (0-90)
- `timeOfDay` (number, required): Time in 24-hour format (0-24)
- `intensity` (number, required): Light intensity (0.0 to 1.0)

## Example

```json
{
  "version": "1.0.0",
  "name": "Sample House",
  "description": "A simple single-room house",
  "walls": [
    {
      "id": "wall-1",
      "start": { "x": 100, "y": 100 },
      "end": { "x": 500, "y": 100 },
      "thickness": 10,
      "height": 240,
      "material": "material-concrete"
    }
  ],
  "openings": [
    {
      "id": "door-1",
      "type": "door",
      "wallId": "wall-1",
      "position": 0.5,
      "width": 90,
      "height": 210
    }
  ],
  "materials": [],
  "floorMaterial": "material-concrete",
  "lighting": {
    "sunAzimuth": 180,
    "sunElevation": 45,
    "timeOfDay": 12,
    "intensity": 1
  },
  "gridSize": 20,
  "snapToGrid": true,
  "metadata": {
    "created": "2026-02-15T00:00:00Z",
    "modified": "2026-02-15T12:00:00Z",
    "author": "Architect"
  }
}
```

## Validation Rules

1. All IDs must be unique within their type
2. Wall thickness must be > 0
3. Wall height must be > 0
4. Opening position must be between 0 and 1
5. Opening wallId must reference an existing wall
6. Material references must exist (either preset or custom)
7. Lighting values must be within specified ranges
8. Grid size must be > 0

## Preset Material IDs

- `material-paint`: White paint
- `material-wood`: Brown wood
- `material-concrete`: Gray concrete

## Migration Strategy

When schema version changes:
1. Check `version` field
2. Apply migration transformations
3. Update `version` to current
4. Save migrated manifest

## Storage

- Database: JSONB column in `projects` table
- Export: Standalone JSON file
- Import: Parse and validate against schema
