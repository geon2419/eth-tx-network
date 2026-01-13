import type { PointerEventHandler } from "react";

import type { CoSEEdge, CoSENode } from "../algorithms/layout";

type SimulationCanvasProps = {
  nodes: CoSENode[];
  edges: CoSEEdge[];
  width: number;
  height: number;
  onPointerDown?: PointerEventHandler<SVGSVGElement>;
  onPointerMove?: PointerEventHandler<SVGSVGElement>;
  onPointerUp?: PointerEventHandler<SVGSVGElement>;
  onPointerLeave?: PointerEventHandler<SVGSVGElement>;
  onPointerCancel?: PointerEventHandler<SVGSVGElement>;
};

type BoundEdge = {
  source: CoSENode;
  target: CoSENode;
};

type NodeViewProps = {
  node: CoSENode;
  fill: string;
  stroke: string;
  cursor?: string;
};

const buildChildrenByParent = (nodes: CoSENode[]) => {
  const map = new Map<string, CoSENode[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const list = map.get(node.parentId) ?? [];
    list.push(node);
    map.set(node.parentId, list);
  }
  return map;
};

const bindEdges = (nodes: CoSENode[], edges: CoSEEdge[]): BoundEdge[] => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return edges
    .map((edge) => {
      const source = byId.get(edge.source);
      const target = byId.get(edge.target);
      if (!source || !target) return null;
      return { source, target };
    })
    .filter((edge): edge is BoundEdge => edge !== null);
};

const NodeView = ({ node, fill, stroke, cursor }: NodeViewProps) => (
  <>
    <circle
      cx={node.x}
      cy={node.y}
      r={node.r}
      fill={fill}
      stroke={stroke}
      strokeWidth="1.5"
      style={cursor ? { cursor } : undefined}
    />
    <text
      x={node.x}
      y={node.y + 4}
      textAnchor="middle"
      fontSize="11"
      fill="black"
      fontWeight="600"
      style={cursor ? { cursor } : undefined}
    >
      {node.id}
    </text>
  </>
);

export function SimulationCanvas({
  nodes,
  edges,
  width,
  height,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
}: SimulationCanvasProps) {
  const childrenByParent = buildChildrenByParent(nodes);
  const boundEdges = bindEdges(nodes, edges);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const parents = Array.from(childrenByParent.keys())
    .map((parentId) => byId.get(parentId))
    .filter((node): node is CoSENode => node != null);

  const isParent = new Set(parents.map((parent) => parent.id));
  const parentStroke = "rgba(45,212,191,0.85)";
  const parentFill = "rgba(45,212,191,0.12)";
  const childFill = "rgba(59,130,246,0.9)";
  const parentNodeFill = "rgba(20,184,166,0.95)";
  const dragCursor = "grab";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height, touchAction: "none" }}
      role="img"
      aria-label="Raw CoSE simulation"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
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

      {parents.map((parent) => (
        <circle
          key={`${parent.id}-boundary`}
          cx={parent.x}
          cy={parent.y}
          r={parent.boundaryR ?? parent.r}
          fill={parentFill}
          stroke={parentStroke}
          strokeWidth="1.2"
          strokeDasharray="6 6"
        />
      ))}

      {boundEdges.map((edge, index) => (
        <line
          key={`edge-${edge.source.id}-${edge.target.id}-${index}`}
          x1={edge.source.x}
          y1={edge.source.y}
          x2={edge.target.x}
          y2={edge.target.y}
          stroke="rgba(14,116,144,0.7)"
          strokeWidth="1.5"
        />
      ))}

      {nodes.map((node) => {
        const parent = isParent.has(node.id);
        return (
          <NodeView
            key={node.id}
            node={node}
            fill={parent ? parentNodeFill : childFill}
            stroke="rgba(255,255,255,0.8)"
            cursor={dragCursor}
          />
        );
      })}
    </svg>
  );
}
