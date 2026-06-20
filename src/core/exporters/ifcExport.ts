import type { ProjectManifest } from '@/types';

/**
 * Minimal but structurally-valid IFC4 (ISO-10303-21 / STEP) export.
 *
 * Emits a real spatial hierarchy (Project → Site → Building → Storey), millimetre units,
 * walls as extruded-area solids, and doors/windows as placed IfcDoor/IfcWindow elements.
 * This is the BIM interchange path for Revit/ArchiCAD/IFC viewers — a CAD deliverable, not
 * a raster. Coordinates are converted from manifest pixels to millimetres (1px = 5mm).
 */

const PX_TO_MM = 5;
const mm = (px: number) => Number((px * PX_TO_MM).toFixed(2));

const IFC_B64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';

/** Deterministic 22-char IFC GlobalId (encodes the index so ids are unique per file). */
function ifcGuid(index: number): string {
  const chars: string[] = [];
  let v = index + 1;
  for (let i = 0; i < 6; i++) {
    chars.push(IFC_B64[v % 64]);
    v = Math.floor(v / 64);
  }
  while (chars.length < 22) {
    chars.push(IFC_B64[(chars.length * 7 + index) % 64]);
  }
  return chars.join('');
}

/** STEP real literal — always carries a decimal point. */
function r(n: number): string {
  return Number.isInteger(n) ? `${n}.` : String(n);
}

function escapeStep(value: string): string {
  return value.replace(/'/g, "''");
}

class StepWriter {
  private lines: string[] = [];
  private id = 0;
  private guidIndex = 0;

  add(entity: string): number {
    const ref = ++this.id;
    this.lines.push(`#${ref}=${entity};`);
    return ref;
  }

  guid(): string {
    return ifcGuid(this.guidIndex++);
  }

  body(): string {
    return this.lines.join('\n');
  }
}

export function exportManifestToIfc(manifest: ProjectManifest, now: Date = new Date()): string {
  const w = new StepWriter();

  // Shared geometric primitives.
  const pOrigin = w.add('IFCCARTESIANPOINT((0.,0.,0.))');
  const dZ = w.add('IFCDIRECTION((0.,0.,1.))');
  const dX = w.add('IFCDIRECTION((1.,0.,0.))');
  const worldAxis = w.add(`IFCAXIS2PLACEMENT3D(#${pOrigin},#${dZ},#${dX})`);
  const p2dOrigin = w.add('IFCCARTESIANPOINT((0.,0.))');
  const d2dX = w.add('IFCDIRECTION((1.,0.))');
  const profilePlacement = w.add(`IFCAXIS2PLACEMENT2D(#${p2dOrigin},#${d2dX})`);

  // Units (millimetre / square + cubic metre / radian).
  const lenUnit = w.add('IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)');
  const areaUnit = w.add('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)');
  const volUnit = w.add('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)');
  const angleUnit = w.add('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)');
  const unitAssignment = w.add(
    `IFCUNITASSIGNMENT((#${lenUnit},#${areaUnit},#${volUnit},#${angleUnit}))`,
  );

  const context = w.add(
    `IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.0E-5,#${worldAxis},$)`,
  );

  const project = w.add(
    `IFCPROJECT('${w.guid()}',$,'${escapeStep(manifest.name || 'Vishvakarma Project')}',$,$,$,$,(#${context}),#${unitAssignment})`,
  );

  // Spatial hierarchy with nested local placements.
  const sitePlacement = w.add(`IFCLOCALPLACEMENT($,#${worldAxis})`);
  const site = w.add(
    `IFCSITE('${w.guid()}',$,'Site',$,$,#${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$)`,
  );
  const buildingPlacement = w.add(`IFCLOCALPLACEMENT(#${sitePlacement},#${worldAxis})`);
  const building = w.add(
    `IFCBUILDING('${w.guid()}',$,'Building',$,$,#${buildingPlacement},$,$,.ELEMENT.,$,$,$)`,
  );
  const storeyPlacement = w.add(`IFCLOCALPLACEMENT(#${buildingPlacement},#${worldAxis})`);
  const storey = w.add(
    `IFCBUILDINGSTOREY('${w.guid()}',$,'Ground Floor',$,$,#${storeyPlacement},$,$,.ELEMENT.,0.)`,
  );

  w.add(`IFCRELAGGREGATES('${w.guid()}',$,$,$,#${project},(#${site}))`);
  w.add(`IFCRELAGGREGATES('${w.guid()}',$,$,$,#${site},(#${building}))`);
  w.add(`IFCRELAGGREGATES('${w.guid()}',$,$,$,#${building},(#${storey}))`);

  const elementRefs: number[] = [];

  /** Builds an extruded-box product placed at (x,y,z) rotated by `angle` rad. */
  function placedBox(
    name: string,
    x: number,
    y: number,
    z: number,
    angle: number,
    xDim: number,
    yDim: number,
    height: number,
  ): { placement: number; shape: number } {
    const loc = w.add(`IFCCARTESIANPOINT((${r(x)},${r(y)},${r(z)}))`);
    const refDir = w.add(`IFCDIRECTION((${r(Math.cos(angle))},${r(Math.sin(angle))},0.))`);
    const axis = w.add(`IFCAXIS2PLACEMENT3D(#${loc},#${dZ},#${refDir})`);
    const placement = w.add(`IFCLOCALPLACEMENT(#${storeyPlacement},#${axis})`);

    const profile = w.add(
      `IFCRECTANGLEPROFILEDEF(.AREA.,'${escapeStep(name)}',#${profilePlacement},${r(xDim)},${r(yDim)})`,
    );
    const solid = w.add(`IFCEXTRUDEDAREASOLID(#${profile},#${worldAxis},#${dZ},${r(height)})`);
    const shapeRep = w.add(
      `IFCSHAPEREPRESENTATION(#${context},'Body','SweptSolid',(#${solid}))`,
    );
    const shape = w.add(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    return { placement, shape };
  }

  // Walls as extruded solids (footprint = length × thickness, extruded up by height).
  for (const wall of manifest.walls) {
    const sx = mm(wall.start.x);
    const sy = mm(wall.start.y);
    const ex = mm(wall.end.x);
    const ey = mm(wall.end.y);
    const length = Math.hypot(ex - sx, ey - sy);
    if (length === 0) continue;
    const angle = Math.atan2(ey - sy, ex - sx);
    const midX = (sx + ex) / 2;
    const midY = (sy + ey) / 2;
    const thickness = mm(wall.thickness ?? 100);
    const height = mm(wall.height ?? 560); // 560px ≈ 2800mm default ceiling

    const { placement, shape } = placedBox('Wall', midX, midY, 0, angle, length, thickness, height);
    const wallRef = w.add(
      `IFCWALL('${w.guid()}',$,'Wall',$,$,#${placement},#${shape},$,.STANDARD.)`,
    );
    elementRefs.push(wallRef);
  }

  // Doors and windows as placed elements with simple box geometry.
  for (const opening of manifest.openings) {
    const wall = manifest.walls.find((wl) => wl.id === opening.wallId);
    if (!wall) continue;
    const sx = mm(wall.start.x);
    const sy = mm(wall.start.y);
    const ex = mm(wall.end.x);
    const ey = mm(wall.end.y);
    const angle = Math.atan2(ey - sy, ex - sx);
    const x = sx + (ex - sx) * opening.position;
    const y = sy + (ey - sy) * opening.position;
    const width = mm(opening.width);
    const height = mm(opening.height);
    const thickness = mm(wall.thickness ?? 100);
    const isDoor = opening.type === 'door';
    const z = isDoor ? 0 : mm(opening.sillHeight ?? 180); // 180px ≈ 900mm sill

    const { placement, shape } = placedBox(
      isDoor ? 'Door' : 'Window',
      x,
      y,
      z,
      angle,
      width,
      thickness,
      height,
    );

    const ref = isDoor
      ? w.add(
          `IFCDOOR('${w.guid()}',$,'Door',$,$,#${placement},#${shape},$,${r(height)},${r(width)},.DOOR.,.SINGLE_SWING_LEFT.,$)`,
        )
      : w.add(
          `IFCWINDOW('${w.guid()}',$,'Window',$,$,#${placement},#${shape},$,${r(height)},${r(width)},.WINDOW.,.NOTDEFINED.,$)`,
        );
    elementRefs.push(ref);
  }

  if (elementRefs.length > 0) {
    const list = elementRefs.map((ref) => `#${ref}`).join(',');
    w.add(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${w.guid()}',$,$,$,(${list}),#${storey})`);
  }

  const timestamp = now.toISOString().replace(/\.\d+Z$/, '');
  const safeName = escapeStep(manifest.name || 'project');

  return [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');",
    `FILE_NAME('${safeName}.ifc','${timestamp}',(''),(''),'Vishvakarma.OS','Vishvakarma.OS','');`,
    "FILE_SCHEMA(('IFC4'));",
    'ENDSEC;',
    'DATA;',
    w.body(),
    'ENDSEC;',
    'END-ISO-10303-21;',
    '',
  ].join('\n');
}
