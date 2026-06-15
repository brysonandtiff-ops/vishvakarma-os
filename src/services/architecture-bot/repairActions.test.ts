import { describe, expect, it, vi } from 'vitest';
import { PX_PER_METER } from '@/domain/constants';
import { NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import { createProjectManifest } from '@/core/projectModel';
import { repairDoorWidths, repairWallHeights } from '@/services/architecture-bot/repairActions';

describe('repairActions', () => {
  it('raises walls below NCC minimum height', () => {
    const manifest = createProjectManifest({
      name: 'Fix walls',
      walls: [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          thickness: 10,
          height: 40,
          material: 'material-concrete',
        },
      ],
    });

    const onUpdateWall = vi.fn();
    const results = repairWallHeights({ ...manifest, jurisdiction: 'au' }, { onUpdateWall });

    expect(results).toHaveLength(1);
    expect(onUpdateWall).toHaveBeenCalledWith('w1', {
      height: NCC_AU_THRESHOLDS.minWallHeightM * PX_PER_METER,
    });
  });

  it('widens doors below NCC minimum width', () => {
    const manifest = createProjectManifest({
      name: 'Fix doors',
      walls: [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          thickness: 10,
          height: 240,
          material: 'material-concrete',
        },
      ],
      openings: [
        {
          id: 'd1',
          type: 'door',
          wallId: 'w1',
          position: 0.5,
          width: 10,
          height: 200,
        },
      ],
    });

    const onUpdateOpening = vi.fn();
    const results = repairDoorWidths({ ...manifest, jurisdiction: 'au' }, { onUpdateOpening });

    expect(results).toHaveLength(1);
    expect(onUpdateOpening).toHaveBeenCalledWith('d1', {
      width: NCC_AU_THRESHOLDS.minDoorWidthM * PX_PER_METER,
    });
  });
});
