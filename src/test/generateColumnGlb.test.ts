import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateColumnGlbBuffer } from '../../scripts/generate-column-glb.mjs';

describe('generate-column-glb', () => {
  it('writes a valid GLB header and includes column asset on disk', () => {
    const buffer = generateColumnGlbBuffer();
    expect(buffer.length).toBeGreaterThan(200);
    expect(buffer.toString('ascii', 0, 4)).toBe('glTF');
    expect(buffer.readUInt32LE(4)).toBe(2);

    const onDisk = readFileSync(join(process.cwd(), 'public/models/furniture/column.glb'));
    expect(onDisk.length).toBe(buffer.length);
    expect(onDisk.toString('ascii', 0, 4)).toBe('glTF');
  });
});
