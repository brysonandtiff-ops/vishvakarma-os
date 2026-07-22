import { SANSKRIT_MATRIX_COLUMNS } from '@/components/common/SanskritRainBackground';

const CENTER = 200;
const STROKE_GOLD = 'hsl(43 90% 62% / 0.28)';
const STROKE_GOLD_BRIGHT = 'hsl(43 96% 72% / 0.36)';
const FILL_GOLD = 'hsl(43 100% 74% / 0.18)';

const GLYPH_RING_CHARS = SANSKRIT_MATRIX_COLUMNS.join(' · ').split('');

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function radialTicks(count: number, innerR: number, outerR: number, keyPrefix = 'tick') {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index * 360) / count;
    const inner = polarToCartesian(CENTER, CENTER, innerR, angle);
    const outer = polarToCartesian(CENTER, CENTER, outerR, angle);
    return (
      <line
        key={`${keyPrefix}-${index}`}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={STROKE_GOLD_BRIGHT}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    );
  });
}

function lotusPetals(count: number, innerR: number, outerR: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index * 360) / count;
    const tip = polarToCartesian(CENTER, CENTER, outerR, angle);
    const left = polarToCartesian(CENTER, CENTER, innerR, angle - 360 / count / 2.4);
    const right = polarToCartesian(CENTER, CENTER, innerR, angle + 360 / count / 2.4);
    const d = `M ${left.x} ${left.y} Q ${tip.x} ${tip.y} ${right.x} ${right.y} Z`;
    return (
      <path
        key={`petal-${index}`}
        d={d}
        fill={FILL_GOLD}
        stroke={STROKE_GOLD}
        strokeWidth={0.8}
      />
    );
  });
}

function yantraSquare(size: number) {
  const half = size / 2;
  const corners = [
    { x: CENTER - half, y: CENTER - half },
    { x: CENTER + half, y: CENTER - half },
    { x: CENTER + half, y: CENTER + half },
    { x: CENTER - half, y: CENTER + half },
  ];
  const gate = half * 0.28;

  return (
    <g transform={`rotate(45 ${CENTER} ${CENTER})`}>
      <rect
        x={CENTER - half}
        y={CENTER - half}
        width={size}
        height={size}
        fill="none"
        stroke={STROKE_GOLD_BRIGHT}
        strokeWidth={1}
      />
      {corners.map((corner, index) => (
        <polygon
          key={`gate-${index}`}
          points={`${corner.x},${corner.y} ${corner.x + (index % 2 === 0 ? gate : -gate)},${corner.y} ${corner.x},${corner.y + (index < 2 ? gate : -gate)}`}
          fill={FILL_GOLD}
          stroke={STROKE_GOLD}
          strokeWidth={0.6}
        />
      ))}
    </g>
  );
}

function starPointFrame(points: number, outerR: number, innerR: number) {
  const vertices: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * 360) / (points * 2);
    const r = i % 2 === 0 ? outerR : innerR;
    const { x, y } = polarToCartesian(CENTER, CENTER, r, angle);
    vertices.push(`${x},${y}`);
  }
  return (
    <polygon
      points={vertices.join(' ')}
      fill="none"
      stroke={STROKE_GOLD}
      strokeWidth={0.9}
      strokeLinejoin="round"
    />
  );
}

function crownSpires() {
  const spireCount = 7;
  const baseY = CENTER - 168;
  const spread = 140;

  return Array.from({ length: spireCount }, (_, index) => {
    const t = (index - (spireCount - 1) / 2) / ((spireCount - 1) / 2);
    const x = CENTER + t * spread;
    const height = 28 + (1 - Math.abs(t)) * 42;
    const width = 4 + (1 - Math.abs(t)) * 3;
    const peakY = baseY - height;

    return (
      <g key={`spire-${index}`} className="vish-mandala-spire">
        <path
          d={`M ${x - width} ${baseY} L ${x} ${peakY} L ${x + width} ${baseY} Z`}
          fill="none"
          stroke={STROKE_GOLD_BRIGHT}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
        <line
          x1={x}
          y1={peakY}
          x2={x}
          y2={peakY - height * 0.12}
          stroke={STROKE_GOLD_BRIGHT}
          strokeWidth={0.5}
          strokeLinecap="round"
        />
      </g>
    );
  });
}

function devanagariGlyphRing() {
  const radius = 148;
  const charCount = GLYPH_RING_CHARS.length;

  return GLYPH_RING_CHARS.map((char, index) => {
    if (!char.trim()) return null;
    const angle = (index * 360) / charCount;
    const { x, y } = polarToCartesian(CENTER, CENTER, radius, angle);
    const rotation = angle + 90;

    return (
      <text
        key={`glyph-${index}-${char}`}
        x={x}
        y={y}
        fill={STROKE_GOLD_BRIGHT}
        fontSize={7}
        fontFamily="'Noto Sans Devanagari', serif"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(${rotation} ${x} ${y})`}
        opacity={0.75}
      >
        {char}
      </text>
    );
  });
}

export function SacredMandalaLayer() {
  return (
    <div
      className="vish-mandala-aura vish-mandala-aura--marketing pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      <svg
        className="vish-mandala-svg vish-mandala-svg--outer"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        {starPointFrame(8, 192, 168)}
        <circle cx={CENTER} cy={CENTER} r={188} fill="none" stroke={STROKE_GOLD} strokeWidth={0.8} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={178}
          fill="none"
          stroke={STROKE_GOLD}
          strokeWidth={0.5}
          strokeDasharray="2 8"
        />
        {radialTicks(24, 158, 186, 'outer-tick')}
        {radialTicks(16, 152, 186)}
        <circle cx={CENTER} cy={CENTER} r={168} fill="none" stroke={STROKE_GOLD} strokeWidth={0.6} strokeDasharray="4 6" />
        <circle cx={CENTER} cy={CENTER} r={120} fill="none" stroke={STROKE_GOLD_BRIGHT} strokeWidth={0.7} />
        <g className="vish-mandala-spires">{crownSpires()}</g>
      </svg>

      <svg
        className="vish-mandala-svg vish-mandala-svg--glyph"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="vish-mandala-glyph-band">{devanagariGlyphRing()}</g>
      </svg>

      <svg
        className="vish-mandala-svg vish-mandala-svg--petals"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        {lotusPetals(12, 72, 118)}
        {yantraSquare(96)}
        <circle cx={CENTER} cy={CENTER} r={52} fill="none" stroke={STROKE_GOLD} strokeWidth={0.8} strokeDasharray="3 5" />
        <circle cx={CENTER} cy={CENTER} r={36} fill="none" stroke={STROKE_GOLD_BRIGHT} strokeWidth={0.6} />
      </svg>

      <svg
        className="vish-mandala-svg vish-mandala-svg--spike"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="vish-mandala-spike">
          <path
            d={`M ${CENTER} ${CENTER + 36} L ${CENTER - 6} ${CENTER + 72} L ${CENTER} ${CENTER + 118} L ${CENTER + 6} ${CENTER + 72} Z`}
            fill={FILL_GOLD}
            stroke={STROKE_GOLD_BRIGHT}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <div className="vish-mandala-ring vish-mandala-ring-outer vish-mandala-ring--marketing" />
      <div className="vish-mandala-ring vish-mandala-ring-mid vish-mandala-ring--marketing" />
      <div className="vish-mandala-ring vish-mandala-ring-inner vish-mandala-ring--marketing" />
      <div className="vish-mandala-bindu" />
    </div>
  );
}
