// Registry schema definitions and validation
import type { ProjectManifest, Wall, Opening, Material, LightingConfig } from '@/types';

// Registry version
export const REGISTRY_VERSION = '1.0.0';
export const MANIFEST_VERSION = '1.0.0';

// Validation error type
export interface ValidationError {
  entity: string;
  field: string;
  value: unknown;
  rule: string;
  message: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Point2D validation
export function validatePoint2D(point: { x: number; y: number }, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (typeof point.x !== 'number' || Number.isNaN(point.x)) {
    errors.push({
      entity: 'Point2D',
      field: `${fieldName}.x`,
      value: point.x,
      rule: 'must be a number',
      message: `${fieldName}.x must be a valid number`,
    });
  }
  
  if (typeof point.y !== 'number' || Number.isNaN(point.y)) {
    errors.push({
      entity: 'Point2D',
      field: `${fieldName}.y`,
      value: point.y,
      rule: 'must be a number',
      message: `${fieldName}.y must be a valid number`,
    });
  }
  
  return errors;
}

// Wall validation
export function validateWall(wall: Wall, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // ID validation
  if (!wall.id || typeof wall.id !== 'string') {
    errors.push({
      entity: 'Wall',
      field: `walls[${index}].id`,
      value: wall.id,
      rule: 'non-empty string',
      message: 'Wall ID must be a non-empty string',
    });
  }
  
  // Point validation
  errors.push(...validatePoint2D(wall.start, `walls[${index}].start`));
  errors.push(...validatePoint2D(wall.end, `walls[${index}].end`));
  
  // Length validation
  const length = Math.sqrt(
    Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
  );
  if (length < 10) {
    errors.push({
      entity: 'Wall',
      field: `walls[${index}].length`,
      value: length,
      rule: 'length >= 10',
      message: 'Wall length must be at least 10 pixels',
    });
  }
  
  // Thickness validation
  if (wall.thickness <= 0) {
    errors.push({
      entity: 'Wall',
      field: `walls[${index}].thickness`,
      value: wall.thickness,
      rule: 'thickness > 0',
      message: 'Wall thickness must be greater than 0',
    });
  }
  
  // Height validation
  if (wall.height <= 0) {
    errors.push({
      entity: 'Wall',
      field: `walls[${index}].height`,
      value: wall.height,
      rule: 'height > 0',
      message: 'Wall height must be greater than 0',
    });
  }
  
  // Material validation
  if (!wall.material || typeof wall.material !== 'string') {
    errors.push({
      entity: 'Wall',
      field: `walls[${index}].material`,
      value: wall.material,
      rule: 'non-empty string',
      message: 'Wall material must be a non-empty string',
    });
  }
  
  return errors;
}

// Opening validation
export function validateOpening(opening: Opening, index: number, walls: Wall[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // ID validation
  if (!opening.id || typeof opening.id !== 'string') {
    errors.push({
      entity: 'Opening',
      field: `openings[${index}].id`,
      value: opening.id,
      rule: 'non-empty string',
      message: 'Opening ID must be a non-empty string',
    });
  }
  
  // Type validation
  if (opening.type !== 'door' && opening.type !== 'window') {
    errors.push({
      entity: 'Opening',
      field: `openings[${index}].type`,
      value: opening.type,
      rule: 'must be "door" or "window"',
      message: 'Opening type must be "door" or "window"',
    });
  }
  
  // Wall reference validation
  const wallExists = walls.some(w => w.id === opening.wallId);
  if (!wallExists) {
    errors.push({
      entity: 'Opening',
      field: `openings[${index}].wallId`,
      value: opening.wallId,
      rule: 'must reference existing wall',
      message: `Opening references non-existent wall: ${opening.wallId}`,
    });
  }
  
  // Position validation
  if (opening.position < 0 || opening.position > 1) {
    errors.push({
      entity: 'Opening',
      field: `openings[${index}].position`,
      value: opening.position,
      rule: 'position in [0, 1]',
      message: 'Opening position must be between 0 and 1',
    });
  }
  
  // Dimension validation
  if (opening.width <= 0) {
    errors.push({
      entity: 'Opening',
      field: `openings[${index}].width`,
      value: opening.width,
      rule: 'width > 0',
      message: 'Opening width must be greater than 0',
    });
  }
  
  if (opening.height <= 0) {
    errors.push({
      entity: 'Opening',
      field: `openings[${index}].height`,
      value: opening.height,
      rule: 'height > 0',
      message: 'Opening height must be greater than 0',
    });
  }
  
  // Sill height validation for windows
  if (opening.type === 'window') {
    if (opening.sillHeight === undefined || opening.sillHeight === null) {
      errors.push({
        entity: 'Opening',
        field: `openings[${index}].sillHeight`,
        value: opening.sillHeight,
        rule: 'required for windows',
        message: 'Window must have sillHeight',
      });
    } else if (opening.sillHeight < 0) {
      errors.push({
        entity: 'Opening',
        field: `openings[${index}].sillHeight`,
        value: opening.sillHeight,
        rule: 'sillHeight >= 0',
        message: 'Window sillHeight must be >= 0',
      });
    }
  }
  
  return errors;
}

// Material validation
export function validateMaterial(material: Material, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // ID validation
  if (!material.id || typeof material.id !== 'string') {
    errors.push({
      entity: 'Material',
      field: `materials[${index}].id`,
      value: material.id,
      rule: 'non-empty string',
      message: 'Material ID must be a non-empty string',
    });
  }
  
  // Name validation
  if (!material.name || typeof material.name !== 'string') {
    errors.push({
      entity: 'Material',
      field: `materials[${index}].name`,
      value: material.name,
      rule: 'non-empty string',
      message: 'Material name must be a non-empty string',
    });
  }
  
  // Type validation
  if (!['paint', 'wood', 'concrete', 'stone', 'tile', 'metal', 'glass', 'custom'].includes(material.type)) {
    errors.push({
      entity: 'Material',
      field: `materials[${index}].type`,
      value: material.type,
      rule: 'must be paint, wood, concrete, stone, tile, metal, glass, or custom',
      message: 'Material type must be paint, wood, concrete, stone, tile, metal, glass, or custom',
    });
  }
  
  // Color validation (hex format)
  if (!/^#[0-9A-Fa-f]{6}$/.test(material.color)) {
    errors.push({
      entity: 'Material',
      field: `materials[${index}].color`,
      value: material.color,
      rule: 'valid hex color',
      message: 'Material color must be valid hex format (#RRGGBB)',
    });
  }
  
  // Roughness validation
  if (material.roughness < 0 || material.roughness > 1) {
    errors.push({
      entity: 'Material',
      field: `materials[${index}].roughness`,
      value: material.roughness,
      rule: 'roughness in [0, 1]',
      message: 'Material roughness must be between 0 and 1',
    });
  }
  
  // Metalness validation (if present)
  if (material.metalness !== undefined && (material.metalness < 0 || material.metalness > 1)) {
    errors.push({
      entity: 'Material',
      field: `materials[${index}].metalness`,
      value: material.metalness,
      rule: 'metalness in [0, 1]',
      message: 'Material metalness must be between 0 and 1',
    });
  }
  
  return errors;
}

// Lighting validation
export function validateLighting(lighting: LightingConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (lighting.sunAzimuth < 0 || lighting.sunAzimuth > 360) {
    errors.push({
      entity: 'LightingConfig',
      field: 'lighting.sunAzimuth',
      value: lighting.sunAzimuth,
      rule: 'sunAzimuth in [0, 360]',
      message: 'Sun azimuth must be between 0 and 360 degrees',
    });
  }
  
  if (lighting.sunElevation < 0 || lighting.sunElevation > 90) {
    errors.push({
      entity: 'LightingConfig',
      field: 'lighting.sunElevation',
      value: lighting.sunElevation,
      rule: 'sunElevation in [0, 90]',
      message: 'Sun elevation must be between 0 and 90 degrees',
    });
  }
  
  if (lighting.timeOfDay < 0 || lighting.timeOfDay > 24) {
    errors.push({
      entity: 'LightingConfig',
      field: 'lighting.timeOfDay',
      value: lighting.timeOfDay,
      rule: 'timeOfDay in [0, 24]',
      message: 'Time of day must be between 0 and 24 hours',
    });
  }
  
  if (lighting.intensity < 0 || lighting.intensity > 1) {
    errors.push({
      entity: 'LightingConfig',
      field: 'lighting.intensity',
      value: lighting.intensity,
      rule: 'intensity in [0, 1]',
      message: 'Light intensity must be between 0 and 1',
    });
  }
  
  return errors;
}

// Full manifest validation
export function validateManifest(manifest: ProjectManifest): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Version validation
  if (manifest.version !== MANIFEST_VERSION) {
    errors.push({
      entity: 'ProjectManifest',
      field: 'version',
      value: manifest.version,
      rule: `must be ${MANIFEST_VERSION}`,
      message: `Manifest version must be ${MANIFEST_VERSION}`,
    });
  }
  
  // Name validation
  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push({
      entity: 'ProjectManifest',
      field: 'name',
      value: manifest.name,
      rule: 'non-empty string',
      message: 'Project name must be a non-empty string',
    });
  }
  
  // Walls validation
  if (!Array.isArray(manifest.walls)) {
    errors.push({
      entity: 'ProjectManifest',
      field: 'walls',
      value: manifest.walls,
      rule: 'must be array',
      message: 'Walls must be an array',
    });
  } else {
    manifest.walls.forEach((wall, index) => {
      errors.push(...validateWall(wall, index));
    });
    
    // Check for duplicate IDs
    const wallIds = new Set<string>();
    manifest.walls.forEach((wall, index) => {
      if (wallIds.has(wall.id)) {
        errors.push({
          entity: 'Wall',
          field: `walls[${index}].id`,
          value: wall.id,
          rule: 'unique ID',
          message: `Duplicate wall ID: ${wall.id}`,
        });
      }
      wallIds.add(wall.id);
    });
  }
  
  // Openings validation
  if (!Array.isArray(manifest.openings)) {
    errors.push({
      entity: 'ProjectManifest',
      field: 'openings',
      value: manifest.openings,
      rule: 'must be array',
      message: 'Openings must be an array',
    });
  } else {
    manifest.openings.forEach((opening, index) => {
      errors.push(...validateOpening(opening, index, manifest.walls));
    });
    
    // Check for duplicate IDs
    const openingIds = new Set<string>();
    manifest.openings.forEach((opening, index) => {
      if (openingIds.has(opening.id)) {
        errors.push({
          entity: 'Opening',
          field: `openings[${index}].id`,
          value: opening.id,
          rule: 'unique ID',
          message: `Duplicate opening ID: ${opening.id}`,
        });
      }
      openingIds.add(opening.id);
    });
  }
  
  // Materials validation
  if (!Array.isArray(manifest.materials)) {
    errors.push({
      entity: 'ProjectManifest',
      field: 'materials',
      value: manifest.materials,
      rule: 'must be array',
      message: 'Materials must be an array',
    });
  } else {
    manifest.materials.forEach((material, index) => {
      errors.push(...validateMaterial(material, index));
    });
  }
  
  // Lighting validation
  if (manifest.lighting) {
    errors.push(...validateLighting(manifest.lighting));
  } else {
    errors.push({
      entity: 'ProjectManifest',
      field: 'lighting',
      value: manifest.lighting,
      rule: 'required',
      message: 'Lighting configuration is required',
    });
  }
  
  // Grid size validation
  if (manifest.gridSize <= 0) {
    errors.push({
      entity: 'ProjectManifest',
      field: 'gridSize',
      value: manifest.gridSize,
      rule: 'gridSize > 0',
      message: 'Grid size must be greater than 0',
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Check for unknown keys (registry mismatch)
export function checkRegistryMismatch(manifest: any): string[] {
  const unknownKeys: string[] = [];
  
  const knownManifestKeys = new Set([
    'version', 'name', 'description', 'walls', 'openings', 'materials',
    'floorMaterial', 'lighting', 'gridSize', 'snapToGrid', 'metadata'
  ]);
  
  for (const key of Object.keys(manifest)) {
    if (!knownManifestKeys.has(key)) {
      unknownKeys.push(key);
    }
  }
  
  return unknownKeys;
}
