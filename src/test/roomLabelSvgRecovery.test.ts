import { describe, expect, it } from 'vitest';
import type { Room } from '@/types';
import { buildRoomLabelSvg } from '@/components/editor/blueprint/drawRooms';

function room(name: string): Room {
  return {
    id: 'room-1',
    name,
    roomType: 'living',
    wallIds: [],
    center: { x: 300, y: 200 },
    area: 12.5,
  } as Room;
}

describe('SVG room label recovery protection', () => {
  it('escapes XML-significant room names while preserving visible text', () => {
    const svg = buildRoomLabelSvg(room('R&D <Level 2> "East"'));

    expect(svg).toContain('R&amp;D &lt;Level 2&gt; &quot;East&quot;');
    expect(svg).not.toContain('>R&D <Level 2> "East"</text>');
  });

  it('does not treat markup-shaped names as SVG elements', () => {
    const svg = buildRoomLabelSvg(room('<script>alert("x")</script>'));

    expect(svg).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(svg).not.toContain('<script>');
  });

  it('keeps label geometry based on the original unescaped name length', () => {
    const name = 'R&D <Level 2>';
    const svg = buildRoomLabelSvg(room(name));
    const expectedWidth = Math.max(name.length * 7, '12.5 m²'.length * 6) + 20;

    expect(svg).toContain(`width="${expectedWidth}"`);
    expect(svg).toContain('12.5 m²');
  });

  it('returns no SVG when the room has no center', () => {
    expect(buildRoomLabelSvg({ ...room('No center'), center: undefined } as Room)).toBe('');
  });
});
