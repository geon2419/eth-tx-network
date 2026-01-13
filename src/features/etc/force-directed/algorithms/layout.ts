type NodeId = string;

/**
 * Represents a node in the force-directed graph layout.
 */
export type Node = {
  id: NodeId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
};

/**
 * Represents an edge connecting two nodes with spring-like properties.
 */
export type Edge = {
  source: NodeId;
  target: NodeId;
  idealLength?: number;
  strength?: number;
};

/**
 * Configuration options for force-directed layout simulation.
 */
export type Options = {
  iterations: number;
  repulsion: number; // 반발력
  gravity: number; // 중심으로 끌어당기는 힘
  damping: number; // 감쇠율
  step: number; // 힘 → 속도 스케일
  maxSpeed: number;
  epsilon: number;
  centerX: number;
  centerY: number;
};

type BoundEdge = {
  a: Node;
  b: Node;
  idealLength: number;
  strength: number;
};

type ForceAccumulation = {
  fx: Map<NodeId, number>;
  fy: Map<NodeId, number>;
};

const isBoundEdge = (edge: BoundEdge | null): edge is BoundEdge =>
  edge !== null;

/**
 * Binds edge references to actual node objects for efficient force calculation.
 * @param nodes - Array of nodes to index by ID
 * @param edges - Array of edge definitions with source/target IDs
 * @returns Array of edges with resolved node references
 */
const bindEdges = (nodes: Node[], edges: Edge[]): BoundEdge[] => {
  const nodeById = new Map<NodeId, Node>();
  for (const node of nodes) nodeById.set(node.id, node);

  return edges
    .map((edge) => {
      const a = nodeById.get(edge.source);
      const b = nodeById.get(edge.target);

      if (!a || !b) {
        return null;
      }

      return {
        a,
        b,
        idealLength: edge.idealLength ?? 80,
        strength: edge.strength ?? 0.1,
      };
    })
    .filter(isBoundEdge);
};

const defaults: Options = {
  iterations: 200,
  repulsion: 500,
  gravity: 0.01,
  damping: 0.9,
  step: 1.0,
  maxSpeed: 10,
  epsilon: 1e-4,
  centerX: 0,
  centerY: 0,
};

const initForces = (nodes: Node[]): ForceAccumulation => {
  const fx = new Map<NodeId, number>();
  const fy = new Map<NodeId, number>();

  for (const n of nodes) {
    fx.set(n.id, 0);
    fy.set(n.id, 0);
  }

  return { fx, fy };
};

/**
 * Calculates repulsion forces between all node pairs (O(n²) complexity).
 * @param nodes - Array of nodes to process
 * @param fx - Map accumulating horizontal forces by node ID
 * @param fy - Map accumulating vertical forces by node ID
 * @param options - Layout configuration including repulsion strength
 */
const accumulateRepulsion = (
  nodes: Node[],
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: Options
): void => {
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];

    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy + options.epsilon;
      const dist = Math.sqrt(distSq);

      const ux = dx / dist;
      const uy = dy / dist;

      const force = options.repulsion / distSq;

      const dfx = ux * force;
      const dfy = uy * force;

      fx.set(a.id, (fx.get(a.id) ?? 0) + dfx);
      fy.set(a.id, (fy.get(a.id) ?? 0) + dfy);
      fx.set(b.id, (fx.get(b.id) ?? 0) - dfx);
      fy.set(b.id, (fy.get(b.id) ?? 0) - dfy);
    }
  }
};

/**
 * Calculates spring forces along edges pulling or pushing nodes toward ideal length.
 * @param edges - Array of edges with bound node references
 * @param fx - Map accumulating horizontal forces by node ID
 * @param fy - Map accumulating vertical forces by node ID
 * @param options - Layout configuration (epsilon for stability)
 */
const accumulateSpring = (
  edges: BoundEdge[],
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: Options
): void => {
  for (const edge of edges) {
    const dx = edge.b.x - edge.a.x;
    const dy = edge.b.y - edge.a.y;
    const dist = Math.sqrt(dx * dx + dy * dy + options.epsilon);

    const ux = dx / dist;
    const uy = dy / dist;

    const force = edge.strength * (dist - edge.idealLength);

    const dfx = ux * force;
    const dfy = uy * force;

    fx.set(edge.a.id, (fx.get(edge.a.id) ?? 0) + dfx);
    fy.set(edge.a.id, (fy.get(edge.a.id) ?? 0) + dfy);
    fx.set(edge.b.id, (fx.get(edge.b.id) ?? 0) - dfx);
    fy.set(edge.b.id, (fy.get(edge.b.id) ?? 0) - dfy);
  }
};

/**
 * Applies gravity force pulling all nodes toward the center point.
 * @param nodes - Array of nodes to process
 * @param fx - Map accumulating horizontal forces by node ID
 * @param fy - Map accumulating vertical forces by node ID
 * @param options - Layout configuration including center coordinates and gravity strength
 */
const accumulateGravity = (
  nodes: Node[],
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: Options
): void => {
  for (const n of nodes) {
    const dx = options.centerX - n.x;
    const dy = options.centerY - n.y;

    fx.set(n.id, (fx.get(n.id) ?? 0) + dx * options.gravity);
    fy.set(n.id, (fy.get(n.id) ?? 0) + dy * options.gravity);
  }
};

const clampAbs = (value: number, maxAbs: number): number => {
  if (value > maxAbs) {
    return maxAbs;
  }

  if (value < -maxAbs) {
    return -maxAbs;
  }

  return value;
};

/**
 * Integrates accumulated forces into velocity and position using Verlet integration.
 * @param nodes - Array of nodes to update (skips fixed nodes)
 * @param fx - Map of horizontal forces by node ID
 * @param fy - Map of vertical forces by node ID
 * @param options - Layout configuration including damping, step size, and max speed
 */
const integrate = (
  nodes: Node[],
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: Options
): void => {
  for (const n of nodes) {
    if (n.fixed) {
      continue;
    }

    const ax = (fx.get(n.id) ?? 0) * options.step;
    const ay = (fy.get(n.id) ?? 0) * options.step;

    n.vx = (n.vx + ax) * options.damping;
    n.vy = (n.vy + ay) * options.damping;

    n.vx = clampAbs(n.vx, options.maxSpeed);
    n.vy = clampAbs(n.vy, options.maxSpeed);

    n.x += n.vx;
    n.y += n.vy;
  }
};

/**
 * Computes force-directed layout using repulsion, spring, and gravity forces.
 *
 * @example
 * ```ts
 * const nodes = [{ id: 'A', x: 0, y: 0, vx: 0, vy: 0 }];
 * const edges = [{ source: 'A', target: 'B' }];
 * const positioned = layout(nodes, edges, { iterations: 100 });
 * // positioned: nodes with updated x, y positions
 * ```
 *
 * @param nodes - Array of nodes with initial positions and velocities (mutated in place)
 * @param edges - Array of edges defining connections between nodes
 * @param opts - Optional configuration overrides for layout behavior
 * @returns The input nodes array with updated positions
 */
export const layout = (
  nodes: Node[],
  edges: Edge[],
  opts?: Partial<Options>
) => {
  const o = { ...defaults, ...opts };
  const boundEdges = bindEdges(nodes, edges);

  for (let iter = 0; iter < o.iterations; iter++) {
    const { fx, fy } = initForces(nodes);

    accumulateRepulsion(nodes, fx, fy, o);
    accumulateSpring(boundEdges, fx, fy, o);
    accumulateGravity(nodes, fx, fy, o);

    integrate(nodes, fx, fy, o);
  }

  return nodes;
};
