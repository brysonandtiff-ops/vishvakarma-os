// Measurement utilities for precise dimension handling

export type UnitSystem = 'metric' | 'imperial';
export type Unit = 'px' | 'cm' | 'm' | 'ft' | 'in';

// Conversion constants
const PX_TO_CM = 0.5; // 20px = 10cm (scale: 2px = 1cm)
const CM_TO_M = 0.01;
const CM_TO_IN = 0.393701;
const IN_TO_FT = 1 / 12;

/**
 * Convert pixels to centimeters
 */
export function pixelsToCentimeters(pixels: number): number {
  return pixels * PX_TO_CM;
}

/**
 * Convert centimeters to pixels
 */
export function centimetersToPixels(cm: number): number {
  return cm / PX_TO_CM;
}

/**
 * Convert centimeters to meters
 */
export function centimetersToMeters(cm: number): number {
  return cm * CM_TO_M;
}

/**
 * Convert centimeters to inches
 */
export function centimetersToInches(cm: number): number {
  return cm * CM_TO_IN;
}

/**
 * Convert centimeters to feet
 */
export function centimetersToFeet(cm: number): number {
  return (cm * CM_TO_IN) * IN_TO_FT;
}

/**
 * Format dimension with appropriate unit
 */
export function formatDimension(
  pixels: number,
  unit: Unit = 'cm',
  precision: number = 0
): string {
  const cm = pixelsToCentimeters(pixels);
  
  switch (unit) {
    case 'px':
      return `${Math.round(pixels)}px`;
    case 'cm':
      return `${cm.toFixed(precision)}cm`;
    case 'm':
      return `${centimetersToMeters(cm).toFixed(precision + 2)}m`;
    case 'ft':
      return `${centimetersToFeet(cm).toFixed(precision + 1)}ft`;
    case 'in':
      return `${centimetersToInches(cm).toFixed(precision)}in`;
    default:
      return `${cm.toFixed(precision)}cm`;
  }
}

/**
 * Format dimension with unit system (metric or imperial)
 */
export function formatDimensionBySystem(
  pixels: number,
  system: UnitSystem = 'metric',
  precision: number = 0
): string {
  const cm = pixelsToCentimeters(pixels);
  
  if (system === 'imperial') {
    const inches = centimetersToInches(cm);
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    
    if (feet > 0) {
      return `${feet}' ${remainingInches.toFixed(precision)}"`;
    }
    return `${inches.toFixed(precision)}"`;
  }
  
  // Metric system
  if (cm >= 100) {
    return `${centimetersToMeters(cm).toFixed(2)}m`;
  }
  return `${cm.toFixed(precision)}cm`;
}

/**
 * Format area with appropriate unit
 */
export function formatArea(
  squarePixels: number,
  system: UnitSystem = 'metric',
  precision: number = 2
): string {
  const squareCm = squarePixels * (PX_TO_CM * PX_TO_CM);
  
  if (system === 'imperial') {
    const squareInches = squareCm * (CM_TO_IN * CM_TO_IN);
    const squareFeet = squareInches / 144;
    return `${squareFeet.toFixed(precision)} sq ft`;
  }
  
  // Metric system
  const squareMeters = squareCm / 10000;
  return `${squareMeters.toFixed(precision)} m²`;
}

/**
 * Check if two line segments overlap (for opening collision detection)
 */
export function segmentsOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
  tolerance: number = 0.01
): boolean {
  // Normalize so start < end
  const [s1, e1] = start1 < end1 ? [start1, end1] : [end1, start1];
  const [s2, e2] = start2 < end2 ? [start2, end2] : [end2, start2];
  
  // Check for overlap with tolerance
  return !(e1 + tolerance < s2 || e2 + tolerance < s1);
}

/**
 * Check if an opening overlaps with other openings on the same wall
 */
export function checkOpeningOverlap(
  position: number,
  width: number,
  wallLength: number,
  otherOpenings: Array<{ position: number; width: number }>,
  tolerance: number = 0.05
): boolean {
  // Convert width from cm to parametric position (0-1)
  const widthParam = (width / 100) / (wallLength / 100);
  const halfWidth = widthParam / 2;
  
  const start = position - halfWidth;
  const end = position + halfWidth;
  
  // Check against all other openings
  for (const other of otherOpenings) {
    const otherWidthParam = (other.width / 100) / (wallLength / 100);
    const otherHalfWidth = otherWidthParam / 2;
    const otherStart = other.position - otherHalfWidth;
    const otherEnd = other.position + otherHalfWidth;
    
    if (segmentsOverlap(start, end, otherStart, otherEnd, tolerance)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if an opening is within wall boundaries
 */
export function isOpeningInBounds(
  position: number,
  width: number,
  wallLength: number,
  tolerance: number = 0.05
): boolean {
  // Convert width from cm to parametric position (0-1)
  const widthParam = (width / 100) / (wallLength / 100);
  const halfWidth = widthParam / 2;
  
  const start = position - halfWidth;
  const end = position + halfWidth;
  
  return start >= -tolerance && end <= 1 + tolerance;
}

/**
 * Round to nearest snap value
 */
export function roundToSnap(value: number, snapSize: number): number {
  return Math.round(value / snapSize) * snapSize;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
