import type { ArchitectureMapGraph } from '@/domain/buildings/generatedBuilding';

export default function ArchitectureMapView({ graph }: { graph: ArchitectureMapGraph }) {
  const nodes = graph.nodes;
  const positiveEdges = graph.edges.filter((e) => e.weight > 0).slice(0, 12);
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const cell = 72;

  const positions = new Map(
    nodes.map((node, index) => [
      node.id,
      { x: (index % cols) * cell + 40, y: Math.floor(index / cols) * cell + 40 },
    ])
  );

  const width = cols * cell + 40;
  const rows = Math.ceil(nodes.length / cols);
  const height = rows * cell + 40;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full rounded-xl border border-border/60 bg-muted/20" role="img" aria-label="Architecture adjacency map">
      {positiveEdges.map((edge) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="currentColor"
            strokeOpacity={Math.min(0.8, edge.weight / 10)}
            strokeWidth={Math.max(1, edge.weight / 4)}
            className="text-primary/50"
          />
        );
      })}
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        return (
          <g key={node.id}>
            <circle cx={pos.x} cy={pos.y} r={18} className="fill-primary/15 stroke-primary/60" strokeWidth={1.5} />
            <text x={pos.x} y={pos.y + 32} textAnchor="middle" className="fill-foreground text-[8px]">
              {node.label.length > 12 ? `${node.label.slice(0, 11)}…` : node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
