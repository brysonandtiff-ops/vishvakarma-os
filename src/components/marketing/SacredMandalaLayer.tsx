const CENTER = 200;
const STROKE_GOLD = 'hsl(43 90% 62% / 0.28)';
const STROKE_GOLD_BRIGHT = 'hsl(43 96% 72% / 0.36)';
const FILL_GOLD = 'hsl(43 100% 74% / 0.18)';

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function radialTicks(count: number, innerR: number, outerR: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index * 360) / count;
    const inner = polarToCartesian(CENTER, CENTER, innerR, angle);
    const outer = polarToCartesian(CENTER, CENTER, outerR, angle);
    return (
      <line
        key={`tick-${index}`}
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
        <circle cx={CENTER} cy={CENTER} r={188} fill="none" stroke={STROKE_GOLD} strokeWidth={0.8} />
        <circle cx={CENTER} cy={CENTER} r={168} fill="none" stroke={STROKE_GOLD} strokeWidth={0.6} strokeDasharray="4 6" />
        {radialTicks(16, 152, 186)}
        <circle cx={CENTER} cy={CENTER} r={120} fill="none" stroke={STROKE_GOLD_BRIGHT} strokeWidth={0.7} />
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

      <div className="vish-mandala-ring vish-mandala-ring-outer vish-mandala-ring--marketing" />
      <div className="vish-mandala-ring vish-mandala-ring-mid vish-mandala-ring--marketing" />
      <div className="vish-mandala-ring vish-mandala-ring-inner vish-mandala-ring--marketing" />
      <div className="vish-mandala-bindu" />
    </div>
  );
}
