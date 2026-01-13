import type { Node } from "@/features/etc/force-directed/algorithms/layout";

type SimulationCanvasProps = {
  nodes: Node[];
  width: number;
  height: number;
};

type EdgeViewProps = {
  source: Node;
  target: Node;
};

type NodeViewProps = {
  node: Node;
  label: string;
  fill: string;
};

function EdgeView({ source, target }: EdgeViewProps) {
  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke="rgba(8,145,178,0.8)"
      strokeWidth="2"
    />
  );
}

function NodeView({ node, label, fill }: NodeViewProps) {
  return (
    <>
      <circle
        cx={node.x}
        cy={node.y}
        r="18"
        fill={fill}
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="1.5"
      />
      <text
        x={node.x}
        y={node.y + 4}
        textAnchor="middle"
        fontSize="12"
        fill="black"
        fontWeight="600"
      >
        {label}
      </text>
    </>
  );
}

export function SimulationCanvas({
  nodes,
  width,
  height,
}: SimulationCanvasProps) {
  const [nodeA, nodeB] = nodes;
  const nodeFillById: Record<string, string> = {
    A: "rgba(8,145,178,0.9)",
    B: "rgba(6,182,212,0.9)",
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-90 w-full"
      role="img"
      aria-label="Force-directed simulation"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <line
        x1={width / 2}
        y1="0"
        x2={width / 2}
        y2={height}
        stroke="rgba(255,255,255,0.06)"
      />
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="rgba(255,255,255,0.06)"
      />

      {nodeA && nodeB && (
        <>
          <EdgeView source={nodeA} target={nodeB} />
          <NodeView
            node={nodeA}
            label={nodeA.id}
            fill={nodeFillById[nodeA.id] ?? "rgba(8,145,178,0.9)"}
          />
          <NodeView
            node={nodeB}
            label={nodeB.id}
            fill={nodeFillById[nodeB.id] ?? "rgba(6,182,212,0.9)"}
          />
        </>
      )}
    </svg>
  );
}
