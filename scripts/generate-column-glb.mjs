#!/usr/bin/env node
/**
 * Generate a minimal architectural column GLB for the 3D viewport.
 * Unit footprint ~1 m × 1 m, height ~2.4 m (scaled at runtime to manifest width/depth).
 *
 * Usage: node scripts/generate-column-glb.mjs [outputPath]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT = join(ROOT, 'public/models/furniture/column.glb');

const SEGMENTS = 24;

function pushCylinder(
  positions,
  normals,
  indices,
  bottomY,
  topY,
  bottomRadius,
  topRadius,
  segmentCount,
) {
  const baseIndex = positions.length / 3;
  const height = topY - bottomY;

  for (let i = 0; i <= segmentCount; i += 1) {
    const t = (i / segmentCount) * Math.PI * 2;
    const cos = Math.cos(t);
    const sin = Math.sin(t);

    positions.push(bottomRadius * cos, bottomY, bottomRadius * sin);
    normals.push(cos, 0, sin);

    positions.push(topRadius * cos, topY, topRadius * sin);
    normals.push(cos, 0, sin);
  }

  for (let i = 0; i < segmentCount; i += 1) {
    const i0 = baseIndex + i * 2;
    const i1 = i0 + 1;
    const i2 = i0 + 2;
    const i3 = i0 + 3;
    indices.push(i0, i2, i1, i1, i2, i3);
  }

  // Cap normals for flat ends (used when radii match on that ring)
  void height;
}

function pushCap(positions, normals, indices, y, radius, segmentCount, facingUp) {
  const centerIndex = positions.length / 3;
  positions.push(0, y, 0);
  normals.push(0, facingUp ? 1 : -1, 0);

  const ringStart = positions.length / 3;
  for (let i = 0; i <= segmentCount; i += 1) {
    const t = (i / segmentCount) * Math.PI * 2;
    positions.push(radius * Math.cos(t), y, radius * Math.sin(t));
    normals.push(0, facingUp ? 1 : -1, 0);
  }

  for (let i = 0; i < segmentCount; i += 1) {
    const a = ringStart + i;
    const b = ringStart + i + 1;
    if (facingUp) {
      indices.push(centerIndex, a, b);
    } else {
      indices.push(centerIndex, b, a);
    }
  }
}

function buildColumnMesh() {
  const positions = [];
  const normals = [];
  const indices = [];

  // Base plinth
  pushCylinder(positions, normals, indices, 0, 0.08, 0.52, 0.52, SEGMENTS);
  pushCap(positions, normals, indices, 0, 0.52, SEGMENTS, false);

  // Shaft
  pushCylinder(positions, normals, indices, 0.08, 2.12, 0.38, 0.38, SEGMENTS);

  // Capital
  pushCylinder(positions, normals, indices, 2.12, 2.32, 0.5, 0.5, SEGMENTS);
  pushCap(positions, normals, indices, 2.32, 0.5, SEGMENTS, true);

  return { positions, normals, indices };
}

function packGlb(json, bin) {
  const jsonText = JSON.stringify(json);
  const jsonPadding = (4 - (jsonText.length % 4)) % 4;
  const jsonChunk = Buffer.concat([
    Buffer.from(jsonText + ' '.repeat(jsonPadding), 'utf8'),
  ]);

  const binPadding = (4 - (bin.length % 4)) % 4;
  const binChunk = Buffer.concat([bin, Buffer.alloc(binPadding)]);

  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

export function generateColumnGlbBuffer() {
  const { positions, normals, indices } = buildColumnMesh();

  const posArray = new Float32Array(positions);
  const normArray = new Float32Array(normals);
  const idxArray = new Uint16Array(indices);

  const posBytes = Buffer.from(new Uint8Array(posArray.buffer));
  const normBytes = Buffer.from(new Uint8Array(normArray.buffer));
  const idxBytes = Buffer.from(new Uint8Array(idxArray.buffer));

  const bin = Buffer.concat([posBytes, normBytes, idxBytes]);
  const posOffset = 0;
  const normOffset = posBytes.length;
  const idxOffset = posBytes.length + normBytes.length;

  const json = {
    asset: { version: '2.0', generator: 'vishvakarma-generate-column-glb' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'Column' }],
    meshes: [
      {
        name: 'ColumnMesh',
        primitives: [
          {
            attributes: {
              POSITION: 0,
              NORMAL: 1,
            },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: 'ColumnStone',
        pbrMetallicRoughness: {
          baseColorFactor: [0.72, 0.7, 0.66, 1],
          metallicFactor: 0.05,
          roughnessFactor: 0.82,
        },
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: 'VEC3',
        min: [-0.52, 0, -0.52],
        max: [0.52, 2.32, 0.52],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: normals.length / 3,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: indices.length,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: posOffset, byteLength: posBytes.length },
      { buffer: 0, byteOffset: normOffset, byteLength: normBytes.length },
      { buffer: 0, byteOffset: idxOffset, byteLength: idxBytes.length },
    ],
    buffers: [{ byteLength: bin.length }],
  };

  return packGlb(json, bin);
}

export function writeColumnGlb(dest = DEFAULT_OUT) {
  mkdirSync(dirname(dest), { recursive: true });
  const buffer = generateColumnGlbBuffer();
  writeFileSync(dest, buffer);
  return { dest, size: buffer.length };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const dest = process.argv[2] ? join(process.cwd(), process.argv[2]) : DEFAULT_OUT;
  const { size } = writeColumnGlb(dest);
  console.log(`Wrote ${dest} (${size} bytes)`);
}
