type NodeId = string;

/**
 * Represents a node in a hierarchical CoSE (Compound Spring Embedder) graph layout.
 * Supports parent-child relationships and boundary constraints for compound nodes.
 */
export type CoSENode = {
  id: NodeId;
  parentId?: NodeId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  boundaryR?: number;
  fixed?: boolean;
};

/**
 * Represents an edge with spring-like properties in the CoSE layout.
 */
export type CoSEEdge = {
  source: NodeId;
  target: NodeId;
  idealLength?: number;
  strength?: number;
};

/**
 * Configuration options for hierarchical CoSE layout with compound node support.
 */
export type CoSEOptions = {
  iterations: number;
  repulsion: number;
  gravity: number;
  defaultIdealLength: number;
  defaultEdgeStrength: number;
  linkK: number;
  boundaryK: number;
  overlapK: number;
  parentOverlapK: number;
  boundaryPadding: number;
  step: number;
  damping: number;
  maxSpeed: number;
  epsilon: number;
  centerX: number;
  centerY: number;
};

type BoundEdge = {
  a: CoSENode;
  b: CoSENode;
  L: number;
  k: number;
};

type ForceAccumulation = {
  fx: Map<NodeId, number>;
  fy: Map<NodeId, number>;
};

const defaults: CoSEOptions = {
  iterations: 200,
  repulsion: 800,
  gravity: 0.01,
  defaultIdealLength: 80,
  defaultEdgeStrength: 0.1,
  linkK: 0.02,
  boundaryK: 0.5,
  overlapK: 0.8,
  parentOverlapK: 0.6,
  boundaryPadding: 10,
  step: 1.0,
  damping: 0.9,
  maxSpeed: 10,
  epsilon: 1e-4,
  centerX: 0,
  centerY: 0,
};

const clampAbs = (value: number, maxAbs: number): number => {
  if (value > maxAbs) return maxAbs;
  if (value < -maxAbs) return -maxAbs;
  return value;
};

const addForce = (
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  id: NodeId,
  dx: number,
  dy: number
) => {
  fx.set(id, (fx.get(id) ?? 0) + dx);
  fy.set(id, (fy.get(id) ?? 0) + dy);
};

const initForces = (nodes: CoSENode[]): ForceAccumulation => {
  const fx = new Map<NodeId, number>();
  const fy = new Map<NodeId, number>();
  for (const n of nodes) {
    fx.set(n.id, 0);
    fy.set(n.id, 0);
  }
  return { fx, fy };
};

/**
 * Creates a lookup map for fast node access by ID.
 * @param nodes - Array of nodes to index
 * @returns Map of node IDs to node objects
 */
const buildNodeIndex = (nodes: CoSENode[]) => {
  const byId = new Map<NodeId, CoSENode>();
  for (const node of nodes) byId.set(node.id, node);
  return byId;
};

/**
 * Groups child nodes by their parent ID for hierarchical processing.
 * @param nodes - Array of nodes with potential parent relationships
 * @returns Map of parent IDs to arrays of child nodes
 */
const buildChildrenIndex = (nodes: CoSENode[]) => {
  const childrenByParent = new Map<NodeId, CoSENode[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const list = childrenByParent.get(node.parentId) ?? [];
    list.push(node);
    childrenByParent.set(node.parentId, list);
  }
  return childrenByParent;
};

const collectParents = (
  childrenByParent: Map<NodeId, CoSENode[]>,
  byId: Map<NodeId, CoSENode>
) => {
  const parents: CoSENode[] = [];
  for (const [parentId] of childrenByParent) {
    const parent = byId.get(parentId);
    if (parent) parents.push(parent);
  }
  return parents;
};

/**
 * Binds edge definitions to actual node references with default properties.
 * @param edges - Array of edge definitions with source/target IDs
 * @param byId - Node lookup map for resolving references
 * @param options - Layout options providing default edge properties
 * @returns Array of edges with resolved node references and properties
 */
const bindEdges = (
  edges: CoSEEdge[],
  byId: Map<NodeId, CoSENode>,
  options: CoSEOptions
): BoundEdge[] =>
  edges
    .map((edge) => {
      const a = byId.get(edge.source);
      const b = byId.get(edge.target);
      if (!a || !b) return null;
      return {
        a,
        b,
        L: edge.idealLength ?? options.defaultIdealLength,
        k: edge.strength ?? options.defaultEdgeStrength,
      };
    })
    .filter((edge): edge is BoundEdge => edge !== null);

/**
 * Initializes boundary radii for parent nodes if not already set.
 * @param parents - Array of parent nodes
 * @param options - Layout options including boundary padding
 */
const initParentBoundaries = (parents: CoSENode[], options: CoSEOptions) => {
  for (const parent of parents) {
    if (parent.boundaryR == null) {
      parent.boundaryR = parent.r + options.boundaryPadding;
    }
  }
};

/**
 * Calculates repulsion forces between all node pairs and additional separation for overlapping nodes.
 * @param nodes - Array of nodes to process
 * @param fx - Map accumulating horizontal forces by node ID
 * @param fy - Map accumulating vertical forces by node ID
 * @param options - Layout configuration including repulsion and overlap strengths
 */
const accumulateRepulsionAndOverlap = (
  nodes: CoSENode[],
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: CoSEOptions
) => {
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

      const repulsion = options.repulsion / distSq;
      addForce(fx, fy, a.id, ux * repulsion, uy * repulsion);
      addForce(fx, fy, b.id, -ux * repulsion, -uy * repulsion);

      const minDist = a.r + b.r;
      const overlap = minDist - dist;
      if (overlap > 0) {
        const separation = options.overlapK * overlap;
        addForce(fx, fy, a.id, ux * separation, uy * separation);
        addForce(fx, fy, b.id, -ux * separation, -uy * separation);
      }
    }
  }
};

/**
 * Calculates spring forces along edges based on deviation from ideal length.
 * @param edges - Array of edges with bound node references
 * @param fx - Map accumulating horizontal forces by node ID
 * @param fy - Map accumulating vertical forces by node ID
 * @param options - Layout configuration (epsilon for stability)
 */
const accumulateEdgeSprings = (
  edges: BoundEdge[],
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: CoSEOptions
) => {
  for (const edge of edges) {
    const dx = edge.b.x - edge.a.x;
    const dy = edge.b.y - edge.a.y;
    const dist = Math.sqrt(dx * dx + dy * dy + options.epsilon);
    const ux = dx / dist;
    const uy = dy / dist;
    const force = edge.k * (dist - edge.L);
    addForce(fx, fy, edge.a.id, ux * force, uy * force);
    addForce(fx, fy, edge.b.id, -ux * force, -uy * force);
  }
};

/**
 * Applies spring forces linking child nodes to their parent's center.
 * @param childrenByParent - Map of parent IDs to child node arrays
 * @param byId - Node lookup map for resolving parent references
 * @param fx - Map accumulating horizontal forces by node ID
 * @param fy - Map accumulating vertical forces by node ID
 * @param options - Layout configuration including link strength
 */
const accumulateParentChildLinks = (
  childrenByParent: Map<NodeId, CoSENode[]>,
  byId: Map<NodeId, CoSENode>,
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: CoSEOptions
) => {
  for (const [parentId, kids] of childrenByParent) {
    const parent = byId.get(parentId);
    if (!parent) continue;

    for (const child of kids) {
      const dx = child.x - parent.x;
      const dy = child.y - parent.y;
      const dist = Math.sqrt(dx * dx + dy * dy + options.epsilon);
      const ux = dx / dist;
      const uy = dy / dist;
      const force = options.linkK * dist;
      addForce(fx, fy, child.id, -ux * force, -uy * force);
      addForce(fx, fy, parent.id, ux * force, uy * force);
    }
  }
};

/**
 * Pushes child nodes back inside parent boundaries when they exceed the boundary radius.
 * @param childrenByParent - Map of parent IDs to child node arrays
 * @param byId - Node lookup map for resolving parent references
 * @param fx - Map accumulating horizontal forces by node ID
 * @param fy - Map accumulating vertical forces by node ID
 * @param options - Layout configuration including boundary force strength
 */
const accumulateBoundaryConstraints = (
  childrenByParent: Map<NodeId, CoSENode[]>,
  byId: Map<NodeId, CoSENode>,
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: CoSEOptions
) => {
  for (const [parentId, kids] of childrenByParent) {
    const parent = byId.get(parentId);
    if (!parent || parent.boundaryR == null) continue;

    for (const child of kids) {
      const dx = parent.x - child.x;
      const dy = parent.y - child.y;
      const dist = Math.sqrt(dx * dx + dy * dy + options.epsilon);
      const overrun = dist + child.r - parent.boundaryR;
      if (overrun > 0) {
        const ux = dx / dist;
        const uy = dy / dist;
        const force = options.boundaryK * overrun;
        addForce(fx, fy, child.id, ux * force, uy * force);
      }
    }
  }
};

/**
 * Applies separation forces between overlapping parent node boundaries.
 * @param parents - Array of parent nodes
 * @param fx - Map accumulating horizontal forces by node ID
 * @param fy - Map accumulating vertical forces by node ID
 * @param options - Layout configuration including parent overlap strength
 */
const accumulateParentOverlap = (
  parents: CoSENode[],
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: CoSEOptions
) => {
  for (let i = 0; i < parents.length; i++) {
    const a = parents[i];
    const ra = a.boundaryR ?? a.r;
    for (let j = i + 1; j < parents.length; j++) {
      const b = parents[j];
      const rb = b.boundaryR ?? b.r;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy + options.epsilon);
      const overlap = ra + rb - dist;
      if (overlap > 0) {
        const ux = dx / dist;
        const uy = dy / dist;
        const force = options.parentOverlapK * overlap;
        addForce(fx, fy, a.id, ux * force, uy * force);
        addForce(fx, fy, b.id, -ux * force, -uy * force);
      }
    }
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
  nodes: CoSENode[],
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: CoSEOptions
) => {
  for (const node of nodes) {
    const dx = options.centerX - node.x;
    const dy = options.centerY - node.y;
    addForce(fx, fy, node.id, dx * options.gravity, dy * options.gravity);
  }
};

/**
 * Integrates accumulated forces into velocity and position with hierarchy awareness.
 * @param nodes - Array of nodes to update (skips fixed nodes, handles parent movement)
 * @param childrenByParent - Map for tracking which nodes have children
 * @param fx - Map of horizontal forces by node ID
 * @param fy - Map of vertical forces by node ID
 * @param options - Layout configuration including damping, step size, and max speed
 * @returns Map of parent position deltas for propagating movement to children
 */
const integrate = (
  nodes: CoSENode[],
  childrenByParent: Map<NodeId, CoSENode[]>,
  fx: Map<NodeId, number>,
  fy: Map<NodeId, number>,
  options: CoSEOptions
) => {
  const parentDelta = new Map<NodeId, { dx: number; dy: number }>();
  for (const node of nodes) {
    if (node.fixed) continue;

    const ax = (fx.get(node.id) ?? 0) * options.step;
    const ay = (fy.get(node.id) ?? 0) * options.step;
    node.vx = (node.vx + ax) * options.damping;
    node.vy = (node.vy + ay) * options.damping;
    node.vx = clampAbs(node.vx, options.maxSpeed);
    node.vy = clampAbs(node.vy, options.maxSpeed);

    const oldX = node.x;
    const oldY = node.y;
    node.x += node.vx;
    node.y += node.vy;

    if (childrenByParent.has(node.id)) {
      parentDelta.set(node.id, { dx: node.x - oldX, dy: node.y - oldY });
    }
  }
  return parentDelta;
};

/**
 * Propagates parent node movement to all child nodes to maintain relative positions.
 * @param childrenByParent - Map of parent IDs to child node arrays
 * @param parentDelta - Map of position deltas for parent nodes that moved
 */
const applyParentDelta = (
  childrenByParent: Map<NodeId, CoSENode[]>,
  parentDelta: Map<NodeId, { dx: number; dy: number }>
) => {
  for (const [parentId, delta] of parentDelta) {
    const kids = childrenByParent.get(parentId);
    if (!kids) continue;
    for (const child of kids) {
      if (child.fixed) continue;
      child.x += delta.dx;
      child.y += delta.dy;
      child.vx += delta.dx;
      child.vy += delta.dy;
    }
  }
};

/**
 * Recalculates parent boundary radii based on maximum child distance from parent center.
 * @param parents - Array of parent nodes to update
 * @param childrenByParent - Map of parent IDs to child node arrays
 * @param options - Layout configuration including boundary padding
 */
const updateParentBoundaries = (
  parents: CoSENode[],
  childrenByParent: Map<NodeId, CoSENode[]>,
  options: CoSEOptions
) => {
  for (const parent of parents) {
    const kids = childrenByParent.get(parent.id);
    if (!kids || kids.length === 0) continue;

    let maxNeeded = 0;
    for (const child of kids) {
      const dx = child.x - parent.x;
      const dy = child.y - parent.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const needed = dist + child.r;
      if (needed > maxNeeded) {
        maxNeeded = needed;
      }
    }
    parent.boundaryR = maxNeeded + options.boundaryPadding;
  }
};

/**
 * Computes hierarchical CoSE layout with compound node support and multiple force types.
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: 'P', x: 0, y: 0, vx: 0, vy: 0, r: 20, boundaryR: 100 },
 *   { id: 'A', parentId: 'P', x: 10, y: 10, vx: 0, vy: 0, r: 8 }
 * ];
 * const edges = [{ source: 'A', target: 'B' }];
 * const positioned = runCoSELayout(nodes, edges, { iterations: 100 });
 * // positioned: nodes with updated positions respecting hierarchy
 * ```
 *
 * @param nodes - Array of nodes with initial positions (mutated in place)
 * @param edges - Array of edges defining connections
 * @param opts - Optional configuration overrides for layout behavior
 * @returns The input nodes array with updated positions and boundaries
 */
export const runCoSELayout = (
  nodes: CoSENode[],
  edges: CoSEEdge[],
  opts?: Partial<CoSEOptions>
) => {
  const o: CoSEOptions = { ...defaults, ...opts };

  const byId = buildNodeIndex(nodes);
  const childrenByParent = buildChildrenIndex(nodes);
  const parents = collectParents(childrenByParent, byId);
  const boundEdges = bindEdges(edges, byId, o);

  initParentBoundaries(parents, o);

  for (let iter = 0; iter < o.iterations; iter++) {
    const { fx, fy } = initForces(nodes);

    // 힘 축적 단계
    accumulateRepulsionAndOverlap(nodes, fx, fy, o); // 노드 간 반발력 및 겹침 힘
    accumulateEdgeSprings(boundEdges, fx, fy, o); // 엣지 스프링 힘
    accumulateParentChildLinks(childrenByParent, byId, fx, fy, o); // 부모-자식 링크 힘
    accumulateBoundaryConstraints(childrenByParent, byId, fx, fy, o); // 경계 제약 힘
    accumulateParentOverlap(parents, fx, fy, o); // 부모 노드 간 겹침 힘
    accumulateGravity(nodes, fx, fy, o); // 중력 힘
    const parentDelta = integrate(nodes, childrenByParent, fx, fy, o); // 통합 단계
    applyParentDelta(childrenByParent, parentDelta); // 부모 이동에 따른 자식 노드 이동
    updateParentBoundaries(parents, childrenByParent, o); // 부모 경계 업데이트
  }

  return nodes;
};
